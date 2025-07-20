import React, { useState, useEffect } from 'react';
import { Card, Input, Button, List, Progress, Tag, Space, message, Modal, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, PlayCircleOutlined, PauseCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { parserAPI } from '../utils/api';

const { TextArea } = Input;

function TaskQueue() {
  const [tasks, setTasks] = useState([]);
  const [inputUrls, setInputUrls] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 任务状态枚举
  const TASK_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SUCCESS: 'success',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  };

  // 添加任务到队列
  const addTasks = () => {
    if (!inputUrls.trim()) {
      message.warning('请输入视频链接');
      return;
    }

    const urlList = inputUrls.split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urlList.length === 0) {
      message.warning('请输入有效的视频链接');
      return;
    }

    const newTasks = urlList.map((url, index) => ({
      id: Date.now() + index,
      url,
      status: TASK_STATUS.PENDING,
      result: null,
      error: null,
      progress: 0,
      startTime: null,
      endTime: null
    }));

    setTasks(prev => [...prev, ...newTasks]);
    setInputUrls('');
    message.success(`已添加 ${urlList.length} 个任务到队列`);
  };

  // 开始处理队列
  const startProcessing = async () => {
    if (tasks.length === 0) {
      message.warning('队列为空');
      return;
    }

    if (isProcessing) {
      message.warning('正在处理中，请稍候');
      return;
    }

    setIsProcessing(true);
    setCurrentIndex(0);

    for (let i = 0; i < tasks.length; i++) {
      if (!isProcessing) break; // 检查是否被取消

      const task = tasks[i];
      if (task.status === TASK_STATUS.SUCCESS || task.status === TASK_STATUS.FAILED) {
        continue; // 跳过已完成的任务
      }

      setCurrentIndex(i);
      await processTask(task, i);
    }

    setIsProcessing(false);
    message.success('所有任务处理完成');
  };

  // 处理单个任务
  const processTask = async (task, index) => {
    // 更新任务状态为处理中
    updateTask(index, {
      status: TASK_STATUS.PROCESSING,
      startTime: new Date(),
      progress: 0
    });

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        updateTaskProgress(index, Math.min(90, Math.random() * 100));
      }, 500);

      // 调用解析API
      const result = await parserAPI.parse(task.url);
      
      clearInterval(progressInterval);
      updateTaskProgress(index, 100);

      // 更新任务结果
      updateTask(index, {
        status: TASK_STATUS.SUCCESS,
        result,
        endTime: new Date(),
        progress: 100
      });

      message.success(`任务 ${index + 1} 解析成功`);
    } catch (error) {
      updateTask(index, {
        status: TASK_STATUS.FAILED,
        error: error.message || '解析失败',
        endTime: new Date(),
        progress: 0
      });
      message.error(`任务 ${index + 1} 解析失败: ${error.message}`);
    }
  };

  // 更新任务
  const updateTask = (index, updates) => {
    setTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, ...updates } : task
    ));
  };

  // 更新任务进度
  const updateTaskProgress = (index, progress) => {
    setTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, progress } : task
    ));
  };

  // 暂停处理
  const pauseProcessing = () => {
    setIsProcessing(false);
    message.info('已暂停处理');
  };

  // 取消任务
  const cancelTask = (index) => {
    updateTask(index, {
      status: TASK_STATUS.CANCELLED,
      endTime: new Date()
    });
  };

  // 删除任务
  const removeTask = (index) => {
    setTasks(prev => prev.filter((_, i) => i !== index));
  };

  // 清空队列
  const clearQueue = () => {
    Modal.confirm({
      title: '确认清空队列',
      content: '这将删除所有任务，确定继续吗？',
      onOk: () => {
        setTasks([]);
        setIsProcessing(false);
        setCurrentIndex(0);
        message.success('队列已清空');
      }
    });
  };

  // 获取状态标签
  const getStatusTag = (status) => {
    const statusConfig = {
      [TASK_STATUS.PENDING]: { color: 'default', text: '等待中', icon: <PlayCircleOutlined /> },
      [TASK_STATUS.PROCESSING]: { color: 'processing', text: '处理中', icon: <PlayCircleOutlined /> },
      [TASK_STATUS.SUCCESS]: { color: 'success', text: '成功', icon: <CheckCircleOutlined /> },
      [TASK_STATUS.FAILED]: { color: 'error', text: '失败', icon: <CloseCircleOutlined /> },
      [TASK_STATUS.CANCELLED]: { color: 'default', text: '已取消', icon: <CloseCircleOutlined /> }
    };
    const config = statusConfig[status] || statusConfig[TASK_STATUS.PENDING];
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  // 计算总体进度
  const getOverallProgress = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(task => 
      task.status === TASK_STATUS.SUCCESS || task.status === TASK_STATUS.FAILED
    ).length;
    return Math.round((completed / tasks.length) * 100);
  };

  return (
    <div className="task-queue-container">
      <h2>解析任务队列</h2>
      
      <Card title="添加任务" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <TextArea
            rows={4}
            placeholder="请输入视频链接，每行一个"
            value={inputUrls}
            onChange={(e) => setInputUrls(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={addTasks}>
            添加到队列
          </Button>
        </Space>
      </Card>

      {tasks.length > 0 && (
        <Card title="任务队列" extra={
          <Space>
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={startProcessing}
              disabled={isProcessing}
            >
              开始处理
            </Button>
            <Button 
              icon={<PauseCircleOutlined />}
              onClick={pauseProcessing}
              disabled={!isProcessing}
            >
              暂停
            </Button>
            <Button danger onClick={clearQueue}>
              清空队列
            </Button>
          </Space>
        }>
          <div style={{ marginBottom: 16 }}>
            <Progress 
              percent={getOverallProgress()} 
              status={isProcessing ? 'active' : 'normal'}
              format={(percent) => `${percent}% (${tasks.filter(t => t.status === TASK_STATUS.SUCCESS || t.status === TASK_STATUS.FAILED).length}/${tasks.length})`}
            />
          </div>

          <List
            dataSource={tasks}
            renderItem={(task, index) => (
              <List.Item
                actions={[
                  task.status === TASK_STATUS.PROCESSING && (
                    <Button size="small" onClick={() => cancelTask(index)}>
                      取消
                    </Button>
                  ),
                  <Button 
                    size="small" 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={() => removeTask(index)}
                  >
                    删除
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      {getStatusTag(task.status)}
                      <span style={{ 
                        color: index === currentIndex && isProcessing ? '#1890ff' : 'inherit',
                        fontWeight: index === currentIndex && isProcessing ? 'bold' : 'normal'
                      }}>
                        任务 {index + 1}
                      </span>
                    </Space>
                  }
                  description={
                    <div>
                      <div style={{ wordBreak: 'break-all', marginBottom: 8 }}>
                        {task.url}
                      </div>
                      {task.status === TASK_STATUS.PROCESSING && (
                        <Progress percent={task.progress} size="small" />
                      )}
                      {task.error && (
                        <Alert message={task.error} type="error" showIcon size="small" />
                      )}
                      {task.result && (
                        <Alert 
                          message="解析成功" 
                          description={`标题: ${task.result.title || '无'}`}
                          type="success" 
                          showIcon 
                          size="small" 
                        />
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
}

export default TaskQueue; 