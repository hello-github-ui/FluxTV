/**
 * 管理后台页面组件
 * 作者: 19920728
 * 创建日期: 2026-05-07 17:55:00
 */

import { useState, useEffect } from 'react';
import { 
  Layout as AntLayout, 
  Menu, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  Select,
  Upload,
  message,
  Spin
} from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined,
  VideoCameraOutlined,
  FolderOpenOutlined,
  UploadOutlined,
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import { channelAPI, categoryAPI, uploadAPI } from '../api/api';

const { Header, Sider, Content } = AntLayout;
const { Option } = Select;

function Admin() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  // 侧边栏菜单 - 使用 items 格式
  const menuItems = [
    {
      key: 'channels',
      label: '频道管理',
      icon: <VideoCameraOutlined />,
      onClick: () => navigate('/admin/channels'),
    },
    {
      key: 'categories',
      label: '分类管理',
      icon: <FolderOpenOutlined />,
      onClick: () => navigate('/admin/categories'),
    },
    {
      key: 'upload',
      label: '批量上传',
      icon: <UploadOutlined />,
      onClick: () => navigate('/admin/upload'),
    },
    {
      key: 'users',
      label: '用户管理',
      icon: <UserOutlined />,
      onClick: () => navigate('/admin/users'),
    },
  ];

  return (
    <AntLayout className="admin-layout">
      <Header className="admin-header">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          className="admin-toggle-btn"
        />
        <h1 className="admin-title">管理后台</h1>
        <Button onClick={() => navigate('/')}>返回首页</Button>
      </Header>
      <AntLayout>
        <Sider 
          collapsible 
          collapsed={collapsed}
          onCollapse={setCollapsed}
          className="admin-sider"
        >
          <Menu
            mode="inline"
            defaultSelectedKeys={['channels']}
            className="admin-menu"
            items={menuItems}
          />
        </Sider>
        <Content className="admin-content">
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

// 频道管理子页面
export function AdminChannels() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form] = Form.useForm();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    loadChannels();
    loadCategories();
  }, []);

  const loadChannels = () => {
    setLoading(true);
    channelAPI.getChannels({ keyword: searchKeyword }).then((res) => {
      if (res.success) {
        setChannels(res.data);
      }
      setLoading(false);
    });
  };

  const loadCategories = () => {
    categoryAPI.getCategories().then((res) => {
      if (res.success) {
        setCategories(res.data);
      }
    });
  };

  const handleAdd = () => {
    form.resetFields();
    setEditingChannel(null);
    setModalVisible(true);
  };

  const handleEdit = (channel) => {
    form.setFieldsValue(channel);
    setEditingChannel(channel);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个频道吗？',
      onOk: async () => {
        const res = await channelAPI.deleteChannel(id);
        if (res.success) {
          message.success('删除成功');
          loadChannels();
        } else {
          message.error(res.error);
        }
      }
    });
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的频道');
      return;
    }

    Modal.confirm({
      title: '批量删除确认',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个频道吗？`,
      onOk: async () => {
        const res = await channelAPI.batchDeleteChannels(selectedRowKeys);
        if (res.success) {
          message.success(res.message);
          setSelectedRowKeys([]);
          loadChannels();
        } else {
          message.error(res.error);
        }
      }
    });
  };

  const handleSubmit = async (values) => {
    try {
      if (editingChannel) {
        await channelAPI.updateChannel(editingChannel.id, values);
        message.success('更新成功');
      } else {
        await channelAPI.createChannel(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadChannels();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  const columns = [
    { title: '频道名称', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category', render: (cat) => cat?.name },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status) => status === 1 ? '启用' : '禁用' },
    { 
      title: '操作', 
      key: 'action', 
      render: (_, record) => (
        <div className="admin-actions">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="admin-toolbar">
        <Input.Search
          placeholder="搜索频道"
          prefix={<SearchOutlined />}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onSearch={loadChannels}
          className="admin-search"
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加频道
        </Button>
        <Button 
          type="danger" 
          icon={<DeleteOutlined />} 
          onClick={handleBatchDelete}
          disabled={selectedRowKeys.length === 0}
        >
          批量删除 ({selectedRowKeys.length})
        </Button>
      </div>

      <Spin spinning={loading}>
        <Table 
          dataSource={channels} 
          columns={columns} 
          rowKey="id"
          className="admin-table"
          rowSelection={rowSelection}
        />
      </Spin>

      <Modal
        title={editingChannel ? '编辑频道' : '添加频道'}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="频道名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="url" label="直播源URL" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="categoryId" label="分类">
            <Select>
              {categories.map((cat) => (
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="logo" label="频道图标URL">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Option value={1}>启用</Option>
              <Option value={0}>禁用</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// 分类管理子页面
export function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    setLoading(true);
    categoryAPI.getCategories().then((res) => {
      if (res.success) {
        setCategories(res.data);
      }
      setLoading(false);
    });
  };

  const handleAdd = () => {
    form.resetFields();
    setEditingCategory(null);
    setModalVisible(true);
  };

  const handleEdit = (category) => {
    form.setFieldsValue(category);
    setEditingCategory(category);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个分类吗？删除后该分类下的频道将变为未分类。',
      onOk: async () => {
        const res = await categoryAPI.deleteCategory(id);
        if (res.success) {
          message.success('删除成功');
          loadCategories();
        } else {
          message.error(res.error);
        }
      }
    });
  };

  const handleSubmit = async (values) => {
    try {
      if (editingCategory) {
        await categoryAPI.updateCategory(editingCategory.id, values);
        message.success('更新成功');
      } else {
        await categoryAPI.createCategory(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadCategories();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '分类名称', dataIndex: 'name', key: 'name' },
    { title: '频道数量', dataIndex: '_count', key: '_count', render: (c) => c?.channels || 0 },
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder' },
    { 
      title: '操作', 
      key: 'action', 
      render: (_, record) => (
        <div className="admin-actions">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />
        </div>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加分类
        </Button>
      </div>

      <Spin spinning={loading}>
        <Table 
          dataSource={categories} 
          columns={columns} 
          rowKey="id"
          style={{ background: '#2a475e' }}
        />
      </Spin>

      <Modal
        title={editingCategory ? '编辑分类' : '添加分类'}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="分类名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序序号">
            <Input type="number" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// 批量上传子页面
export function AdminUpload() {
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    categoryAPI.getCategories().then((res) => {
      if (res.success) {
        setCategories(res.data);
      }
    });
  }, []);

  const handleUpload = async (file) => {
    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    if (categoryId) {
      formData.append('categoryId', categoryId);
    }

    try {
      const res = await uploadAPI.uploadIPTVFile(formData);
      
      if (res.success) {
        message.success(res.message);
        if (res.errors && res.errors.length > 0) {
          message.warning(`有 ${res.errors.length} 个频道导入失败`);
        }
      } else {
        message.error(res.error);
      }
    } catch (err) {
      message.error('上传失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <h2>批量上传直播源</h2>
      <p style={{ color: '#8b949e', marginBottom: '24px' }}>
        支持上传 txt、m3u、m3u8 格式的直播源文件
      </p>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ color: '#8b949e', marginRight: '12px' }}>选择分类:</label>
        <Select 
          placeholder="选择分类（可选）"
          value={categoryId}
          onChange={setCategoryId}
          style={{ width: '200px' }}
        >
          {categories.map((cat) => (
            <Option key={cat.id} value={cat.id}>{cat.name}</Option>
          ))}
        </Select>
      </div>

      <Upload
        beforeUpload={(file) => {
          handleUpload(file);
          return false;
        }}
        accept=".txt,.m3u,.m3u8"
        showUploadList={false}
        disabled={loading}
      >
        <Button icon={<UploadOutlined />} loading={loading}>
          选择文件上传
        </Button>
      </Upload>

      <div style={{ marginTop: '24px', padding: '16px', background: '#2a475e', borderRadius: '8px' }}>
        <h3>文件格式说明</h3>
        <ul style={{ color: '#8b949e', margin: '8px 0' }}>
          <li><strong>M3U/M3U8格式:</strong> 标准的m3u播放列表格式</li>
          <li><strong>TXT格式:</strong> 每行一个频道，格式为 频道名称,URL 或只有URL</li>
        </ul>
        <pre style={{ background: '#1b2838', padding: '12px', borderRadius: '4px', color: '#8b949e' }}>
{`# 示例格式
中央电视台,http://example.com/cctv.m3u8
湖南卫视,http://example.com/hunan.m3u8
http://example.com/other.m3u8`}
        </pre>
      </div>
    </div>
  );
}

// 用户管理子页面
export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setLoading(true);
    // 这里应该调用用户列表API，但需要管理员权限
    setLoading(false);
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个用户吗？',
      onOk: async () => {
        // 调用删除用户API
        message.success('删除成功');
        loadUsers();
      }
    });
  };

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '角色', dataIndex: 'role', key: 'role', render: (r) => r === 1 ? '管理员' : '普通用户' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => s === 1 ? '启用' : '禁用' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    { 
      title: '操作', 
      key: 'action', 
      render: (_, record) => (
        <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />
      )
    }
  ];

  return (
    <div>
      <Spin spinning={loading}>
        <Table 
          dataSource={users} 
          columns={columns} 
          rowKey="id"
          style={{ background: '#2a475e' }}
        />
      </Spin>
    </div>
  );
}

export default Admin;