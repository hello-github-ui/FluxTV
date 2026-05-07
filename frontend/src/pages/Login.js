/**
 * 登录页面组件
 * 作者: 19920728
 * 创建日期: 2026-05-07 17:45:00
 */

import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { userAPI } from '../api/api';
import useStore from '../store/store';

const { Title, Text } = Typography;

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setUser, setToken } = useStore();

  // 登录处理
  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await userAPI.login(values);
      
      if (res.success) {
        setUser(res.data);
        setToken(res.token);
        navigate('/');
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError('登录失败，请重试');
      console.error('登录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0d1b2a 0%, #1b2838 100%)'
    }}>
      <Card 
        style={{ 
          width: '400px', 
          background: '#1b2838', 
          borderColor: '#2a475e',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>
            FluxTV
          </Title>
          <Text style={{ color: '#8b949e' }}>登录您的账户</Text>
        </div>

        {error && (
          <Alert message={error} type="error" showIcon style={{ marginBottom: '16px' }} />
        )}

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="请输入用户名"
              style={{ background: '#2a475e', borderColor: '#3d5a73', color: '#fff' }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="请输入密码"
              style={{ background: '#2a475e', borderColor: '#3d5a73', color: '#fff' }}
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%', background: '#6366f1', borderColor: '#6366f1' }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', color: '#8b949e' }}>
          还没有账户？ <Link to="/register" style={{ color: '#6366f1' }}>立即注册</Link>
        </div>
      </Card>
    </div>
  );
}

export default Login;