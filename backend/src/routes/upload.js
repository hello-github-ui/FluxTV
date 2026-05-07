/**
 * 上传路由
 * 作者: 19920728
 * 创建日期: 2026-05-07 16:15:00
 */

const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload');
const { authenticate, requireAdmin } = require('../middleware/auth');

// 上传直播源文件（管理员）
router.post('/iptv', authenticate, requireAdmin, uploadController.uploadIPTVFile);

module.exports = router;