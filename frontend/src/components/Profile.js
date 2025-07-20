import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Button, message, Statistic, Row, Col, Switch, Alert, Space } from 'antd';
import { userAPI, parserAPI } from '../utils/api';
import { LogoutOutlined, UserOutlined, HistoryOutlined, SettingOutlined, WifiOutlined, DisconnectOutlined } from '@ant-design/icons';
import pwaUtils from '../utils/pwa';

function Profile() {
  const [user, setUser] = useState({ username: '', created_at: '' });
  const [historyCount, setHistoryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swEnabled, setSwEnabled] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [cacheSize, setCacheSize] = useState('0 B');

  useEffect(() => {
    fetchUserInfo();
    fetchHistoryCount();
    checkPWAStatus();
    setupNetworkListener();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const data = await userAPI.getProfile?.() || {};
      setUser({
        username: data.username || localStorage.getItem('username') || '',
        created_at: data.created_at || '',
      });
    } catch {
      setUser({ username: localStorage.getItem('username') || '', created_at: '' });
    }
  };

  const fetchHistoryCount = async () => {
    try {
      const data = await parserAPI.getHistory({ page: 1, page_size: 1 });
      setHistoryCount(data.total || 0);
    } catch {
      setHistoryCount(0);
    }
  };

  const checkPWAStatus = async () => {
    const swStatus = await pwaUtils.checkServiceWorker();
    setSwEnabled(swStatus);
    setNotificationEnabled(Notification.permission === 'granted');
    
    const size = await pwaUtils.getCacheSize();
    setCacheSize(size);
  };

  const setupNetworkListener = () => {
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    message.success('已退出登录');
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
  };

  const handleNotificationToggle = async (checked) => {
    if (checked) {
      const granted = await pwaUtils.registerPushNotification();
      setNotificationEnabled(granted);
      if (granted) {
        message.success('推送通知已启用');
      } else {
        message.error('推送通知权限被拒绝');
      }
    } else {
      setNotificationEnabled(false);
      message.info('推送通知已禁用');
    }
  };

  const handleClearCache = async () => {
    const success = await pwaUtils.clearCache();
    if (success) {
      message.success('缓存已清除');
      setCacheSize('0 B');
    } else {
      message.error('清除缓存失败');
    }
  };

  const handleTestNotification = () => {
    pwaUtils.sendNotification('测试通知', {
      body: '这是一条测试推送通知',
      tag: 'test'
    });
  };

  return (
    <Row justify="center" style={{ marginTop: 32 }}>
      <Col xs={24} sm={20} md={16} lg={12} xl={8}>
        <Card bordered style={{ borderRadius: 16, boxShadow: '0 2px 12px #eee' }}>
          <Descriptions
            title={<span><UserOutlined /> 个人中心</span>}
            column={1}
            bordered
            size="middle"
            style={{ marginBottom: 24 }}
          >
            <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
            <Descriptions.Item label="注册时间">{user.created_at ? user.created_at : '—'}</Descriptions.Item>
          </Descriptions>

          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={12}>
              <Statistic title="解析历史总数" value={historyCount} prefix={<HistoryOutlined />} />
            </Col>
          </Row>

          <Card title={<span><SettingOutlined /> PWA设置</span>} size="small" style={{ marginBottom: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>网络状态</span>
                <span>
                  {isOnline ? (
                    <WifiOutlined style={{ color: '#52c41a' }} />
                  ) : (
                    <DisconnectOutlined style={{ color: '#ff4d4f' }} />
                  )}
                  {isOnline ? '在线' : '离线'}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Service Worker</span>
                <span style={{ color: swEnabled ? '#52c41a' : '#ff4d4f' }}>
                  {swEnabled ? '已启用' : '未启用'}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>推送通知</span>
                <Switch 
                  checked={notificationEnabled} 
                  onChange={handleNotificationToggle}
                  size="small"
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>缓存大小</span>
                <Space>
                  <span>{cacheSize}</span>
                  <Button size="small" onClick={handleClearCache}>清除</Button>
                </Space>
              </div>
              
              {notificationEnabled && (
                <Button size="small" onClick={handleTestNotification}>
                  测试通知
                </Button>
              )}
            </Space>
          </Card>

          {!isOnline && (
            <Alert
              message="离线模式"
              description="当前处于离线状态，部分功能可能受限"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Button type="primary" danger icon={<LogoutOutlined />} block onClick={handleLogout}>
            退出登录
          </Button>
        </Card>
      </Col>
    </Row>
  );
}

export default Profile; 