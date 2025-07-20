import React from 'react';
import { Layout, Menu, Button, Space, Typography } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeOutlined, HistoryOutlined, UserOutlined, LogoutOutlined, PlayCircleOutlined } from '@ant-design/icons';

const { Header } = Layout;
const { Title } = Typography;

function HeaderComponent({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '视频解析',
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: '历史记录',
    },
    {
      key: '/queue',
      icon: <PlayCircleOutlined />,
      label: '任务队列',
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <Header className="header-container" style={{ padding: '0 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Title level={3} style={{ color: '#1890ff', margin: 0, marginRight: 48 }}>
            短视频无水印解析
          </Title>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ border: 'none', background: 'transparent' }}
          />
        </div>
        <Space>
          <span style={{ color: '#666' }}>
            <UserOutlined /> {user?.username}
          </span>
          <Button 
            type="text" 
            icon={<LogoutOutlined />} 
            onClick={onLogout}
            style={{ color: '#666' }}
          >
            退出
          </Button>
        </Space>
      </div>
    </Header>
  );
}

export default HeaderComponent; 