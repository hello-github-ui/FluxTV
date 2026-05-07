/**
 * Redis工具类
 * 作者: 19920728
 * 创建日期: 2026-05-07 15:45:00
 */

const { createClient } = require('redis');

// 创建Redis客户端
const client = createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  legacyMode: true
});

/**
 * 连接Redis
 */
const connect = async () => {
  try {
    await client.connect();
    return true;
  } catch (err) {
    console.error('Redis连接失败:', err);
    return false;
  }
};

/**
 * 设置缓存
 * @param {string} key - 缓存键
 * @param {string} value - 缓存值
 * @param {number} ttl - 过期时间（秒）
 */
const set = async (key, value, ttl = 3600) => {
  try {
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }
    await client.set(key, value, { EX: ttl });
    return true;
  } catch (err) {
    console.error('Redis设置失败:', err);
    return false;
  }
};

/**
 * 获取缓存
 * @param {string} key - 缓存键
 * @returns {Promise<any>} 缓存值
 */
const get = async (key) => {
  try {
    const value = await client.get(key);
    if (value) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return null;
  } catch (err) {
    console.error('Redis获取失败:', err);
    return null;
  }
};

/**
 * 删除缓存
 * @param {string} key - 缓存键
 */
const del = async (key) => {
  try {
    await client.del(key);
    return true;
  } catch (err) {
    console.error('Redis删除失败:', err);
    return false;
  }
};

/**
 * 清除所有缓存
 */
const flushAll = async () => {
  try {
    await client.flushAll();
    return true;
  } catch (err) {
    console.error('Redis清空失败:', err);
    return false;
  }
};

module.exports = {
  client,
  connect,
  set,
  get,
  del,
  flushAll
};