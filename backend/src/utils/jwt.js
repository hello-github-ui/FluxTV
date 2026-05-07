/**
 * JWT工具类
 * 作者: 19920728
 * 创建日期: 2026-05-07 15:50:00
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 生成JWT Token
 * @param {object} payload - 用户信息
 * @returns {string} Token字符串
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * 验证JWT Token
 * @param {string} token - Token字符串
 * @returns {object|null} 解码后的用户信息
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('Token验证失败:', err);
    return null;
  }
};

/**
 * 解析JWT Token（不验证）
 * @param {string} token - Token字符串
 * @returns {object|null} 解码后的用户信息
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (err) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};