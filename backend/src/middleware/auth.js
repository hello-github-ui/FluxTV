/**
 * 认证中间件
 * 作者: 19920728
 * 创建日期: 2026-05-07 15:55:00
 */

const { verifyToken } = require('../utils/jwt');
const prisma = require('../utils/prisma');

/**
 * 用户认证中间件
 * 验证用户是否已登录
 */
const authenticate = async (req, res, next) => {
  try {
    // 从请求头获取Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供Token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: '无效的Token' });
    }

    // 查询用户信息
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    if (user.status === 0) {
      return res.status(401).json({ error: '用户已被禁用' });
    }

    // 将用户信息存入请求对象
    req.user = user;
    next();
  } catch (err) {
    console.error('认证失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};

/**
 * 管理员权限中间件
 * 验证用户是否为管理员
 */
const requireAdmin = async (req, res, next) => {
  if (!req.user || req.user.role !== 1) {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
};

module.exports = {
  authenticate,
  requireAdmin
};