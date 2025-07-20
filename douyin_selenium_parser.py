import time
import re
import json
import requests
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import os
import threading
import queue

global_driver = None
global_driver_lock = threading.Lock()

def get_global_driver():
    global global_driver
    with global_driver_lock:
        if global_driver is None:
            chrome_options = Options()
            chrome_options.add_argument('--headless')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            # 移动端User-Agent
            chrome_options.add_argument('user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1')
            # 反爬：设置语言
            chrome_options.add_argument('--lang=zh-CN,zh,zh-TW,en-US,en')
            # 反爬：禁用自动化扩展
            chrome_options.add_experimental_option('excludeSwitches', ['enable-automation'])
            chrome_options.add_experimental_option('useAutomationExtension', False)
            
            # 在Docker环境中使用系统安装的ChromeDriver
            chrome_driver_path = os.getenv('CHROMEDRIVER_PATH', '/usr/local/bin/chromedriver')
            if os.path.exists(chrome_driver_path):
                service = Service(chrome_driver_path)
                global_driver = webdriver.Chrome(service=service, options=chrome_options)
            else:
                # 如果找不到ChromeDriver，尝试直接使用Chrome
            global_driver = webdriver.Chrome(options=chrome_options)
            # 设置移动端窗口尺寸
            global_driver.set_window_size(375, 812)
            # 反爬：注入JS隐藏webdriver特征
            global_driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
                'source': '''
                    Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                    Object.defineProperty(navigator, 'languages', {get: () => ['zh-CN', 'zh', 'en']});
                    Object.defineProperty(navigator, 'plugins', {get: () => [1,2,3,4,5]});
                '''
            })
        return global_driver

class DouyinSeleniumParser:
    def __init__(self):
        self.driver = None
        self.wait = None
        self.lock = threading.Lock()
        
    def setup_driver(self):
        """设置Chrome浏览器"""
        try:
            chrome_options = Options()
            # 无头模式（不显示浏览器窗口）
            chrome_options.add_argument('--headless')
            # 禁用GPU加速
            chrome_options.add_argument('--disable-gpu')
            # 禁用沙盒
            chrome_options.add_argument('--no-sandbox')
            # 禁用开发者工具
            chrome_options.add_argument('--disable-dev-shm-usage')
            # 设置用户代理
            chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
            # 禁用图片加载以提高速度
            chrome_options.add_argument('--blink-settings=imagesEnabled=false')
            
            # 在Docker环境中使用系统安装的ChromeDriver
            chrome_driver_path = os.getenv('CHROMEDRIVER_PATH', '/usr/local/bin/chromedriver')
            if os.path.exists(chrome_driver_path):
                service = Service(chrome_driver_path)
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            else:
                # 如果找不到ChromeDriver，尝试直接使用Chrome
                self.driver = webdriver.Chrome(options=chrome_options)
            self.wait = WebDriverWait(self.driver, 20)
            
            print("Chrome浏览器设置成功")
            return True
            
        except Exception as e:
            print(f"设置Chrome浏览器失败: {e}")
            return False
    
    def close_driver(self):
        """关闭浏览器"""
        if self.driver:
            try:
                self.driver.quit()
                print("Chrome浏览器已关闭")
            except:
                pass
            finally:
                self.driver = None
                self.wait = None
    
    def get_real_url(self, short_url):
        """获取重定向后的真实URL"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            response = requests.get(short_url, headers=headers, allow_redirects=True, timeout=10)
            return response.url
        except Exception as e:
            print(f"获取真实URL失败: {e}")
            return short_url
    
    def parse_with_selenium(self, url):
        """使用Selenium解析抖音视频"""
        with self.lock:  # 线程安全
            try:
                if not self.driver:
                    if not self.setup_driver():
                        return {'error': '浏览器初始化失败'}
                
                print(f"开始使用Selenium解析: {url}")
                
                # 获取真实URL
                real_url = self.get_real_url(url)
                print(f"真实URL: {real_url}")
                
                # 访问页面
                self.driver.get(real_url)
                time.sleep(3)  # 等待页面加载
                
                # 等待页面完全加载
                try:
                    self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
                except TimeoutException:
                    print("页面加载超时")
                
                # 获取页面源码
                page_source = self.driver.page_source
                print(f"页面源码长度: {len(page_source)}")
                
                # 保存页面源码用于调试
                with open('douyin_selenium_debug.html', 'w', encoding='utf-8') as f:
                    f.write(page_source)
                print("页面源码已保存到 douyin_selenium_debug.html")
                
                # 尝试多种方法提取视频信息
                result = self.extract_video_info(page_source, real_url)
                
                if result.get('video_url'):
                    print(f"解析成功: {result}")
                    return result
                else:
                    # 如果常规方法失败，尝试执行JavaScript
                    return self.extract_with_javascript(real_url)
                    
            except Exception as e:
                print(f"Selenium解析异常: {e}")
                return {'error': f'Selenium解析失败: {str(e)}'}
    
    def extract_video_info(self, html, url):
        """从页面源码中提取视频信息"""
        try:
            # 提取视频ID
            video_id_match = re.search(r'/video/(\d+)', url)
            video_id = video_id_match.group(1) if video_id_match else None
            
            # 尝试多种正则表达式提取视频URL
            video_url = None
            video_patterns = [
                r'"playAddr":"([^"]+)"',
                r'playAddr: \\"([^\\"]+)\\"',
                r'"play_addr":{"uri":"([^"]+)"',
                r'"download_addr":{"uri":"([^"]+)"',
                r'"play_addr":{"url_list":\["([^"]+)"',
                r'"download_addr":{"url_list":\["([^"]+)"',
                r'"video":{"play_addr":{"url_list":\["([^"]+)"',
                r'"video":{"download_addr":{"url_list":\["([^"]+)"',
            ]
            
            for pattern in video_patterns:
                match = re.search(pattern, html)
                if match:
                    video_url = match.group(1)
                    print(f"找到视频链接: {video_url[:100]}...")
                    break
            
            # 提取标题
            title = None
            title_patterns = [
                r'<title>(.*?)</title>',
                r'"desc":"([^"]+)"',
                r'"title":"([^"]+)"',
            ]
            
            for pattern in title_patterns:
                match = re.search(pattern, html)
                if match:
                    title = match.group(1).strip()
                    print(f"找到标题: {title}")
                    break
            
            # 提取作者
            author = None
            author_patterns = [
                r'"authorName":"([^"]+)"',
                r'"nickname":"([^"]+)"',
                r'"author":"([^"]+)"',
            ]
            
            for pattern in author_patterns:
                match = re.search(pattern, html)
                if match:
                    author = match.group(1)
                    print(f"找到作者: {author}")
                    break
            
            # 提取封面
            cover = None
            cover_patterns = [
                r'"cover":"([^"]+)"',
                r'"poster_url":"([^"]+)"',
                r'"cover_url":"([^"]+)"',
            ]
            
            for pattern in cover_patterns:
                match = re.search(pattern, html)
                if match:
                    cover = match.group(1)
                    print(f"找到封面: {cover[:50]}...")
                    break
            
            # 处理视频URL（去除水印）
            if video_url:
                video_url = video_url.replace('playwm', 'play')
                video_url = video_url.replace('&ratio=720p', '')
            
            return {
                'video_url': video_url or '',
                'title': title or f'抖音视频 {video_id}' if video_id else '抖音视频',
                'cover': cover or '',
                'author': author or '抖音用户',
                'video_id': video_id,
                'message': 'Selenium解析成功'
            }
            
        except Exception as e:
            print(f"提取视频信息失败: {e}")
            return {'error': f'提取视频信息失败: {str(e)}'}
    
    def extract_with_javascript(self, url):
        """使用JavaScript提取视频信息"""
        try:
            print("尝试使用JavaScript提取视频信息")
            
            # 执行JavaScript获取网络请求
            js_code = """
            return new Promise((resolve) => {
                const originalFetch = window.fetch;
                const requests = [];
                
                window.fetch = function(...args) {
                    requests.push({
                        url: args[0],
                        options: args[1]
                    });
                    return originalFetch.apply(this, args);
                };
                
                // 监听XHR请求
                const originalXHROpen = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function(method, url, ...args) {
                    requests.push({
                        url: url,
                        method: method
                    });
                    return originalXHROpen.apply(this, [method, url, ...args]);
                };
                
                setTimeout(() => {
                    resolve(requests);
                }, 5000);
            });
            """
            
            requests = self.driver.execute_script(js_code)
            print(f"捕获到的请求: {requests}")
            
            # 查找视频相关的请求
            video_requests = [req for req in requests if 'video' in str(req.get('url', '')).lower()]
            
            if video_requests:
                print(f"找到视频相关请求: {video_requests}")
                # 这里可以进一步处理视频请求
                return {
                    'video_url': video_requests[0].get('url', ''),
                    'title': '抖音视频（JavaScript提取）',
                    'cover': '',
                    'author': '抖音用户',
                    'message': 'JavaScript提取成功'
                }
            
            return {'error': 'JavaScript提取失败'}
            
        except Exception as e:
            print(f"JavaScript提取失败: {e}")
            return {'error': f'JavaScript提取失败: {str(e)}'}
    
    def get_video_stream(self, video_id):
        """获取视频流"""
        try:
            if not self.driver:
                if not self.setup_driver():
                    return None
            
            # 构造视频页面URL
            video_url = f"https://www.douyin.com/video/{video_id}"
            
            # 访问视频页面
            self.driver.get(video_url)
            time.sleep(3)
            
            # 等待视频元素加载
            try:
                video_element = self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "video")))
                video_src = video_element.get_attribute('src')
                
                if video_src:
                    print(f"找到视频源: {video_src}")
                    return video_src
                else:
                    print("视频元素没有src属性")
                    return None
                    
            except TimeoutException:
                print("等待视频元素超时")
                return None
                
        except Exception as e:
            print(f"获取视频流失败: {e}")
            return None

# 全局解析器实例
parser_instance = None

def get_parser():
    """获取解析器实例（单例模式）"""
    global parser_instance
    if parser_instance is None:
        parser_instance = DouyinSeleniumParser()
    return parser_instance

def parse_douyin_with_selenium(url):
    driver = get_global_driver()
    try:
        driver.get(url)
        # 反爬：注入Referer
        driver.execute_script("Object.defineProperty(document, 'referrer', {get: () => 'https://www.douyin.com/'})")
        # 等待页面加载
        try:
            WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        except TimeoutException:
            print("页面加载超时")
        # 反爬：执行JS去除常见检测
        driver.execute_script('''
            if (window._phantom) { window._phantom = false; }
            if (window.callPhantom) { window.callPhantom = false; }
            if (window.__nightmare) { window.__nightmare = false; }
        ''')
        # 获取页面源码
        page_source = driver.page_source
        print(f"页面源码长度: {len(page_source)}")
        with open('douyin_selenium_debug.html', 'w', encoding='utf-8') as f:
            f.write(page_source)
        print("页面源码已保存到 douyin_selenium_debug.html")
        # 尝试多种方法提取视频信息
        result = get_parser().extract_video_info(page_source, url)
        # 自动拼接抖音无水印直链
        if result.get('video_url') and not str(result['video_url']).startswith('http'):
            result['video_url'] = f"https://aweme.snssdk.com/aweme/v1/play/?video_id={result['video_url']}&ratio=720p&line=0"
        if result.get('video_url'):
            print(f"解析成功: {result}")
            return result
        else:
            return get_parser().extract_with_javascript(url)
    except Exception as e:
        return {'error': f'Selenium解析异常: {str(e)}'}

def get_video_stream_with_selenium(video_id):
    """使用Selenium获取视频流（对外接口）"""
    parser = get_parser()
    return parser.get_video_stream(video_id)

def cleanup_parser():
    """清理解析器资源"""
    global parser_instance
    if parser_instance:
        parser_instance.close_driver()
        parser_instance = None
    global global_driver
    with global_driver_lock:
        if global_driver is not None:
            try:
                global_driver.quit()
            except Exception:
                pass
            global_driver = None

# 测试函数
if __name__ == "__main__":
    # 测试解析
    test_url = "https://v.douyin.com/uH0I8F3V92Q/"
    result = parse_douyin_with_selenium(test_url)
    print(f"解析结果: {result}")
    
    # 清理资源
    cleanup_parser() 

# 快手Selenium解析

def parse_kuaishou_with_selenium(url):
    import re
    driver = get_global_driver()
    try:
        driver.get(url)
        WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        time.sleep(2)  # 等待页面动态渲染
        page_source = driver.page_source

        # 1. 尝试直接用Selenium获取video标签src
        video_url = ''
        try:
            video_element = driver.find_element(By.TAG_NAME, "video")
            video_url = video_element.get_attribute("src") or ""
        except Exception:
            pass

        # 2. 正则兜底
        if not video_url:
            match = re.search(r'<video[^>]+src="([^"]+)"', page_source)
            if match:
                video_url = match.group(1)
                if video_url and not video_url.startswith('http'):
                    video_url = 'https://www.kuaishou.com' + video_url

        # 3. 标题
        title = None
        title_match = re.search(r'<title>(.*?)</title>', page_source, re.S)
        if title_match:
            title = title_match.group(1).strip()
        else:
            title = driver.title

        # 4. 作者
        author = None
        author_match = re.search(r'class="author-name">@?([^<]+)</p>', page_source)
        if author_match:
            author = author_match.group(1).strip()

        # 5. 封面
        cover = None
        cover_match = re.search(r'<img[^>]+class="poster"[^>]+src="([^"]+)"', page_source)
        if not cover_match:
            cover_match = re.search(r'<img[^>]+class="video-card__cover"[^>]+src="([^"]+)"', page_source)
        if cover_match:
            cover = cover_match.group(1)

        return {
            'video_url': video_url or '',
            'title': title or '快手视频',
            'author': author or '',
            'cover': cover or '',
            'message': '快手Selenium解析成功' if video_url else '快手Selenium解析失败，未获取到视频链接'
        }
    except Exception as e:
        return {'error': f'快手Selenium解析异常: {str(e)}'}

# 小红书Selenium解析

def parse_xiaohongshu_with_selenium(url):
    import re
    driver = get_global_driver()
    try:
        driver.get(url)
        # 等待页面加载
        try:
            WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        except TimeoutException:
            print("小红书页面加载超时")
        time.sleep(2)  # 等待动态渲染
        page_source = driver.page_source
        print(f"小红书页面源码长度: {len(page_source)}")

        # 1. 优先查找video标签
        video_url = ''
        try:
            video_element = driver.find_element(By.TAG_NAME, "video")
            video_url = video_element.get_attribute("src") or ""
        except Exception:
            pass

        # 2. 查找img标签（图文笔记）
        img_url = ''
        if not video_url:
            try:
                img_element = driver.find_element(By.TAG_NAME, "img")
                img_url = img_element.get_attribute("src") or ""
            except Exception:
                pass

        # 3. 正则兜底
        if not video_url and not img_url:
            match = re.search(r'<video[^>]+src="([^"]+)"', page_source)
            if match:
                video_url = match.group(1)
            else:
                img_match = re.search(r'<img[^>]+src="([^"]+)"', page_source)
                if img_match:
                    img_url = img_match.group(1)

        # 4. 标题
        title = None
        title_match = re.search(r'<title>(.*?)</title>', page_source, re.S)
        if title_match:
            title = title_match.group(1).strip()
        else:
            title = driver.title

        # 5. 作者
        author = None
        author_match = re.search(r'"nickname":"([^"]+)"', page_source)
        if author_match:
            author = author_match.group(1).strip()
        else:
            # 兜底：页面上常见的昵称标签
            author_match2 = re.search(r'class="author-name">@?([^<]+)</', page_source)
            if author_match2:
                author = author_match2.group(1).strip()

        # 6. 封面
        cover = ''
        cover_match = re.search(r'"cover":{"url":"([^"]+)"', page_source)
        if cover_match:
            cover = cover_match.group(1)
        else:
            # 兜底：img标签
            if img_url:
                cover = img_url

        return {
            'video_url': video_url or img_url or '',
            'title': title or '小红书内容',
            'author': author or '',
            'cover': cover or '',
            'message': '小红书Selenium解析成功' if (video_url or img_url) else '小红书Selenium解析失败，未获取到直链'
        }
    except Exception as e:
        return {'error': f'小红书Selenium解析异常: {str(e)}'} 