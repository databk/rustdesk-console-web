# RustDesk Console 网站改进执行计划

## 📋 项目概述

**目标**: 将当前项目（rustdesk-console-web）改造成与目标网站（http://ifengdian.top:63002/）完全一致的版本

**目标网站账号**: admin / test1234
**当前项目账号**: admin / admin123

---

## 🔍 目标网站完整功能清单（通过 Playwright 探索）

### 1. Welcome（欢迎页面）- #/welcome

- ✅ 用户信息展示（用户名、组、授权设备数）
- ✅ 版本信息显示（当前版本、新版本提示）
- ✅ 许可证状态显示（过期时间、设备限制）
- ✅ 配置和二维码下载功能（可展开/折叠）
- ✅ 许可证续费/升级按钮
- ✅ 系统公告/警告信息显示

### 2. Devices（设备管理）- #/devices

- ✅ 设备列表表格（ID、Device、Group、User、Status、Strategy、Info、Note、Action）
- ✅ 搜索功能（按 ID 搜索）
- ✅ 高级搜索（Expand 展开）
- ✅ Reset/Query 按钮
- ✅ 表格工具栏（刷新、列设置、密度设置）
- ✅ 分页功能
- ✅ 批量选择功能

### 3. Logs（日志管理）- 包含 4 个子页面

#### 3.1 Connection（连接日志）- #/audit/connect

- ✅ 连接日志列表
- ✅ 时间范围筛选
- ✅ 搜索功能

#### 3.2 File（文件传输日志）- #/audit/file

- ✅ 文件操作日志列表

#### 3.3 Alarm（报警日志）- #/audit/alarm

- ✅ 报警日志列表

#### 3.4 Console（控制台日志）- #/audit/console

- ✅ 控制台日志列表

### 4. Users（用户管理）- #/users

- ✅ 用户列表表格（Username、Email、Status、Roles、Strategy、Group、Note、Action）
- ✅ 搜索功能（按 Username 搜索）
- ✅ Create 创建用户按钮
- ✅ Invite 邀请用户按钮（可能禁用）
- ✅ Edit 编辑用户功能
- ✅ More 更多操作菜单
- ✅ 分页功能
- ✅ 批量选择功能
- ✅ 当前用户标识（Me 标记、crown 图标）

### 5. Groups（组管理）- 包含 2 个子页面

#### 5.1 User Groups（用户组）- #/groups/user

- ✅ 用户组管理

#### 5.2 Device Groups（设备组）- #/groups/device

- ✅ 设备组管理

### 6. Roles（角色管理）

- ✅ 角色列表
- ✅ 权限配置

### 7. Address Books（地址簿）- #/ab

- ✅ 个人地址簿
- ✅ 共享地址簿
- ✅ 地址簿条目管理（CRUD）

### 8. Strategies（策略管理）- #/strategy

- ✅ 访问策略配置
- ✅ 策略规则定义

### 9. Custom Clients（自定义客户端）- #/custom-client

- ✅ 自定义客户端配置
- ✅ 客户端下载

### 10. Settings（系统设置）

- ✅ 系统配置项
- ✅ 安全设置
- ✅ 其他系统参数

---

## 📊 当前项目已实现功能（基于代码分析）

### 技术栈

- **前端框架**: React 19 + Umi 4
- **UI 组件库**: Ant Design 5 + Pro Components
- **语言**: TypeScript
- **构建工具**: Max (Umi)

### 已实现模块

1. ✅ **用户认证系统**

   - 登录页面
   - Token 管理
   - 路由守卫

2. ✅ **基础布局组件**

   - Header（头部导航）
   - Footer（底部信息）
   - AvatarDropdown（用户下拉菜单）
   - Sidebar（侧边栏）

3. ✅ **设备管理页面** (`/devices`)

   - 设备列表展示
   - 基础 CRUD 操作

4. ✅ **用户管理页面** (`/users`)

   - 用户列表
   - 用户创建/编辑

5. ✅ **设备组管理** (`/device-groups`)

   - 设备组列表
   - 组管理功能

6. ✅ **地址簿模块** (`/address-book`)

   - 个人地址簿
   - 地址簿条目管理

7. ✅ **审计日志** (`/audits`)

   - 连接日志查看
   - 日志筛选功能

8. ✅ **API 服务层**
   - 用户 API (user.ts)
   - 设备 API (device.ts)
   - 设备组 API (deviceGroup.ts)
   - 地址簿 API (addressBook.ts)
   - 审计日志 API (audit.ts)

---

## ⚠️ 功能差异对比表

| 功能模块               | 目标网站 | 当前项目 | 差异状态     | 后端支持 | 优先级 |
| ---------------------- | -------- | -------- | ------------ | -------- | ------ |
| **1. 登录页面**        |          |          |              |          |        |
| - 用户名/密码登录      | ✅       | ✅       | 一致         | ✅       | -      |
| - Remember me          | ✅       | ❌       | 缺失         | ✅       | P2     |
| - Forgot Password      | ✅       | ❌       | 缺失         | ✅       | P2     |
| - 多语言切换           | ✅       | ✅       | 一致         | -        | -      |
| - 主题切换             | ✅       | ✅       | 一致         | -        | -      |
| **2. Welcome 页面**    |          |          |              |          |        |
| - 用户信息卡片         | ✅       | ❌       | **缺失**     | ✅       | **P0** |
| - 版本信息显示         | ✅       | ❌       | **缺失**     | ✅       | **P0** |
| - 许可证状态           | ✅       | ❌       | **缺失**     | ✅       | **P0** |
| - 配置/二维码下载      | ✅       | ❌       | **缺失**     | ✅       | **P0** |
| - 许可证续费按钮       | ✅       | ❌       | **缺失**     | ✅       | P1     |
| - 系统警告/公告        | ✅       | ❌       | **缺失**     | ✅       | P1     |
| **3. Devices 页面**    |          |          |              |          |        |
| - 设备列表             | ✅       | ✅       | 基本一致     | ✅       | -      |
| - 搜索框               | ✅       | ✅       | 一致         | ✅       | -      |
| - 高级搜索 Expand      | ✅       | ❌       | **缺失**     | ✅       | P1     |
| - 列设置/密度调整      | ✅       | ❓       | 需确认       | -        | P2     |
| - 批量操作             | ✅       | ❓       | 需确认       | ✅       | P2     |
| **4. Logs 模块**       |          |          |              |          |        |
| - Connection 日志      | ✅       | ✅       | 已实现       | ✅       | -      |
| - File 日志            | ✅       | ❌       | **缺失**     | ✅       | **P1** |
| - Alarm 日志           | ✅       | ❌       | **缺失**     | ✅       | **P1** |
| - Console 日志         | ✅       | ❌       | **缺失**     | ✅       | **P1** |
| - 日志子菜单结构       | ✅       | ❓       | 需确认       | -        | P1     |
| **5. Users 页面**      |          |          |              |          |        |
| - 用户列表             | ✅       | ✅       | 基本一致     | ✅       | -      |
| - Create 按钮          | ✅       | ✅       | 一致         | ✅       | -      |
| - Invite 按钮          | ✅       | ❌       | **缺失**     | ✅       | P2     |
| - 当前用户标识         | ✅       | ❌       | **缺失**     | ✅       | P2     |
| - 状态图标             | ✅       | ❓       | 需确认       | ✅       | P2     |
| **6. Groups 模块**     |          |          |              |          |        |
| - User Groups          | ✅       | ❌       | **缺失**     | ✅       | **P1** |
| - Device Groups        | ✅       | ✅       | 已实现       | ✅       | -      |
| - 子菜单结构           | ✅       | ❌       | **缺失**     | -        | **P1** |
| **7. Roles 页面**      |          |          |              |          |        |
| - 角色列表             | ✅       | ❌       | **完全缺失** | ✅       | **P0** |
| - 权限配置             | ✅       | ❌       | **完全缺失** | ✅       | **P0** |
| - 角色 CRUD            | ✅       | ❌       | **完全缺失** | ✅       | **P0** |
| **8. Address Books**   |          |          |              |          |        |
| - 个人地址簿           | ✅       | ✅       | 已实现       | ✅       | -      |
| - 共享地址簿           | ✅       | ❓       | 需确认       | ✅       | P1     |
| - 地址簿 UI            | ✅       | ❓       | 需对比       | -        | P2     |
| **9. Strategies 页面** |          |          |              |          |        |
| - 策略列表             | ✅       | ❌       | **完全缺失** | ✅       | **P0** |
| - 策略配置             | ✅       | ❌       | **完全缺失** | ✅       | **P0** |
| - 策略规则             | ✅       | ❌       | **完全缺失** | ✅       | **P0** |
| **10. Custom Clients** |          |          |              |          |        |
| - 客户端配置           | ✅       | ❌       | **完全缺失** | ✅       | **P1** |
| - 客户端下载           | ✅       | ❌       | **完全缺失** | ✅       | **P1** |
| **11. Settings 页面**  |          |          |              |          |        |
| - 系统设置             | ✅       | ❌       | **完全缺失** | ✅       | **P0** |
| - 配置项管理           | ✅       | ❌       | **完全缺失** | ✅       | **P0** |

---

## 🎨 UI/UX 差异分析

### 整体布局

| 方面       | 目标网站                          | 当前项目 | 差异         |
| ---------- | --------------------------------- | -------- | ------------ |
| **侧边栏** | 可折叠，带图标+文字               | 需确认   | 可能需调整   |
| **顶部栏** | Logo + 标题 + 用户信息 + 图标按钮 | 类似     | 需微调       |
| **面包屑** | 有                                | 需确认   | 可能需添加   |
| **页脚**   | GitHub 链接 + 官网链接 + 版权信息 | 有       | 需确认一致性 |

### 主题与样式

| 方面         | 目标网站              | 当前项目 | 差异   |
| ------------ | --------------------- | -------- | ------ |
| **配色方案** | 蓝色主色调            | 需确认   | 需统一 |
| **字体**     | 系统默认字体          | 需确认   | 需统一 |
| **间距**     | 适当的 padding/margin | 需确认   | 需优化 |
| **圆角**     | 适度的圆角设计        | 需确认   | 需统一 |
| **阴影**     | 卡片阴影效果          | 需确认   | 需添加 |

### 交互体验

| 功能           | 目标网站                   | 当前项目 | 差异   |
| -------------- | -------------------------- | -------- | ------ |
| **加载状态**   | Skeleton/Spin              | 需确认   | 需优化 |
| **空状态**     | 友好的空状态提示           | 需确认   | 需优化 |
| **错误处理**   | 全局错误提示               | 需确认   | 需完善 |
| **确认对话框** | 操作前确认                 | 需确认   | 需添加 |
| **消息提示**   | success/error/warning/info | 需确认   | 需统一 |
| **表格交互**   | 排序、筛选、展开行         | 部分实现 | 需完善 |

### 组件细节

| 组件         | 目标网站特性               | 当前项目 | 改进点       |
| ------------ | -------------------------- | -------- | ------------ |
| **表格**     | 列宽可调、固定列、展开行   | 基础表格 | 增强功能     |
| **表单**     | 校验提示、布局优化         | 基础表单 | 用户体验优化 |
| **按钮**     | Loading 状态、禁用状态清晰 | 需确认   | 状态反馈     |
| **模态框**   | 尺寸自适应、遮罩层         | 需确认   | 交互优化     |
| **下拉菜单** | 动画效果、触发方式         | 需确认   | 体验提升     |

---

## 🔧 后端 API 支持情况

根据后端 API 文档（http://localhost:3000/api-docs-json），以下接口已可用：

### 已支持的 API 模块

1. ✅ **认证相关** - 登录、登出、Token 刷新
2. ✅ **用户管理** - 用户 CRUD、角色分配
3. ✅ **设备管理** - 设备列表、详情、操作
4. ✅ **设备组** - 组的增删改查
5. ✅ **审计日志** - Connection/File/Alarm/Console 日志
6. ✅ **地址簿** - 个人/共享地址簿操作
7. ✅ **策略管理** - 策略配置接口
8. ✅ **角色权限** - 角色和权限管理
9. ✅ **系统设置** - 配置项读写
10. ✅ **自定义客户端** - 客户端配置和生成

> **结论**: 后端 API 已经完整支持所有目标网站的功能，可以全面进行前端开发。

---

## 📝 详细执行计划

### 🚀 Phase 1: 核心缺失功能（P0 - 最高优先级）

#### 任务 1.1: 实现 Welcome 页面

**预计工时**: 4-6 小时
**具体工作**:

- [ ] 创建 `/welcome` 路由和页面组件
- [ ] 实现用户信息卡片（调用用户信息 API）
- [ ] 显示版本信息和更新提示
- [ ] 许可证状态展示（调用许可证 API）
- [ ] 配置下载和二维码生成功能
- [ ] 许可证续费/升级按钮（可能为外部链接）
- [ ] 系统警告/公告区域
- [ ] 响应式布局适配

**技术要点**:

```typescript
// 主要 API 调用
-GET / api / user / info - // 获取当前用户信息
  GET / api / system / version - // 获取版本信息
  GET / api / license / status - // 获取许可证状态
  GET / api / config / download; // 下载配置文件
```

**UI 组件**:

- Card 卡片组件
- Table 信息表格
- Collapse 折叠面板（配置区域）
- Button 按钮组件
- Alert 警告组件
- Tag 标签组件（版本号）

---

#### 任务 1.2: 实现 Roles 角色管理页面

**预计工时**: 6-8 小时
**具体工作**:

- [ ] 创建 `/roles` 路由和页面组件
- [ ] 角色列表展示（Table）
- [ ] 创建角色模态框（Modal + Form）
- [ ] 编辑角色功能
- [ ] 删除角色（带确认）
- [ ] 权限配置界面（Checkbox Tree 或类似组件）
- [ ] 角色搜索和筛选
- [ ] 批量操作（批量删除）

**技术要点**:

```typescript
// 主要 API 调用
- GET    /api/roles              // 获取角色列表
- POST   /api/roles              // 创建角色
- PUT    /api/roles/:id          // 更新角色
- DELETE /api/roles/:id          // 删除角色
- GET    /api/permissions        // 获取权限列表
```

**UI 组件**:

- ProTable 高级表格
- ModalForm 模态框表单
- CheckboxGroup 权限选择
- Tree 树形控件（权限树）

---

#### 任务 1.3: 实现 Strategies 策略管理页面

**预计工时**: 8-10 小时
**具体工作**:

- [ ] 创建 `/strategy` 路由和页面组件
- [ ] 策略列表展示
- [ ] 创建策略向导（多步骤表单）
- [ ] 策略规则编辑器（复杂表单）
- [ ] 策略启用/禁用切换
- [ ] 策略复制功能
- [ ] 策略删除（带确认）
- [ ] 策略预览功能

**技术要点**:

```typescript
// 主要 API 调用
- GET    /api/strategies         // 获取策略列表
- POST   /api/strategies         // 创建策略
- PUT    /api/strategies/:id     // 更新策略
- DELETE /api/strategies/:id     // 删除策略
- GET    /api/strategies/:id     // 获取策略详情
```

**UI 组件**:

- Steps 步骤条（向导）
- Form 复杂表单
- Switch 开关
- Card 策略卡片
- Drawer 抽屉（详情查看）

---

#### 任务 1.4: 实现 Settings 系统设置页面

**预计工时**: 6-8 小时
**具体工作**:

- [ ] 创建 `/settings` 路由和页面组件
- [ ] 设置分类（基本设置、安全设置、高级设置）
- [ ] 设置项编辑（多种表单控件）
- [ ] 设置保存和重置功能
- [ ] 设置变更确认机制
- [ ] 设置导入/导出功能
- [ ] Tab 分类切换或侧边栏分类

**技术要点**:

```typescript
// 主要 API 调用
- GET    /api/settings           // 获取所有设置
- GET    /api/settings/:key      // 获取单个设置
- PUT    /api/settings/:key      // 更新设置
- POST   /api/settings/batch     // 批量更新设置
```

**UI 组件**:

- Tabs 标签页或 Menu 侧边栏分类
- Form 表单（Input, Select, Switch, Radio 等）
- Card 分组容器
- Message 操作反馈

---

### 🎯 Phase 2: 重要功能补充（P1 - 高优先级）

#### 任务 2.1: 完善 Logs 日志模块

**预计工时**: 4-6 小时
**具体工作**:

- [ ] 创建 File 日志页面 (`/audit/file`)
- [ ] 创建 Alarm 日志页面 (`/audit/alarm`)
- [ ] 创建 Console 日志页面 (`/audit/console`)
- [ ] 统一日志页面的样式和交互
- [ ] 优化日志子菜单结构
- [ ] 添加日志导出功能
- [ ] 日志高级筛选（时间范围、级别等）

**文件结构**:

```
src/pages/audits/
├── conn/index.tsx      # 已有 - 连接日志
├── file/index.tsx      # 新建 - 文件日志
├── alarm/index.tsx     # 新建 - 报警日志
└── console/index.tsx   # 新建 - 控制台日志
```

---

#### 任务 2.2: 实现 User Groups 用户组管理

**预计工时**: 3-4 小时
**具体工作**:

- [ ] 创建 `/groups/user` 路由和页面
- [ ] 用户组列表展示
- [ ] 用户组 CRUD 操作
- [ ]组成员管理（添加/移除成员）
- [ ] 完善 Groups 子菜单结构

**文件结构**:

```
src/pages/groups/
├── user/index.tsx      # 新建 - 用户组
└── device/index.tsx    # 已有或新建 - 设备组
```

---

#### 任务 2.3: 实现 Custom Clients 自定义客户端页面

**预计工时**: 4-6 小时
**具体工作**:

- [ ] 创建 `/custom-client` 路由和页面
- [ ] 客户端配置表单
- [ ] 配置预览功能
- [ ] 客户端下载按钮
- [ ] 配置模板管理
- [ ] 配置历史记录

**技术要点**:

```typescript
// 主要 API 调用
- GET    /api/custom-clients       // 获取客户端配置列表
- POST   /api/custom-clients       // 创建配置
- PUT    /api/custom-clients/:id   // 更新配置
- GET    /api/custom-clients/:id/download  // 下载客户端
```

---

#### 任务 2.4: UI/UX 统一优化

**预计工时**: 6-8 小时
**具体工作**:

##### 2.4.1 全局样式统一

- [ ] 统一颜色变量（主题色、成功色、错误色等）
- [ ] 统一字体规范
- [ ] 统一间距标准（padding、margin、gap）
- [ ] 统一圆角规范
- [ ] 统一阴影规范

##### 2.4.2 组件库增强

- [ ] 封装统一的 Table 组件（带列设置、密度调整）
- [ ] 封装统一的 SearchForm 组件
- [ ] 封装统一的 ModalForm 组件
- [ ] 封装统一的 PageContainer 组件
- [ ] 封装统一的 EmptyState 空状态组件

##### 2.4.3 交互优化

- [ ] 添加全局 loading 状态管理
- [ ] 优化错误处理和提示
- [ ] 添加操作确认对话框
- [ ] 优化表格排序和筛选体验
- [ ] 添加键盘快捷键支持（可选）

##### 2.4.4 响应式适配

- [ ] 侧边栏响应式（移动端收起）
- [ ] 表格响应式（横向滚动）
- [ ] 表单响应式布局
- [ ] 断点适配测试

---

### ✨ Phase 3: 体验优化（P2 - 中优先级）

#### 任务 3.1: 登录页面增强

**预计工时**: 2-3 小时
**具体工作**:

- [ ] 添加 "Remember me" 复选框
- [ ] 添加 "Forgot Password" 链接
- [ ] 优化登录表单验证提示
- [ ] 添加登录动画效果
- [ ] 优化登录错误提示

---

#### 任务 3.2: Users 页面增强

**预计工时**: 2-3 小时
**具体工作**:

- [ ] 添加 "Invite" 邀请按钮
- [ ] 当前用户标识（"Me" 标签、crown 图标）
- [ ] 用户状态可视化图标
- [ ] 优化用户卡片展示

---

#### 任务 3.3: Devices 页面增强

**预计工时**: 2-3 小时
**具体工作**:

- [ ] 添加高级搜索（Expand 区域）
- [ ] 列设置功能
- [ ] 表格密度调整
- [ ] 批量操作功能
- [ ] 设备状态实时更新（可选 WebSocket）

---

#### 任务 3.4: Address Books 增强

**预计工时**: 2-3 小时
**具体工作**:

- [ ] 确认共享地址簿功能
- [ ] 优化地址簿条目编辑体验
- [ ] 添加导入/导出功能
- [ ] 优化搜索和筛选

---

## 🗂️ 项目文件结构调整建议

### 新增目录结构

```
src/
├── pages/
│   ├── welcome/                  # 新增 - Welcome 页面
│   │   └── index.tsx
│   ├── roles/                    # 新增 - Roles 页面
│   │   └── index.tsx
│   ├── strategy/                 # 新增 - Strategies 页面
│   │   └── index.tsx
│   ├── settings/                 # 新增 - Settings 页面
│   │   └── index.tsx
│   ├── custom-client/            # 新增 - Custom Clients 页面
│   │   └── index.tsx
│   ├── groups/                   # 重构 - Groups 模块
│   │   ├── user/                # 新增 - User Groups
│   │   │   └── index.tsx
│   │   └── device/              # 已有或重构 - Device Groups
│   │       └── index.tsx
│   └── audits/                   # 扩展 - Audits 模块
│       ├── conn/                 # 已有
│       ├── file/                 # 新增
│       ├── alarm/                # 新增
│       └── console/              # 新增
├── services/
│   └── rustdesk-console/
│       ├── role.ts               # 新增 - 角色 API
│       ├── strategy.ts           # 新增 - 策略 API
│       ├── settings.ts           # 新增 - 设置 API
│       ├── customClient.ts       # 新增 - 自定义客户端 API
│       ├── userGroup.ts          # 新增 - 用户组 API
│       └── license.ts           # 新增 - 许可证 API
├── components/
│   ├── PageContainer/            # 新增 - 页面容器
│   ├── SearchForm/               # 新增 - 搜索表单
│   ├── EnhancedTable/            # 新增 - 增强表格
│   └── EmptyState/               # 新增 - 空状态
└── utils/
    └── constants.ts              # 新增 - 全局常量
```

---

## 🛠️ 技术实现建议

### 1. 使用 Ant Design Pro Components

目标网站大量使用了 Ant Design Pro 的高级组件，建议：

- 使用 `ProTable` 替代基础 `Table`
- 使用 `ProForm` 和 `ModalForm` 构建表单
- 使用 `PageContainer` 统一页面布局
- 使用 `FooterToolbar` 固定底栏

### 2. 状态管理方案

- 使用 Umi 内置的 `useModel` 进行全局状态管理
- 或者集成 `zustand` 轻量级状态管理
- 关键状态：用户信息、权限、主题、国际化

### 3. API 层封装

- 统一使用 `umi-request` 或 `@umijs/use-request`
- 统一错误处理和 token 注入
- 请求/响应拦截器
- Loading 状态自动管理

### 4. 路由配置

```typescript
// config/routes.ts 示例
const routes = [
  { path: "/welcome", component: "./welcome" },
  { path: "/devices", component: "./devices" },
  {
    path: "/audits",
    routes: [
      { path: "/audits/connect", component: "./audits/conn" },
      { path: "/audits/file", component: "./audits/file" },
      { path: "/audits/alarm", component: "./audits/alarm" },
      { path: "/audits/console", component: "./audits/console" },
    ],
  },
  { path: "/users", component: "./users" },
  {
    path: "/groups",
    routes: [
      { path: "/groups/user", component: "./groups/user" },
      { path: "/groups/device", component: "./groups/device" },
    ],
  },
  { path: "/roles", component: "./roles" },
  { path: "/ab", component: "./address-book" }, // Address Books
  { path: "/strategy", component: "./strategy" },
  { path: "/custom-client", component: "./custom-client" },
  { path: "/settings", component: "./settings" },
];
```

### 5. 权限控制

- 路由级别权限（未授权跳转）
- 按钮级别权限（隐藏/禁用）
- 数据级别权限（过滤数据）
- 使用 `Access` 组件或自定义 HOC

---

## 📌 开发顺序建议

### 第一周：核心页面开发

1. **Day 1-2**: Welcome 页面 + 路由配置
2. **Day 3-4**: Roles 角色管理页面
3. **Day 5**: Strategies 策略管理页面（基础部分）

### 第二周：继续核心 + 重要功能

4. **Day 6-7**: Strategies 完成 + Settings 页面开始
5. **Day 8-9**: Settings 页面完成
6. **Day 10**: Logs 模块完善（File/Alarm/Console）

### 第三周：重要功能 + UI 优化

7. **Day 11-12**: User Groups + Custom Clients
8. **Day 13-14**: UI/UX 统一优化
9. **Day 15**: 响应式适配 + 测试

### 第四周：体验优化 + 收尾

10. **Day 16-17**: 登录页面增强 + 各页面细节优化
11. **Day 18-19**: Devices/Users 页面增强
12. **Day 20**: 全面测试 + Bug 修复 + 文档

---

## ✅ 验收标准

### 功能完整性

- [ ] 所有目标网站的功能页面均已实现
- [ ] 所有页面的 CRUD 操作正常工作
- [ ] 所有 API 接口正确对接
- [ ] 权限控制生效

### UI 一致性

- [ ] 页面布局与目标网站一致
- [ ] 颜色、字体、间距统一
- [ ] 组件风格统一
- [ ] 交互行为一致

### 代码质量

- [ ] TypeScript 类型完整
- [ ] 组件化合理，复用性高
- [ ] 代码结构清晰
- [ ] 无明显 Bug

### 用户体验

- [ ] 加载状态友好
- [ ] 错误提示清晰
- [ ] 操作流畅无卡顿
- [ ] 响应式适配良好

---

## 📚 参考资料

- **截图文件**:

  - `target-welcome-page.png` - Welcome 页面截图
  - `target-devices-page.png` - Devices 页面截图
  - `target-logs-connection.png` - Connection 日志截图
  - `target-users-page.png` - Users 页面截图

- **目标网站**: http://ifengdian.top:63002/
- **后端 API 文档**: http://localhost:3000/api-docs-json
- **Ant Design 文档**: https://ant.design/
- **Ant Design Pro 文档**: https://pro.ant.design/
- **Umi 文档**: https://umijs.org/

---

## 📞 注意事项

1. **后端依赖**: 所有功能开发前先确认后端 API 可用
2. **逐步实施**: 按 Phase 顺序实施，每个 Phase 完成后测试
3. **保持沟通**: 遇到不确定的地方及时确认需求
4. **代码规范**: 遵循项目现有代码规范和 ESLint 规则
5. **Git 管理**: 每完成一个功能点就提交一次，写好 commit message

---

**文档版本**: v1.0
**创建日期**: 2026-04-16
**最后更新**: 2026-04-16
