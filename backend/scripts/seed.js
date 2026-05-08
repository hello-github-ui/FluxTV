/**
 * 数据库种子数据脚本
 * 作者: 19920728
 * 创建日期: 2026-05-08 10:30:00
 */

const prisma = require('../src/utils/prisma');

async function seed() {
  console.log('开始插入种子数据...');
  
  // 创建分类
  const categories = await prisma.category.createMany({
    data: [
      { name: '中央电视台', sortOrder: 1 },
      { name: '省级卫视', sortOrder: 2 },
      { name: '地方频道', sortOrder: 3 },
      { name: '电影频道', sortOrder: 4 },
      { name: '体育频道', sortOrder: 5 },
      { name: '国际频道', sortOrder: 6 }
    ],
    skipDuplicates: true
  });
  console.log('分类创建成功:', categories.count);
  
  // 创建频道
  const channels = await prisma.channel.createMany({
    data: [
      { name: 'CCTV-1 综合', url: 'https://example.com/cctv1.m3u8', categoryId: 1, status: 1 },
      { name: 'CCTV-2 财经', url: 'https://example.com/cctv2.m3u8', categoryId: 1, status: 1 },
      { name: 'CCTV-3 综艺', url: 'https://example.com/cctv3.m3u8', categoryId: 1, status: 1 },
      { name: 'CCTV-5 体育', url: 'https://example.com/cctv5.m3u8', categoryId: 5, status: 1 },
      { name: 'CCTV-6 电影', url: 'https://example.com/cctv6.m3u8', categoryId: 4, status: 1 },
      { name: '湖南卫视', url: 'https://example.com/hunan.m3u8', categoryId: 2, status: 1 },
      { name: '浙江卫视', url: 'https://example.com/zjstv.m3u8', categoryId: 2, status: 1 },
      { name: '东方卫视', url: 'https://example.com/dongfang.m3u8', categoryId: 2, status: 1 },
      { name: '北京卫视', url: 'https://example.com/bjstv.m3u8', categoryId: 2, status: 1 },
      { name: '广东卫视', url: 'https://example.com/gdstv.m3u8', categoryId: 2, status: 1 },
      { name: '凤凰卫视', url: 'https://example.com/phoenix.m3u8', categoryId: 6, status: 1 },
      { name: '星空卫视', url: 'https://example.com/stars.m3u8', categoryId: 6, status: 1 }
    ],
    skipDuplicates: true
  });
  console.log('频道创建成功:', channels.count);
  
  await prisma.$disconnect();
  console.log('种子数据插入完成!');
}

seed().catch((err) => {
  console.error('插入失败:', err);
  prisma.$disconnect();
});