/**
 * 频道路由
 * 作者: 19920728
 * 创建日期: 2026-05-07 16:00:00
 */

const express = require('express');
const router = express.Router();
const channelController = require('../controllers/channel');
const { authenticate, requireAdmin } = require('../middleware/auth');

// 获取频道列表（公开接口）
router.get('/', channelController.getChannels);

// 获取单个频道（公开接口）
router.get('/:id', channelController.getChannel);

// 创建频道（管理员）
router.post('/', authenticate, requireAdmin, channelController.createChannel);

// 更新频道（管理员）
router.put('/:id', authenticate, requireAdmin, channelController.updateChannel);

// 批量删除频道（管理员）- 必须放在单条删除之前
router.delete('/batch', authenticate, requireAdmin, channelController.batchDeleteChannels);

// 删除频道（管理员）
router.delete('/:id', authenticate, requireAdmin, channelController.deleteChannel);

module.exports = router;