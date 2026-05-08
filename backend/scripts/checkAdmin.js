/**
 * 检查和修复管理员用户角色脚本
 * 作者: 19920728
 * 创建日期: 2026-05-08 22:00:00
 */

const prisma = require('../src/utils/prisma');

async function checkAndFixAdmin() {
  try {
    // 查询admin用户
    const admin = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (!admin) {
      console.log('管理员用户不存在，创建新的管理员用户...');
      
      // 创建管理员用户（密码：123456）
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      const newAdmin = await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          email: 'admin@example.com',
          role: 1, // 管理员角色
          status: 1
        }
      });
      
      console.log('管理员用户创建成功:', newAdmin);
    } else {
      console.log('管理员用户已存在:', admin);
      
      // 检查角色是否为管理员
      if (admin.role !== 1) {
        console.log('管理员角色不正确，修复中...');
        
        const updatedAdmin = await prisma.user.update({
          where: { username: 'admin' },
          data: { role: 1 }
        });
        
        console.log('管理员角色已修复:', updatedAdmin);
      } else {
        console.log('管理员角色正确');
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error('检查管理员用户失败:', err);
    process.exit(1);
  }
}

checkAndFixAdmin();