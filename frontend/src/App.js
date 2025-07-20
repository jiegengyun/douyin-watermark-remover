import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, message } from 'antd';
import Login from './components/Login';
import Home from './components/Home';
import History from './components/History';
import Profile from './components/Profile';
import Header from './components/Header';
import TaskQueue from './components/TaskQueue';
import './App.css';

const { Content } = Layout;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    if (token && username) {
      setIsLoggedIn(true);
      setUser({ username });
    }
  }, []);

  const handleLogin = (token, username) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    setIsLoggedIn(true);
    setUser({ username });
    message.success('登录成功！');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUser(null);
    message.success('已退出登录');
  };

  return (
    <Router>
      <Layout className="app-layout">
        {isLoggedIn && <Header user={user} onLogout={handleLogout} />}
        <Content className="app-content">
          <Routes>
            <Route 
              path="/login" 
              element={
                isLoggedIn ? 
                <Navigate to="/" replace /> : 
                <Login onLogin={handleLogin} />
              } 
            />
            <Route 
              path="/" 
              element={
                isLoggedIn ? 
                <Home /> : 
                <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/history" 
              element={
                isLoggedIn ? 
                <History /> : 
                <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/profile" 
              element={
                isLoggedIn ? 
                <Profile /> : 
                <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/queue" 
              element={
                isLoggedIn ? 
                <TaskQueue /> : 
                <Navigate to="/login" replace />
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Router>
  );
}

export default App; 