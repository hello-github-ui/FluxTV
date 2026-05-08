/**
 * 用户控制器
 * 作者: 19920728
 * 创建日期: 2026-05-07 16:30:00
 */

const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { generateToken } = require('../utils/jwt');

/**
 * 用户注册
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const register = async (req, res) => {
  try {
    const { username, password, email, role = 0 } = req.body;
    
    // 验证参数
    if (!username || !password) {
      return res.status(400).json({ success: false, error: '用户名和密码不能为空' });
    }
    
    // 验证角色参数（只能是0或1）
    const userRole = parseInt(role) || 0;
    if (userRole !== 0 && userRole !== 1) {
      return res.status(400).json({ success: false, error: '无效的角色参数' });
    }
    
    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    
    if (existingUser) {
      return res.status(400).json({ success: false, error: '用户名已存在' });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        role: userRole
      }
    });
    
    // 生成Token
    const token = generateToken({ userId: user.id });
    
    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    console.error('注册失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

/**
 * 用户登录
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 验证参数
    if (!username || !password) {
      return res.status(400).json({ success: false, error: '用户名和密码不能为空' });
    }
    
    // 查询用户
    const user = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!user) {
      return res.status(401).json({ success: false, error: '用户名或密码错误' });
    }
    
    // 检查用户状态
    if (user.status === 0) {
      return res.status(401).json({ success: false, error: '用户已被禁用' });
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: '用户名或密码错误' });
    }
    
    // 生成Token
    const token = generateToken({ userId: user.id });
    
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

/**
 * 获取用户信息
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const getProfile = async (req, res) => {
  try {
    const { user } = req;
    
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('获取用户信息失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

/**
 * 更新用户信息
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const updateProfile = async (req, res) => {
  try {
    const { user } = req;
    const { email, phone } = req.body;
    
    const updateData = {};
    
    if (email) {
      updateData.email = email;
    }
    
    if (phone) {
      updateData.phone = phone;
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });
    
    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (err) {
    console.error('更新用户信息失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

/**
 * 修改密码
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const changePassword = async (req, res) => {
  try {
    const { user } = req;
    const { oldPassword, newPassword } = req.body;
    
    // 验证参数
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: '原密码和新密码不能为空' });
    }
    
    // 验证新密码长度
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: '新密码长度至少6位' });
    }
    
    // 查询用户
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    
    if (!existingUser) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    
    // 验证原密码
    const isPasswordValid = await bcrypt.compare(oldPassword, existingUser.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: '原密码不正确' });
    }
    
    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    
    res.json({ success: true, message: '密码修改成功' });
  } catch (err) {
    console.error('修改密码失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

/**
 * 获取用户列表（管理员）
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const users = await prisma.user.findMany({
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });
    
    const total = await prisma.user.count();
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (err) {
    console.error('获取用户列表失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

/**
 * 删除用户（管理员）
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除用户失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

/**
 * 添加收藏
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const addFavorite = async (req, res) => {
  try {
    const { user } = req;
    const { channelId } = req.body;
    
    // 检查频道是否存在
    const channel = await prisma.channel.findUnique({
      where: { id: parseInt(channelId) }
    });
    
    if (!channel) {
      return res.status(404).json({ success: false, error: '频道不存在' });
    }
    
    // 创建收藏
    const favorite = await prisma.favorite.create({
      data: {
        userId: user.id,
        channelId: parseInt(channelId)
      }
    });
    
    res.status(201).json({ success: true, data: favorite });
  } catch (err) {
    // 处理重复收藏的情况
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, error: '已收藏该频道' });
    }
    console.error('添加收藏失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

/**
 * 获取收藏列表
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const getFavorites = async (req, res) => {
  try {
    const { user } = req;
    
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        channel: {
          include: { category: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ success: true, data: favorites });
  } catch (err) {
    console.error('获取收藏列表失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

/**
 * 删除收藏
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const removeFavorite = async (req, res) => {
  try {
    const { user } = req;
    const { channelId } = req.params;
    
    await prisma.favorite.delete({
      where: {
        userId_channelId: {
          userId: user.id,
          channelId: parseInt(channelId)
        }
      }
    });
    
    res.json({ success: true, message: '取消收藏成功' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: '收藏不存在' });
    }
    console.error('删除收藏失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

/**
 * 添加播放历史
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const addPlayHistory = async (req, res) => {
  try {
    const { user } = req;
    const { channelId, duration = 0 } = req.body;
    
    // 检查频道是否存在
    const channel = await prisma.channel.findUnique({
      where: { id: parseInt(channelId) }
    });
    
    if (!channel) {
      return res.status(404).json({ success: false, error: '频道不存在' });
    }
    
    // 创建播放历史
    const history = await prisma.playHistory.create({
      data: {
        userId: user.id,
        channelId: parseInt(channelId),
        duration
      }
    });
    
    res.status(201).json({ success: true, data: history });
  } catch (err) {
    console.error('添加播放历史失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

/**
 * 获取播放历史
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const getPlayHistory = async (req, res) => {
  try {
    const { user } = req;
    
    const history = await prisma.playHistory.findMany({
      where: { userId: user.id },
      include: {
        channel: {
          include: { category: true }
        }
      },
      orderBy: { playTime: 'desc' },
      take: 50
    });
    
    res.json({ success: true, data: history });
  } catch (err) {
    console.error('获取播放历史失败:', err);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getUsers,
  deleteUser,
  addFavorite,
  getFavorites,
  removeFavorite,
  addPlayHistory,
  getPlayHistory
};