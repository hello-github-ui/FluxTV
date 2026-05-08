/**
 * 频道控制器
 * 作者: 19920728
 * 创建日期: 2026-05-07 16:20:00
 */

const prisma = require('../utils/prisma');
const redis = require('../utils/redis');

/**
 * 获取频道列表
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const getChannels = async (req, res) => {
  try {
    const { categoryId, keyword, page = 1, limit = 20 } = req.query;
    
    // 构建查询条件
    const where = {
      status: 1
    };
    
    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }
    
    if (keyword) {
      where.name = {
        contains: keyword
      };
    }
    
    // 查询频道
    const channels = await prisma.channel.findMany({
      where,
      include: {
        category: true
      },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // 获取总数
    const total = await prisma.channel.count({ where });
    
    res.json({
      success: true,
      data: channels,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (err) {
    console.error('获取频道列表失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

/**
 * 获取单个频道
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const getChannel = async (req, res) => {
  try {
    const { id } = req.params;
    
    const channel = await prisma.channel.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true
      }
    });
    
    if (!channel) {
      return res.status(404).json({ success: false, error: '频道不存在' });
    }
    
    res.json({ success: true, data: channel });
  } catch (err) {
    console.error('获取频道失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

/**
 * 创建频道
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const createChannel = async (req, res) => {
  try {
    const { name, url, categoryId, logo } = req.body;
    
    // 验证参数
    if (!name || !url || !categoryId) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }
    
    // 检查分类是否存在
    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) }
    });
    
    if (!category) {
      return res.status(404).json({ success: false, error: '分类不存在' });
    }
    
    // 创建频道
    const channel = await prisma.channel.create({
      data: {
        name,
        url,
        categoryId: parseInt(categoryId),
        logo
      }
    });
    
    // 清除缓存
    await redis.del('channels');
    
    res.status(201).json({ success: true, data: channel });
  } catch (err) {
    console.error('创建频道失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

/**
 * 更新频道
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const updateChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, categoryId, logo, status } = req.body;
    
    // 检查频道是否存在
    const existingChannel = await prisma.channel.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingChannel) {
      return res.status(404).json({ success: false, error: '频道不存在' });
    }
    
    // 更新频道
    const channel = await prisma.channel.update({
      where: { id: parseInt(id) },
      data: {
        name: name || existingChannel.name,
        url: url || existingChannel.url,
        categoryId: categoryId ? parseInt(categoryId) : existingChannel.categoryId,
        logo: logo || existingChannel.logo,
        status: status !== undefined ? status : existingChannel.status
      }
    });
    
    // 清除缓存
    await redis.del('channels');
    
    res.json({ success: true, data: channel });
  } catch (err) {
    console.error('更新频道失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

/**
 * 删除频道
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const deleteChannel = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查频道是否存在
    const channel = await prisma.channel.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!channel) {
      return res.status(404).json({ success: false, error: '频道不存在' });
    }
    
    // 删除频道
    await prisma.channel.delete({
      where: { id: parseInt(id) }
    });
    
    // 清除缓存
    await redis.del('channels');
    
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除频道失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

/**
 * 批量删除频道
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const batchDeleteChannels = async (req, res) => {
  try {
    const { ids } = req.body;
    
    // 验证参数
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: '请选择要删除的频道' });
    }
    
    // 批量删除频道
    const result = await prisma.channel.deleteMany({
      where: {
        id: {
          in: ids.map(id => parseInt(id))
        }
      }
    });
    
    // 清除缓存
    await redis.del('channels');
    
    res.json({ 
      success: true, 
      message: `成功删除 ${result.count} 个频道`,
      deletedCount: result.count
    });
  } catch (err) {
    console.error('批量删除频道失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

module.exports = {
  getChannels,
  getChannel,
  createChannel,
  updateChannel,
  deleteChannel,
  batchDeleteChannels
};