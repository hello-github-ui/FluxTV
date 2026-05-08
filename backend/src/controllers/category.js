/**
 * 分类控制器
 * 作者: 19920728
 * 创建日期: 2026-05-07 16:25:00
 */

const prisma = require('../utils/prisma');
const redis = require('../utils/redis');

/**
 * 获取分类列表
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const getCategories = async (req, res) => {
  try {
    // 尝试从缓存获取
    const cached = await redis.get('categories');
    if (cached) {
      return res.json({ success: true, data: cached });
    }
    
    const categories = await prisma.category.findMany({
      orderBy: {
        sortOrder: 'asc'
      },
      include: {
        _count: {
          select: { channels: true }
        }
      }
    });
    
    // 缓存结果
    await redis.set('categories', categories, 3600);
    
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error('获取分类列表失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

/**
 * 获取单个分类
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        channels: {
          where: { status: 1 },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!category) {
      return res.status(404).json({ success: false, error: '分类不存在' });
    }
    
    res.json({ success: true, data: category });
  } catch (err) {
    console.error('获取分类失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

/**
 * 创建分类
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const createCategory = async (req, res) => {
  try {
    const { name, sortOrder } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: '分类名称不能为空' });
    }
    
    const category = await prisma.category.create({
      data: {
        name,
        sortOrder: sortOrder || 0
      }
    });
    
    // 清除缓存
    await redis.del('categories');
    
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    console.error('创建分类失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

/**
 * 更新分类
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sortOrder } = req.body;
    
    const existingCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingCategory) {
      return res.status(404).json({ success: false, error: '分类不存在' });
    }
    
    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        name: name || existingCategory.name,
        sortOrder: sortOrder !== undefined ? sortOrder : existingCategory.sortOrder
      }
    });
    
    // 清除缓存
    await redis.del('categories');
    
    res.json({ success: true, data: category });
  } catch (err) {
    console.error('更新分类失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

/**
 * 删除分类
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!category) {
      return res.status(404).json({ success: false, error: '分类不存在' });
    }
    
    // 检查是否有频道关联
    const channelCount = await prisma.channel.count({
      where: { categoryId: parseInt(id) }
    });
    
    if (channelCount > 0) {
      return res.status(400).json({ success: false, error: '该分类下存在频道，无法删除' });
    }
    
    await prisma.category.delete({
      where: { id: parseInt(id) }
    });
    
    // 清除缓存
    await redis.del('categories');
    
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除分类失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
};