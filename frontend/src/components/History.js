import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, message, Modal, Input, Select, Popconfirm } from 'antd';
import { DeleteOutlined, EyeOutlined, DownloadOutlined, LinkOutlined, SearchOutlined } from '@ant-design/icons';
import { parserAPI } from '../utils/api';

const { Option } = Select;

function History() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [platform, setPlatform] = useState('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line
  }, [page, pageSize, platform, keyword]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await parserAPI.getHistory({ page, page_size: pageSize, platform, keyword });
      const list = Array.isArray(data) ? data : (data.histories || []);
      setHistory(list);
      setTotal(data.total || 0);
    } catch (error) {
      message.error('获取历史记录失败');
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
    const config = platformConfig[platform] || { color: 'default', text: platform };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleViewResult = (record) => {
    try {
      let result = record.result;
      if (typeof result === 'string') {
        try {
          result = JSON.parse(result);
        } catch {
          result = { error: result };
        }
      }
      Modal.info({
        title: '解析结果详情',
        width: 600,
        content: (
          <div>
            <p><strong>平台：</strong>{getPlatformTag(record.platform)}</p>
            <p><strong>链接：</strong>{record.url}</p>
            {result.error ? (
              <p><strong>错误：</strong><span style={{ color: '#ff4d4f' }}>{result.error}</span></p>
            ) : (
              <>
                {result.title && <p><strong>标题：</strong>{result.title}</p>}
                {result.author && <p><strong>作者：</strong>{result.author}</p>}
                {result.video_url && (
                  <p>
                    <strong>视频链接：</strong>
                    <Space style={{ marginTop: 8 }}>
                      <Button 
                        type="primary" 
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => handleDownload(result.video_url)}
                      >
                        下载
                      </Button>
                      <Button 
                        size="small"
                        icon={<LinkOutlined />}
                        onClick={() => handleCopyUrl(result.video_url)}
                      >
                        复制链接
                      </Button>
                    </Space>
                    <div style={{ marginTop: 8, wordBreak: 'break-all', color: '#666' }}>
                      {result.video_url}
                    </div>
                  </p>
                )}
              </>
            )}
          </div>
        ),
      });
    } catch (error) {
      message.error('解析结果格式错误');
    }
  };

  const handleDownload = (url) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'video.mp4';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      message.success('链接已复制到剪贴板');
    });
  };

  const handleDelete = async (id) => {
    try {
      await parserAPI.deleteHistory(id);
      message.success('删除成功');
      fetchHistory();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform) => getPlatformTag(platform),
      filters: [
        { text: '抖音', value: 'douyin' },
        { text: '快手', value: 'kuaishou' },
        { text: '小红书', value: 'xiaohongshu' },
      ],
      filteredValue: platform ? [platform] : null,
      onFilter: (value) => {
        setPlatform(value);
        setPage(1);
      },
    },
    {
      title: '链接',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
      render: (url) => (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      ),
    },
    {
      title: '解析时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewResult(record)}
            title="查看详情"
          />
          <Popconfirm
            title="确定要删除这条历史记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button
              type="text"
              icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />}
              title="删除"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="history-container">
      <h2>解析历史</h2>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索链接/标题/作者"
          value={keyword}
          allowClear
          onChange={e => { setKeyword(e.target.value); setPage(1); }}
          style={{ width: 220 }}
          prefix={<SearchOutlined />}
        />
        <Select
          placeholder="全部平台"
          value={platform || undefined}
          allowClear
          style={{ width: 120 }}
          onChange={value => { setPlatform(value || ''); setPage(1); }}
        >
          <Option value="">全部平台</Option>
          <Option value="douyin">抖音</Option>
          <Option value="kuaishou">快手</Option>
          <Option value="xiaohongshu">小红书</Option>
        </Select>
      </Space>
      <Table
        columns={columns}
        dataSource={history}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />
    </div>
  );
}

export default History; 