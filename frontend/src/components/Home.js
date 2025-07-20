import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Descriptions, Space, Tag, Image, Modal } from 'antd';
import { PlayCircleOutlined, DownloadOutlined, LinkOutlined, EyeOutlined } from '@ant-design/icons';
import { CheckCircleTwoTone, CloseCircleTwoTone, DownOutlined, UpOutlined } from '@ant-design/icons';
import { parserAPI } from '../utils/api';

const { TextArea } = Input;

function extractShortVideoUrl(text) {
  // 支持抖音、快手、小红书短链自动提取
  const match = text.match(/https?:\/\/(v\.douyin\.com|kuaishou\.com|xhslink\.com|xiaohongshu\.com)\/[A-Za-z0-9]+\/?/);
  return match ? match[0] : text;
}

function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [playModalVisible, setPlayModalVisible] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  // 视频链接折叠/展开
  const [linkCollapsed, setLinkCollapsed] = useState(true);

  const handleParse = async (values) => {
    setLoading(true);
    setResult(null);
    // 自动提取短链
    const url = extractShortVideoUrl(values.url);
    console.log('handleParse called', { url });
    try {
      const response = await parserAPI.parse(url);
      setResult(response);
      window.result = response; // 方便F12调试
      message.success('解析成功！');
    } catch (error) {
      message.error(error.response?.data?.msg || '解析失败');
    } finally {
      setLoading(false);
    }
  };

  const getPlatformTag = (platform) => {
    const platformConfig = {
      douyin: { color: 'red', text: '抖音' },
      kuaishou: { color: 'orange', text: '快手' },
      xiaohongshu: { color: 'pink', text: '小红书' }
    };
    const config = platformConfig[platform] || { color: 'blue', text: platform };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleDownload = async (url, title) => {
    let downloadUrl = url;
    // 如果不是本地 stream，统一走代理
    if (!url.startsWith('http://10.0.0.13:5000')) {
      downloadUrl = `http://10.0.0.13:5000/api/proxy_video?url=${encodeURIComponent(url)}`;
    }
    try {
      message.loading('正在准备下载...', 0);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = title || '抖音视频.mp4';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.destroy();
      message.success('下载准备完成！');
    } catch (error) {
      message.destroy();
      message.error('下载失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const handlePlay = (url, title) => {
    let playUrl = url;
    // 如果不是本地 stream，统一走代理
    if (!url.startsWith('http://10.0.0.13:5000')) {
      playUrl = `http://10.0.0.13:5000/api/proxy_video?url=${encodeURIComponent(url)}`;
    }
    setCurrentVideo({ url: playUrl, title });
    setPlayModalVisible(true);
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      message.success('链接已复制到剪贴板');
    });
  };

  return (
    <div className="home-container">
      {/* LOGO/大标题 */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '18px 0 20px 0'
      }}>
        <span style={{
          fontWeight: 'bold',
          fontSize: 30,
          background: 'linear-gradient(90deg, #1890ff 0%, #40a9ff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: 2
        }}>短视频无水印解析</span>
      </div>
      <Card className="parser-form">
        <h2>视频无水印解析</h2>
        <p style={{ color: '#666', marginBottom: 24 }}>
          支持抖音、快手、小红书等平台的视频无水印解析
        </p>
        <Form onFinish={handleParse} layout="vertical">
          <Form.Item
            name="url"
            label="视频链接"
            rules={[{ required: true, message: '请输入视频链接!' }]}
          >
            <TextArea
              rows={3}
              placeholder="请粘贴视频分享链接或复制整段内容，例如：复制打开抖音，看看... https://v.douyin.com/xxxxx/ ..."
            />
          </Form.Item>
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<PlayCircleOutlined />}
              size="large"
              block
              style={{ fontWeight: 'bold', letterSpacing: 1 }}
            >
              {loading ? '解析中...' : '开始解析'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
      {result && (
        <>
          <Card className="result-card">
            <h3>解析结果</h3>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="平台">
                {getPlatformTag(result.platform)}
              </Descriptions.Item>
              {(() => {
                let r = result.result;
                if (typeof r === 'string') {
                  try { r = JSON.parse(r); } catch { r = { error: r }; }
                }
                if (r && r.video_url) {
                  return <>
                    {r.title && (
                      <Descriptions.Item label="标题"><span style={{fontWeight:'bold',color:'#222'}}>{r.title}</span></Descriptions.Item>
                    )}
                    {r.author && (
                      <Descriptions.Item label="作者"><span style={{color:'#1890ff',fontWeight:'bold'}}>{r.author}</span></Descriptions.Item>
                    )}
                    <Descriptions.Item label="视频链接">
                      <Space>
                        <Button 
                          type="primary" 
                          icon={<EyeOutlined />}
                          onClick={() => handlePlay(r.video_url, r.title)}
                        >
                          在线播放
                        </Button>
                        <Button 
                          type="primary" 
                          icon={<DownloadOutlined />}
                          onClick={() => handleDownload(r.video_url, r.title)}
                        >
                          下载视频
                        </Button>
                        <Button 
                          icon={<LinkOutlined />}
                          onClick={() => handleCopyUrl(r.video_url)}
                        >
                          复制链接
                        </Button>
                      </Space>
                      <div style={{ marginTop: 8, wordBreak: 'break-all', color: '#666', fontSize: 13 }}>
                        <span style={{color:'#fa8c16',fontWeight:'bold'}}>
                          {linkCollapsed && r.video_url.length > 40
                            ? r.video_url.slice(0, 40) + '...'
                            : r.video_url}
                        </span>
                        {r.video_url.length > 40 && (
                          <Button
                            type="link"
                            size="small"
                            style={{padding:0,marginLeft:4}}
                            onClick={() => setLinkCollapsed(!linkCollapsed)}
                            icon={linkCollapsed ? <DownOutlined /> : <UpOutlined />}
                          >{linkCollapsed ? '展开' : '收起'}</Button>
                        )}
                      </div>
                    </Descriptions.Item>
                    {r.cover && (
                      <Descriptions.Item label="封面">
                        <Image
                          src={r.cover}
                          alt="视频封面"
                          className="cover-image"
                          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                        />
                      </Descriptions.Item>
                    )}
                    {r.message && (
                      <Descriptions.Item label="提示信息">
                        <div style={{ 
                          padding: '10px 14px', 
                          backgroundColor: '#e6fffb', 
                          border: '1px solid #87e8de', 
                          borderRadius: '8px',
                          color: '#389e8b',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}>
                          <CheckCircleTwoTone twoToneColor="#52c41a" style={{fontSize:20}} />
                          {r.message}
                        </div>
                      </Descriptions.Item>
                    )}
                  </>;
                } else {
                  return <Descriptions.Item label="状态">
                    <Tag color="red">解析失败</Tag>
                    <div style={{ marginTop: 8, color: '#ff4d4f', fontWeight:'bold', display:'flex', alignItems:'center', gap:6 }}>
                      <CloseCircleTwoTone twoToneColor="#ff4d4f" style={{fontSize:20}} />
                      {r && (r.error || r.message || '未获取到视频链接')}
                    </div>
                  </Descriptions.Item>;
                }
              })()}
            </Descriptions>
          </Card>
          <pre style={{ background: '#f6f6f6', color: '#888', fontSize: 12, marginTop: 16, padding: 8, borderRadius: 8 }}>
            {result ? JSON.stringify(result, null, 2) : '无数据'}
          </pre>
        </>
      )}
      {/* 视频播放模态框 */}
      <Modal
        title={`在线播放 - ${currentVideo?.title || '抖音视频'}`}
        open={playModalVisible}
        onCancel={() => setPlayModalVisible(false)}
        footer={null}
        width={800}
        destroyOnHidden
      >
        {currentVideo && (
          <video
            controls
            autoPlay
            style={{ width: '100%', height: 'auto', borderRadius: 8 }}
            src={currentVideo.url}
          >
            您的浏览器不支持视频播放
          </video>
        )}
      </Modal>
    </div>
  );
}

export default Home; 