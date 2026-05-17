/**
 * FluxTV 设置页面组件
 *
 * 功能：
 * - API 配置
 * - 应用设置
 * - 关于信息
 * - 清理缓存
 */

import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Switch,
  Button,
  Card,
  Typography,
  Space,
  Divider,
  message,
  Modal,
} from 'antd';
import {
  ApiOutlined,
  AppstoreOutlined,
  InfoCircleOutlined,
  ClearOutlined,
  FolderOpenOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { useStore } from '../store/store';

const { Title, Text, Paragraph } = Typography;

/**
 * 设置页面组件
 */
function Settings() {
  const { settings, saveSettings, refreshChannels } = useStore();
  const [form] = Form.useForm();
  const [version, setVersion] = useState('1.0.0');
  const [platform, setPlatform] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * 加载应用信息
   */
  useEffect(() => {
    form.setFieldsValue(settings);

    if (window.electronAPI) {
      window.electronAPI.getAppVersion().then(setVersion);
      window.electronAPI.getPlatform().then(setPlatform);
    }
  }, [settings, form]);

  /**
   * 处理表单提交
   */
  const handleSubmit = async (values) => {
    try {
      await saveSettings(values);
      message.success('设置已保存');
    } catch (error) {
      message.error('保存失败');
    }
  };

  /**
   * 处理开关变化
   */
  const handleSwitchChange = async (field, checked) => {
    try {
      const newSettings = { ...settings, [field]: checked };
      await saveSettings(newSettings);
      form.setFieldValue(field, checked);
      message.success('设置已保存');
    } catch (error) {
      message.error('保存失败');
    }
  };

  /**
   * 清理缓存
   */
  const handleClearCache = () => {
    Modal.confirm({
      title: '确认清理',
      content: '确定要清理所有缓存数据吗？这不会影响收藏的频道。',
      onOk: async () => {
        if (window.electronAPI) {
          await window.electronAPI.storeDelete('channels');
          await window.electronAPI.storeDelete('playbackHistory');
        }
        message.success('缓存已清理');
        refreshChannels();
      },
    });
  };

  /**
   * 测试连接
   */
  const handleTestConnection = async () => {
    const hideLoading = message.loading('正在测试连接...', 0);
    setLoading(true);

    try {
      const apiUrl = form.getFieldValue('apiUrl') || settings.apiUrl;
      const response = await fetch(`${apiUrl}/api/live?limit=1`);
      
      if (response.ok) {
        const data = await response.json();
        message.success(`连接成功！获取到 ${data.channels?.length || 0} 个频道`);
      } else {
        message.error(`连接失败：${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('测试连接失败:', error);
      message.error('连接失败，请检查 API 地址是否正确');
    } finally {
      hideLoading();
      setLoading(false);
    }
  };

  /**
   * 打开日志文件夹
   */
  const handleOpenLogFolder = async () => {
    if (window.electronAPI) {
      const logPath = await window.electronAPI.getLogPath();
      console.log('Log path:', logPath);
    }
  };

  /**
   * 导出收藏频道
   */
  const handleExportFavorites = async () => {
    if (window.electronAPI) {
      const favorites = await window.electronAPI.storeGet('favoriteChannels');
      if (favorites && favorites.length > 0) {
        const content = generateM3U(favorites);
        const blob = new Blob([content], { type: 'audio/x-mpegurl' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fluxtv_favorites.m3u';
        a.click();
        URL.revokeObjectURL(url);
        message.success('收藏已导出');
      } else {
        message.info('没有收藏的频道');
      }
    }
  };

  /**
   * 生成 M3U 内容
   */
  const generateM3U = (channels) => {
    let content = '#EXTM3U\n\n';
    channels.forEach((channel) => {
      content += `#EXTINF:-1 group-title="${channel.group || ''}" tvg-logo="${channel.logo || ''}",${channel.name}\n`;
      content += `${channel.url}\n`;
    });
    return content;
  };

  /**
   * 获取平台显示名称
   */
  const getPlatformName = () => {
    switch (platform) {
      case 'darwin':
        return 'macOS';
      case 'win32':
        return 'Windows';
      case 'linux':
        return 'Linux';
      default:
        return platform;
    }
  };

  return (
    <div>
      {/* API 设置 */}
      <Card
        title={
          <Space>
            <ApiOutlined />
            <span>API 设置</span>
          </Space>
        }
        style={{ marginBottom: 16, background: '#16213e' }}
        headStyle={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
        bodyStyle={{ color: '#fff' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={settings}
        >
          <Form.Item
            name="apiUrl"
            label={<span style={{ color: '#fff' }}>直播源 API 地址</span>}
            rules={[{ required: true, message: '请输入 API 地址' }]}
          >
            <Input placeholder="https://your-worker.workers.dev" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存设置
              </Button>
              <Button onClick={handleTestConnection} loading={loading}>
                测试连接
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

        <Text type="secondary" style={{ color: 'rgba(255,255,255,0.65)' }}>
          当前 API 地址用于获取直播源列表。你可以使用自己的 Cloudflare Worker 服务。
        </Text>
      </Card>

      {/* 应用设置 */}
      <Card
        title={
          <Space>
            <AppstoreOutlined />
            <span>应用设置</span>
          </Space>
        }
        style={{ marginBottom: 16, background: '#16213e' }}
        headStyle={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
        bodyStyle={{ color: '#fff' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#fff' }}>自动更新频道</Text>
            <Switch
              checked={settings.autoUpdate || false}
              onChange={(checked) => handleSwitchChange('autoUpdate', checked)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#fff' }}>关闭窗口时最小化到托盘</Text>
            <Switch
              checked={settings.minimizeToTray || false}
              onChange={(checked) => handleSwitchChange('minimizeToTray', checked)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#fff' }}>显示播放通知</Text>
            <Switch
              checked={settings.showNotifications || false}
              onChange={(checked) => handleSwitchChange('showNotifications', checked)}
            />
          </div>
        </Space>
      </Card>

      {/* 数据管理 */}
      <Card
        title={
          <Space>
            <FolderOpenOutlined />
            <span>数据管理</span>
          </Space>
        }
        style={{ marginBottom: 16, background: '#16213e' }}
        headStyle={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
        bodyStyle={{ color: '#fff' }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button icon={<ClearOutlined />} onClick={handleClearCache}>
            清理缓存
          </Button>

          <Button icon={<ExportOutlined />} onClick={handleExportFavorites}>
            导出收藏频道
          </Button>

          <Button icon={<FolderOpenOutlined />} onClick={handleOpenLogFolder}>
            打开日志文件夹
          </Button>
        </Space>
      </Card>

      {/* 关于 */}
      <Card
        title={
          <Space>
            <InfoCircleOutlined />
            <span>关于</span>
          </Space>
        }
        style={{ background: '#16213e' }}
        headStyle={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
        bodyStyle={{ color: '#fff' }}
      >
        <Space direction="vertical">
          <Title level={4} style={{ color: '#fff' }}>FluxTV</Title>
          <Text style={{ color: '#fff' }}>版本：{version}</Text>
          <Text style={{ color: '#fff' }}>平台：{getPlatformName()}</Text>
          <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
          <Paragraph type="secondary" style={{ color: 'rgba(255,255,255,0.65)' }}>
            FluxTV 是一个简洁高效的 IPTV 直播播放应用，支持多种直播源格式。
          </Paragraph>
          <Paragraph type="secondary" style={{ color: 'rgba(255,255,255,0.65)' }}>
            直播源来自社区维护的开源项目，我们不对直播源的质量和稳定性做出保证。
          </Paragraph>
        </Space>
      </Card>
    </div>
  );
}

export default Settings;
