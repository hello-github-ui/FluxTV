/**
 * 更新真实直播源脚本
 * 作者: 19920728
 * 创建日期: 2026-05-08 14:30:00
 */

const prisma = require('../src/utils/prisma');

// 一些公开的测试直播源（这些可能随时失效，仅用于测试）
const realChannels = [
  {
    name: 'CCTV-1 综合',
    url: 'https://live-play.cctvnews.cctv.com/cctv/merge_cctv1.m3u8',
    categoryId: 1
  },
  {
    name: 'CCTV-2 财经',
    url: 'https://live-play.cctvnews.cctv.com/cctv/merge_cctv2.m3u8',
    categoryId: 1
  },
  {
    name: 'CCTV-3 综艺',
    url: 'https://live-play.cctvnews.cctv.com/cctv/merge_cctv3.m3u8',
    categoryId: 1
  },
  {
    name: 'CCTV-4 中文国际',
    url: 'https://live-play.cctvnews.cctv.com/cctv/merge_cctv4.m3u8',
    categoryId: 1
  },
  {
    name: 'CCTV-5 体育',
    url: 'https://live-play.cctvnews.cctv.com/cctv/merge_cctv5.m3u8',
    categoryId: 5
  },
  {
    name: 'CCTV-6 电影',
    url: 'https://live-play.cctvnews.cctv.com/cctv/merge_cctv6.m3u8',
    categoryId: 4
  },
  {
    name: '湖南卫视',
    url: 'http://112.25.79.41:8088/hls/1/index.m3u8',
    categoryId: 2
  },
  {
    name: '浙江卫视',
    url: 'http://112.25.79.41:8088/hls/2/index.m3u8',
    categoryId: 2
  },
  {
    name: '东方卫视',
    url: 'http://112.25.79.41:8088/hls/3/index.m3u8',
    categoryId: 2
  },
  {
    name: '江苏卫视',
    url: 'http://112.25.79.41:8088/hls/4/index.m3u8',
    categoryId: 2
  },
  {
    name: '北京卫视',
    url: 'http://112.25.79.41:8088/hls/5/index.m3u8',
    categoryId: 2
  },
  {
    name: '广东卫视',
    url: 'http://112.25.79.41:8088/hls/6/index.m3u8',
    categoryId: 2
  }
];

async function updateChannels() {
  console.log('开始更新直播源...');
  
  try {
    // 删除所有现有频道
    await prisma.channel.deleteMany({});
    console.log('已删除旧频道');
    
    // 插入新频道
    for (const channel of realChannels) {
      await prisma.channel.create({
        data: {
          name: channel.name,
          url: channel.url,
          categoryId: channel.categoryId,
          status: 1
        }
      });
      console.log(`已添加: ${channel.name}`);
    }
    
    console.log(`\n成功更新 ${realChannels.length} 个频道！`);
  } catch (err) {
    console.error('更新失败:', err);
  } finally {
    await prisma.$disconnect();
  }
}

updateChannels();