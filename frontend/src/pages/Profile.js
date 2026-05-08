/**
 * 个人中心页面组件
 * 作者: 19920728
 * 创建日期: 2026-05-08 20:00:00
 */

import { useState, useEffect } from 'react';
import { Card, Button, Form, Input, message, Spin, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, CalendarOutlined, StarOutlined } from '@ant-design/icons';
import useStore from '../store/store';
import { userAPI } from '../api/api';

function Profile() {
  const { user, setUser } = useStore();
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (!user) {
      return;
    }
    
    setLoading(true);
    
    // 加载用户收藏
    userAPI.getFavorites().then((res) => {
      if (res.success) {
        setFavorites(res.data);
      }
    }).finally(() => {
      setLoading(false);
    });
    
    // 设置表单初始值
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      phone: user.phone || '',
    });
  }, [user, form]);

  const handleSubmit = async (values) => {
    try {
      const res = await userAPI.updateProfile(values);
      if (res.success) {
        message.success('更新成功');
        setUser(res.data);
      } else {
        message.error(res.error);
      }
    } catch (err) {
      message.error('更新失败');
    }
  };

  const handleRemoveFavorite = async (channelId) => {
    try {
      await userAPI.removeFavorite(channelId);
      setFavorites(favorites.filter(f => f.channelId !== channelId));
      message.success('已取消收藏');
    } catch (err) {
      message.error('操作失败');
    }
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <p style={{ color: '#8b949e' }}>请先登录</p>
      </div>
    );
  }

  return (
    <Spin spinning={loading}>
      <Row gutter={[24, 24]}>
        {/* 用户信息卡片 */}
        <Col lg={16}>
          <Card className="profile-card" title="个人信息">
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Row gutter={[16, 16]}>
                <Col lg={12}>
                  <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
                    <Input disabled prefix={<UserOutlined />} />
                  </Form.Item>
                </Col>
                <Col lg={12}>
                  <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
                    <Input prefix={<MailOutlined />} />
                  </Form.Item>
                </Col>
                <Col lg={12}>
                  <Form.Item name="phone" label="手机号">
                    <Input prefix={<PhoneOutlined />} />
                  </Form.Item>
                </Col>
                <Col lg={12}>
                  <Form.Item label="注册时间">
                    <Input 
                      disabled 
                      prefix={<CalendarOutlined />} 
                      value={user.createdAt ? new Date(user.createdAt).toLocaleString() : ''}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  保存修改
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* 密码修改 */}
          <Card className="profile-card" title="修改密码">
            <Form layout="vertical" onFinish={async (values) => {
              try {
                const res = await userAPI.changePassword(values);
                if (res.success) {
                  message.success('密码修改成功');
                } else {
                  message.error(res.error);
                }
              } catch (err) {
                message.error('操作失败');
              }
            }}>
              <Form.Item 
                name="oldPassword" 
                label="原密码" 
                rules={[{ required: true }]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item 
                name="newPassword" 
                label="新密码" 
                rules={[{ required: true, min: 6 }]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item 
                name="confirmPassword" 
                label="确认密码" 
                rules={[{ required: true }]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 收藏列表 */}
        <Col lg={8}>
          <Card className="profile-card" title={<span><StarOutlined /> 我的收藏</span>}>
            {favorites.length === 0 ? (
              <p className="profile-empty">暂无收藏</p>
            ) : (
              <div className="profile-favorites">
                {favorites.map((item) => (
                  <div key={item.channelId} className="profile-favorite-item">
                    <div>
                      <div className="profile-favorite-name">{item.channel?.name}</div>
                      <div className="profile-favorite-category">{item.channel?.category?.name}</div>
                    </div>
                    <Button 
                      type="text" 
                      danger 
                      size="small"
                      onClick={() => handleRemoveFavorite(item.channelId)}
                    >
                      取消
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Spin>
  );
}

export default Profile;