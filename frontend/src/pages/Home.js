/**
 * 首页组件
 * 作者: 19920728
 * 创建日期: 2026-05-07 17:35:00
 */

import { useState, useEffect } from 'react';
import { Row, Col, Input, Select, Tag, Spin, Pagination } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import ChannelCard from '../components/ChannelCard';
import { channelAPI, categoryAPI } from '../api/api';
import useStore from '../store/store';

const { Search } = Input;
const { Option } = Select;

function Home() {
  const [channels, setChannels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 24, total: 0 });
  const { setCategories: storeCategories } = useStore();

  // 获取分类列表
  useEffect(() => {
    categoryAPI.getCategories().then((res) => {
      if (res.success) {
        setCategories(res.data);
        storeCategories(res.data);
      }
    }).catch(err => {
      console.error('获取分类失败:', err);
    });
  }, []);

  // 获取频道列表
  useEffect(() => {
    setLoading(true);
    const params = {
      page: pagination.page,
      limit: pagination.limit
    };
    if (selectedCategory) {
      params.categoryId = selectedCategory;
    }
    if (keyword) {
      params.keyword = keyword;
    }
    
    channelAPI.getChannels(params).then((res) => {
      if (res.success) {
        setChannels(res.data);
        if (res.pagination) {
          setPagination(prev => ({
            ...prev,
            total: res.pagination.total
          }));
        }
      }
      setLoading(false);
    }).catch(err => {
      console.error('获取频道失败:', err);
      setLoading(false);
    });
  }, [keyword, selectedCategory, pagination.page, pagination.limit]);

  const handlePageChange = (page, pageSize) => {
    setPagination(prev => ({
      ...prev,
      page,
      limit: pageSize
    }));
  };

  return (
    <div>
      {/* 搜索和筛选 */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <Search
          placeholder="搜索频道"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          style={{ width: '300px' }}
        />
        <Select
          placeholder="选择分类"
          allowClear
          size="large"
          style={{ width: '200px' }}
          value={selectedCategory}
          onChange={(value) => {
            setSelectedCategory(value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
        >
          {categories.map((cat) => (
            <Option key={cat.id} value={cat.id}>
              {cat.name} ({cat._count?.channels || 0})
            </Option>
          ))}
        </Select>
      </div>

      {/* 频道列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : channels.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#8b949e' }}>
          暂无频道数据
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {channels.map((channel) => (
              <Col xs={24} sm={12} md={8} lg={6} key={channel.id}>
                <ChannelCard channel={channel} />
              </Col>
            ))}
          </Row>
          {/* 分页 */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Pagination
              current={pagination.page}
              pageSize={pagination.limit}
              total={pagination.total}
              onChange={handlePageChange}
              showSizeChanger
              pageSizeOptions={['12', '24', '48', '96']}
              showTotal={(total) => `共 ${total} 个频道`}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default Home;