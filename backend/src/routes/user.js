/**
 * 用户路由
 * 作者: 19920728
 * 创建日期: 2026-05-07 16:10:00
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const { authenticate, requireAdmin } = require('../middleware/auth');

// 用户注册
router.post('/register', userController.register);

// 用户登录
router.post('/login', userController.login);

// 获取用户信息
router.get('/profile', authenticate, userController.getProfile);

// 更新用户信息
router.put('/profile', authenticate, userController.updateProfile);

// 获取用户列表（管理员）
router.get('/', authenticate, requireAdmin, userController.getUsers);

// 删除用户（管理员）
router.delete('/:id', authenticate, requireAdmin, userController.deleteUser);

// 添加收藏
router.post('/favorites', authenticate, userController.addFavorite);

// 获取收藏列表
router.get('/favorites', authenticate, userController.getFavorites);

// 删除收藏
router.delete('/favorites/:channelId', authenticate, userController.removeFavorite);

// 添加播放历史
router.post('/history', authenticate, userController.addPlayHistory);

// 获取播放历史
router.get('/history', authenticate, userController.getPlayHistory);

module.exports = router;