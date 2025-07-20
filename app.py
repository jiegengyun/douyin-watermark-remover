from flask import Flask, request, jsonify, Response
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS, cross_origin
from werkzeug.security import generate_password_hash, check_password_hash
import time
from datetime import datetime, timedelta
import os
import re
import requests
import json
import threading

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your-jwt-secret-key'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'

# 允许带认证信息的跨域请求，允许Authorization头
from flask_cors import CORS

CORS(app,
     supports_credentials=True,
     origins=[
         "http://localhost:3000",
         "http://127.0.0.1:3000",
         "http://10.0.0.13:3000",
         "*"
     ],
     methods=["GET", "POST", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"])
db = SQLAlchemy(app)
jwt = JWTManager(app)

# 用户模型
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# 历史记录模型
class History(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    platform = db.Column(db.String(32), nullable=False)
    url = db.Column(db.String(512), nullable=False)
    result = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('histories', lazy=True))

# 平台识别
PLATFORM_PATTERNS = {
    'douyin': r'(v\.douyin\.com|douyin\.com)',
    'kuaishou': r'(kuaishou\.com|gifshow\.com)',
    'xiaohongshu': r'(xiaohongshu\.com|xhslink\.com)'
}

def identify_platform(url):
    for platform, pattern in PLATFORM_PATTERNS.items():
        if re.search(pattern, url):
            return platform
    return None

# 抖音无水印解析（Selenium版本）
def parse_douyin(url):
    try:
        print(f"开始使用Selenium解析抖音链接: {url}")
        # 导入Selenium解析器
        try:
            from douyin_selenium_parser import parse_douyin_with_selenium
            result = parse_douyin_with_selenium(url)
            if result.get('video_url'):
                print(f"Selenium解析成功: {result}")
                return result
            else:
                print("Selenium解析失败")
                return {'error': 'Selenium解析失败，未获取到视频链接'}
        except ImportError:
            print("Selenium解析器未找到")
            return {'error': 'Selenium解析器未找到'}
        except Exception as e:
            print(f"Selenium解析异常: {e}")
            return {'error': f'Selenium解析异常: {str(e)}'}
    except Exception as e:
        print(f"抖音解析异常: {str(e)}")
        return {'error': f'抖音解析失败: {str(e)}'}

def parse_kuaishou(url):
    try:
        print(f"开始使用Selenium解析快手链接: {url}")
        try:
            from douyin_selenium_parser import parse_kuaishou_with_selenium
            result = parse_kuaishou_with_selenium(url)
            if result.get('video_url'):
                print(f"快手Selenium解析成功: {result}")
                return result
            else:
                print("快手Selenium解析失败")
                return {'error': '快手Selenium解析失败，未获取到视频链接'}
        except ImportError:
            print("快手Selenium解析器未找到")
            return {'error': '快手Selenium解析器未找到'}
        except Exception as e:
            print(f"快手Selenium解析异常: {e}")
            return {'error': f'快手Selenium解析异常: {str(e)}'}
    except Exception as e:
        print(f"快手解析异常: {str(e)}")
        return {'error': f'快手解析失败: {str(e)}'}

def parse_xiaohongshu(url):
    try:
        print(f"开始使用Selenium解析小红书链接: {url}")
        try:
            from douyin_selenium_parser import parse_xiaohongshu_with_selenium
            result = parse_xiaohongshu_with_selenium(url)
            if result.get('video_url'):
                print(f"小红书Selenium解析成功: {result}")
                return result
            else:
                print("小红书Selenium解析失败")
                return {'error': '小红书Selenium解析失败，未获取到视频链接'}
        except ImportError:
            print("小红书Selenium解析器未找到")
            return {'error': '小红书Selenium解析器未找到'}
        except Exception as e:
            print(f"小红书Selenium解析异常: {e}")
            return {'error': f'小红书Selenium解析异常: {str(e)}'}
    except Exception as e:
        print(f"小红书解析异常: {str(e)}")
        return {'error': f'小红书解析失败: {str(e)}'}

# 代理播放视频（Selenium版本）
@app.route('/api/stream/<video_id>', methods=['GET'])
def stream_video(video_id):
    try:
        print(f"开始获取视频流: {video_id}")
        
        # 尝试使用Selenium获取真实视频链接
        try:
            from douyin_selenium_parser import get_video_stream_with_selenium
            video_url = get_video_stream_with_selenium(video_id)
            
            if video_url:
                print(f"Selenium获取到视频链接: {video_url}")
            else:
                print("Selenium获取失败，使用备用方法")
                # 备用方法：构造默认链接
                video_url = f"https://aweme.snssdk.com/aweme/v1/play/?video_id={video_id}&ratio=720p&line=0"
                
        except ImportError:
            print("Selenium解析器未找到，使用备用方法")
            video_url = f"https://aweme.snssdk.com/aweme/v1/play/?video_id={video_id}&ratio=720p&line=0"
        except Exception as e:
            print(f"Selenium获取异常: {e}")
            video_url = f"https://aweme.snssdk.com/aweme/v1/play/?video_id={video_id}&ratio=720p&line=0"
        
        # 设置请求头
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.douyin.com/',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Connection': 'keep-alive',
            'Range': request.headers.get('Range', 'bytes=0-')
        }
        
        # 代理请求视频
        response = requests.get(video_url, headers=headers, stream=True, timeout=30)
        
        if response.status_code in [200, 206]:
            # 设置响应头
            resp_headers = {
                'Content-Type': 'video/mp4',
                'Accept-Ranges': 'bytes',
                'Content-Length': response.headers.get('Content-Length', ''),
                'Cache-Control': 'no-cache',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Range'
            }
            
            if response.status_code == 206:
                resp_headers['Content-Range'] = response.headers.get('Content-Range', '')
            
            # 流式返回视频数据
            def generate():
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        yield chunk
            
            return app.response_class(
                generate(),
                status=response.status_code,
                headers=resp_headers,
                mimetype='video/mp4'
            )
        else:
            return jsonify({'error': f'视频获取失败，状态码: {response.status_code}'}), 400
            
    except Exception as e:
        return jsonify({'error': f'视频流异常: {str(e)}'}), 500

# 下载视频
@app.route('/api/download', methods=['POST'])
@jwt_required()
def download_video():
    try:
        data = request.json
        video_url = data.get('video_url')
        title = data.get('title', '抖音视频')
        
        if not video_url:
            return jsonify({'error': '视频链接不能为空'}), 400
        
        # 从URL中提取视频ID
        video_id_match = re.search(r'video_id=(\d+)', video_url)
        if video_id_match:
            video_id = video_id_match.group(1)
            
            # 使用代理下载
            proxy_url = f"http://localhost:5000/api/stream/{video_id}"
            
            return jsonify({
                'success': True,
                'message': '视频下载准备完成',
                'download_url': proxy_url,
                'filename': f"{title}_{video_id}.mp4"
            })
        else:
            return jsonify({
                'success': False,
                'message': '无法提取视频ID',
                'error': '视频链接格式不正确'
            })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'下载异常: {str(e)}',
            'error': '视频处理失败'
        })

# 初始化数据库
@app.before_first_request
def create_tables():
    db.create_all()

# 用户注册
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        print(f"注册请求数据: {data}")  # 调试信息
        
        if not data:
            return jsonify({'msg': '请求数据为空'}), 400
            
        username = data.get('username')
        password = data.get('password')
        
        print(f"用户名: {username}, 密码长度: {len(password) if password else 0}")  # 调试信息
        
        if not username or not password:
            return jsonify({'msg': '用户名和密码不能为空'}), 400
            
        if len(username) < 3:
            return jsonify({'msg': '用户名至少3个字符'}), 400
            
        if len(password) < 6:
            return jsonify({'msg': '密码至少6个字符'}), 400
            
        # 检查用户名是否已存在
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return jsonify({'msg': '用户名已存在'}), 400
            
        # 创建新用户
        user = User(username=username)
        user.set_password(password)
        
        print(f"准备添加用户: {username}")  # 调试信息
        
        db.session.add(user)
        db.session.commit()
        
        print(f"用户注册成功: {username}")  # 调试信息
        return jsonify({'msg': '注册成功'}), 201
        
    except Exception as e:
        print(f"注册异常: {str(e)}")  # 调试信息
        db.session.rollback()
        return jsonify({'msg': f'注册失败: {str(e)}'}), 500

# 用户登录
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'msg': '用户名和密码不能为空'}), 400
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            access_token = create_access_token(identity=str(user.id))
            return jsonify({
                'msg': '登录成功',
                'access_token': access_token,
                'username': username
            }), 200
        else:
            return jsonify({'msg': '用户名或密码错误'}), 401
            
    except Exception as e:
        return jsonify({'msg': f'登录失败: {str(e)}'}), 500

# 获取历史记录
@app.route('/api/history', methods=['GET'])
@jwt_required()
def get_history():
    try:
        user_id = int(get_jwt_identity())
        # 新增分页、筛选、搜索参数
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('page_size', 10))
        platform = request.args.get('platform')
        keyword = request.args.get('keyword')
        query = History.query.filter_by(user_id=user_id)
        if platform:
            query = query.filter_by(platform=platform)
        if keyword:
            query = query.filter(History.url.contains(keyword) | History.result.contains(keyword))
        total = query.count()
        histories = query.order_by(History.created_at.desc()).offset((page-1)*page_size).limit(page_size).all()
        history_list = []
        for history in histories:
            history_list.append({
                'id': history.id,
                'platform': history.platform,
                'url': history.url,
                'result': history.result,
                'created_at': history.created_at.strftime('%Y-%m-%d %H:%M:%S')
            })
        return jsonify({'histories': history_list, 'total': total, 'page': page, 'page_size': page_size}), 200
    except Exception as e:
        return jsonify({'msg': f'获取历史记录失败: {str(e)}'}), 500

@app.route('/api/history/<int:history_id>', methods=['DELETE'])
@jwt_required()
def delete_history(history_id):
    try:
        user_id = int(get_jwt_identity())
        history = History.query.filter_by(id=history_id, user_id=user_id).first()
        if not history:
            return jsonify({'msg': '历史记录不存在'}), 404
        db.session.delete(history)
        db.session.commit()
        return jsonify({'msg': '删除成功'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': f'删除失败: {str(e)}'}), 500

# ========== 解析缓存 ========== #
parse_cache = {}

# ========== /api/parse 路由优化 ========== #
@app.route('/api/parse', methods=['POST', 'OPTIONS'])
@jwt_required()
def parse():
    if request.method == 'OPTIONS':
        return ('', 204)
    try:
        user_id = int(get_jwt_identity())
        data = request.json
        url = data.get('url')
        if not url:
            return jsonify({'msg': 'URL不能为空'}), 400

        # 1. 先查缓存
        if url in parse_cache:
            result = parse_cache[url]
        else:
            platform = identify_platform(url)
            if not platform:
                return jsonify({'msg': '不支持的平台'}), 400

            # ========== 全局单例 Selenium 浏览器建议 ========== #
            # 建议在 douyin_selenium_parser.py 中实现 get_global_driver() 单例方法
            # 并在 parse_douyin(url) 内部优先使用全局 driver
            # 这样可极大提升解析速度，避免重复启动浏览器

            if platform == 'douyin':
                result = parse_douyin(url)  # parse_douyin 内部建议用全局driver
            elif platform == 'kuaishou':
                result = parse_kuaishou(url)
            elif platform == 'xiaohongshu':
                result = parse_xiaohongshu(url)
            else:
                return jsonify({'msg': '不支持的平台'}), 400

            # 2. 写入缓存
            parse_cache[url] = result

        # 保存历史记录
        try:
            history = History(
                user_id=user_id,
                platform=identify_platform(url),
                url=url,
                result=json.dumps(result, ensure_ascii=False)
            )
            db.session.add(history)
            db.session.commit()
        except Exception as db_err:
            print(f'保存历史记录异常: {db_err}')
            db.session.rollback()

        return jsonify({
            'platform': identify_platform(url),
            'result': result
        }), 200

    except Exception as e:
        print(f'/api/parse 异常: {e}')
        return jsonify({'msg': f'解析失败: {str(e)}'}), 500

# 测试接口
@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({'msg': '后端服务正常运行'}), 200

# 测试JWT接口
@app.route('/api/test-jwt', methods=['GET'])
@jwt_required()
def test_jwt():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if user:
            return jsonify({
                'msg': 'JWT验证成功',
                'user_id': user_id,
                'username': user.username
            }), 200
        else:
            return jsonify({'msg': '用户不存在'}), 404
    except Exception as e:
        return jsonify({'msg': f'JWT验证失败: {str(e)}'}), 500

# 调试请求头
@app.route('/api/debug-headers', methods=['GET'])
def debug_headers():
    headers = dict(request.headers)
    return jsonify({
        'headers': headers,
        'method': request.method,
        'url': request.url
    }), 200

# 代理视频流
@app.route('/api/proxy_video')
@cross_origin(origins=["http://127.0.0.1:3000", "http://localhost:3000"])
def proxy_video():
    video_url = request.args.get('url')
    if not video_url:
        return 'Missing url', 400
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Referer": "https://www.douyin.com/"
    }
    r = requests.get(video_url, headers=headers, stream=True)
    def generate():
        for chunk in r.iter_content(chunk_size=8192):
            if chunk:
                yield chunk
    return Response(generate(), content_type=r.headers.get('Content-Type', 'video/mp4'))

# 应用关闭时的清理函数
import atexit

def cleanup_on_exit():
    """应用关闭时清理资源"""
    try:
        from douyin_selenium_parser import cleanup_parser
        cleanup_parser()
        print("Selenium解析器资源已清理")
    except:
        pass

# 注册清理函数
atexit.register(cleanup_on_exit)




if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)



