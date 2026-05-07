# FluxTV 开发文档 - 第一阶段

**作者**: 19920728  
**创建日期**: 2026-05-07 15:30:00

## 阶段目标

完成基础框架搭建，包括：
1. 项目初始化
2. 数据库设计与迁移
3. 后端API基础架构
4. 前端基础页面

## 数据库设计

### 表结构

#### 1. channels (频道表)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INT | 主键，自增 |
| name | VARCHAR(100) | 频道名称 |
| url | VARCHAR(500) | 直播源URL |
| category_id | INT | 分类ID |
| logo | VARCHAR(255) | 频道图标 |
| status | TINYINT | 状态：0-禁用，1-启用 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 2. categories (分类表)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INT | 主键，自增 |
| name | VARCHAR(50) | 分类名称 |
| sort_order | INT | 排序序号 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 3. users (用户表)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INT | 主键，自增 |
| username | VARCHAR(50) | 用户名 |
| password | VARCHAR(255) | 密码（加密） |
| email | VARCHAR(100) | 邮箱 |
| role | TINYINT | 角色：0-普通用户，1-管理员 |
| status | TINYINT | 状态：0-禁用，1-启用 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 4. favorites (收藏表)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INT | 主键，自增 |
| user_id | INT | 用户ID |
| channel_id | INT | 频道ID |
| created_at | DATETIME | 创建时间 |

#### 5. play_history (播放历史表)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INT | 主键，自增 |
| user_id | INT | 用户ID |
| channel_id | INT | 频道ID |
| play_time | DATETIME | 播放时间 |
| duration | INT | 播放时长（秒） |

## 目录结构

```
FluxTV/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── api/
│   │   └── utils/
│   ├── public/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.js
│   ├── prisma/
│   └── package.json
└── docs/
    └── phase-1.md
```

## API接口设计

### 频道接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/channels | 获取频道列表 |
| GET | /api/channels/:id | 获取单个频道 |
| POST | /api/channels | 创建频道 |
| PUT | /api/channels/:id | 更新频道 |
| DELETE | /api/channels/:id | 删除频道 |

### 分类接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/categories | 获取分类列表 |
| POST | /api/categories | 创建分类 |
| PUT | /api/categories/:id | 更新分类 |
| DELETE | /api/categories/:id | 删除分类 |

### 用户接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/users/register | 用户注册 |
| POST | /api/users/login | 用户登录 |
| GET | /api/users/profile | 获取用户信息 |

## 完成情况

- [ ] 项目结构创建
- [ ] 数据库表设计
- [ ] Prisma配置
- [ ] 后端API实现
- [ ] 前端页面搭建