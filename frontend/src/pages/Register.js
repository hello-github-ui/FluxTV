/**
 * 注册页面组件
 * 作者: 19920728
 * 创建日期: 2026-05-07 17:50:00
 */

import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { userAPI } from '../api/api';
import useStore from '../store/store';

const { Title, Text } = Typography;

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setUser, setToken } = useStore();

  // 注册处理
  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await userAPI.register(values);
      
      if (res.success) {
        setUser(res.data);
        setToken(res.token);
        navigate('/');
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError('注册失败，请重试');
      console.error('注册失败:', err);
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
          <Text style={{ color: '#8b949e' }}>创建新账户</Text>
        </div>

        {error && (
          <Alert message={error} type="error" showIcon style={{ marginBottom: '16px' }} />
        )}

        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, max: 20, message: '用户名长度为3-20个字符' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="请输入用户名"
              style={{ background: '#2a475e', borderColor: '#3d5a73', color: '#fff' }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: false },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="请输入邮箱（可选）"
              style={{ background: '#2a475e', borderColor: '#3d5a73', color: '#fff' }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度至少为6个字符' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="请输入密码"
              style={{ background: '#2a475e', borderColor: '#3d5a73', color: '#fff' }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                }
              })
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="请确认密码"
              style={{ background: '#2a475e', borderColor: '#3d5a73', color: '#fff' }}
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            initialValue="0"
          >
            <select 
              style={{ 
                width: '100%', 
                padding: '11px 12px', 
                background: '#2a475e', 
                borderColor: '#3d5a73', 
                color: '#fff',
                borderRadius: '4px'
              }}
            >
              <option value="0">普通用户</option>
              <option value="1">管理员</option>
            </select>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%', background: '#6366f1', borderColor: '#6366f1' }}
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', color: '#8b949e' }}>
          已有账户？ <Link to="/login" style={{ color: '#6366f1' }}>立即登录</Link>
        </div>
      </Card>
    </div>
  );
}

export default Register;