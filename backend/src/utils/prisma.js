/**
 * Prisma客户端实例
 * 作者: 19920728
 * 创建日期: 2026-05-08 10:00:00
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// 创建Prisma客户端实例
const prisma = new PrismaClient();

module.exports = prisma;