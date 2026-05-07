/**
 * 分类路由
 * 作者: 19920728
 * 创建日期: 2026-05-07 16:05:00
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category');
const { authenticate, requireAdmin } = require('../middleware/auth');

// 获取分类列表（公开接口）
router.get('/', categoryController.getCategories);

// 获取单个分类（公开接口）
router.get('/:id', categoryController.getCategory);

// 创建分类（管理员）
router.post('/', authenticate, requireAdmin, categoryController.createCategory);

// 更新分类（管理员）
router.put('/:id', authenticate, requireAdmin, categoryController.updateCategory);

// 删除分类（管理员）
router.delete('/:id', authenticate, requireAdmin, categoryController.deleteCategory);

module.exports = router;