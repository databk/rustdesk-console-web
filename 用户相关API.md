# 用户管理接口文档

> 本文档面向前端开发者，涵盖用户管理模块重构和 2FA 用户设置流程的所有接口变更。

---

## 一、用户管理接口

### 1.1 获取用户列表

**端点**：`GET /api/users`

**权限**：已登录用户（管理员可见全部，普通用户仅见权限范围内用户）

**简介**：获取用户列表，支持分页和筛选。管理员可查看所有用户，普通用户只能查看自己、被直接授权的用户、以及通过设备组间接关联的用户。

**请求参数**（Query）：

| 参数         | 类型   | 必填 | 说明                                                |
| ------------ | ------ | ---- | --------------------------------------------------- |
| `current`    | number | 是   | 当前页码，从 1 开始                                 |
| `pageSize`   | number | 是   | 每页数量                                            |
| `status`     | string | 否   | 用户状态过滤：`"1"`=正常，`"0"`=禁用，`"-1"`=未验证 |
| `name`       | string | 否   | 用户名模糊匹配                                      |
| `group_name` | string | 否   | 设备组名称模糊匹配                                  |

**请求示例**：

```http
GET /api/users?current=1&pageSize=10&status=1&name=admin
Authorization: Bearer <access_token>
```

**响应示例**：

```json
{
  "data": [
    {
      "guid": "550e8400-e29b-41d4-a716-446655440000",
      "name": "admin",
      "email": "admin@example.com",
      "note": "系统管理员",
      "status": 1,
      "is_admin": true
    }
  ],
  "total": 1
}
```

---

### 1.2 创建用户

**端点**：`POST /api/users`

**权限**：管理员

**简介**：创建新用户账户。

**请求体**：

| 参数       | 类型   | 必填 | 说明           |
| ---------- | ------ | ---- | -------------- |
| `name`     | string | 是   | 用户名（唯一） |
| `password` | string | 是   | 密码           |
| `email`    | string | 否   | 邮箱（唯一）   |
| `note`     | string | 否   | 备注           |

**请求示例**：

```http
POST /api/users
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "newuser",
  "password": "SecurePass123!",
  "email": "newuser@example.com",
  "note": "新员工"
}
```

**响应示例**：

```json
{
  "message": "用户创建成功"
}
```

**错误响应**：

| HTTP 状态码 | 错误信息                   |
| ----------- | -------------------------- |
| 400         | 用户名已存在               |
| 400         | 邮箱已存在                 |
| 403         | 无权限访问，需要管理员权限 |

---

### 1.3 获取用户详情

**端点**：`GET /api/users/:guid`

**权限**：管理员

**简介**：获取单个用户的详细信息。

**请求示例**：

```http
GET /api/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
```

**响应示例**：

```json
{
  "guid": "550e8400-e29b-41d4-a716-446655440000",
  "name": "admin",
  "email": "admin@example.com",
  "note": "系统管理员",
  "status": 1,
  "is_admin": true,
  "third_auth_type": "",
  "strategy_guid": "",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-06-01T00:00:00.000Z"
}
```

---

### 1.4 更新用户

**端点**：`PATCH /api/users/:guid`

**权限**：管理员

**简介**：更新用户信息，包括启用/禁用状态变更。原 `POST /users/:guid/disable` 和 `POST /users/:guid/enable` 已合并为此接口。

**请求体**：

| 参数       | 类型    | 必填 | 说明                                      |
| ---------- | ------- | ---- | ----------------------------------------- |
| `name`     | string  | 否   | 用户名（唯一）                            |
| `email`    | string  | 否   | 邮箱（唯一）                              |
| `note`     | string  | 否   | 备注                                      |
| `status`   | number  | 否   | 用户状态：`1`=正常，`0`=禁用，`-1`=未验证 |
| `is_admin` | boolean | 否   | 是否为管理员                              |

**请求示例（禁用用户）**：

```http
PATCH /api/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": 0
}
```

**请求示例（启用用户）**：

```json
{
  "status": 1
}
```

**响应示例**：

```json
{
  "message": "用户已更新"
}
```

---

### 1.5 删除用户

**端点**：`DELETE /api/users/:guid`

**权限**：管理员

**简介**：删除指定用户。

**请求示例**：

```http
DELETE /api/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
```

**响应示例**：

```json
{
  "message": "用户已删除"
}
```

---

### 1.6 邀请用户

**端点**：`POST /api/users/invite`

**权限**：管理员

**简介**：通过邮件邀请用户加入，用户状态为"未验证"。

**请求体**：

| 参数         | 类型   | 必填 | 说明             |
| ------------ | ------ | ---- | ---------------- |
| `email`      | string | 是   | 邀请邮箱         |
| `name`       | string | 是   | 用户名           |
| `group_name` | string | 否   | 分配的设备组名称 |
| `note`       | string | 否   | 备注             |

**请求示例**：

```http
POST /api/users/invite
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": "invited@example.com",
  "name": "invited_user",
  "note": "邀请加入项目组"
}
```

**响应示例**：

```json
{
  "message": "邀请发送成功"
}
```

---

### 1.8 更新用户安全设置

**端点**：`PATCH /api/users/:guid/security`

**权限**：管理员

**简介**：设置用户的 2FA 强制状态和邮箱验证。原 `PUT /users/tfa/totp/enforce` 和 `PUT /users/disable_login_verification` 已合并为此接口。

**请求体**：

| 参数                 | 类型    | 必填 | 说明                 |
| -------------------- | ------- | ---- | -------------------- |
| `tfa_enforce`        | boolean | 否   | 是否强制开启 2FA     |
| `email_verification` | boolean | 否   | 是否开启邮箱验证登录 |

**请求示例（强制 2FA）**：

```http
PATCH /api/users/550e8400-e29b-41d4-a716-446655440000/security
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "tfa_enforce": true
}
```

**响应示例**：

```json
{
  "message": "安全设置已更新"
}
```

---

### 1.9 强制登出用户

**端点**：`DELETE /api/users/:guid/sessions`

**权限**：管理员

**简介**：撤销用户的所有登录令牌，强制其重新登录。原 `POST /users/force-logout` 已改为 RESTful 语义。

**请求示例**：

```http
DELETE /api/users/550e8400-e29b-41d4-a716-446655440000/sessions
Authorization: Bearer <access_token>
```

**响应示例**：

```json
{
  "message": "强制登出成功"
}
```

---

### 1.10 批量更新用户状态

**端点**：`PATCH /api/users/batch/status`

**权限**：管理员

**简介**：批量启用或禁用多个用户。

**请求体**：

| 参数         | 类型     | 必填 | 说明                         |
| ------------ | -------- | ---- | ---------------------------- |
| `user_guids` | string[] | 是   | 用户 GUID 列表               |
| `status`     | number   | 是   | 目标状态：`1`=启用，`0`=禁用 |

**请求示例**：

```http
PATCH /api/users/batch/status
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "user_guids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ],
  "status": 0
}
```

**响应示例**：

```json
{
  "succeeded": ["550e8400-e29b-41d4-a716-446655440000"],
  "failed": [
    {
      "guid": "660e8400-e29b-41d4-a716-446655440001",
      "reason": "User not found"
    }
  ],
  "total": 2,
  "succeededCount": 1,
  "failedCount": 1
}
```

---

### 1.11 批量更新安全设置

**端点**：`PATCH /api/users/batch/security`

**权限**：管理员

**简介**：批量设置多个用户的 2FA 强制状态或邮箱验证。

**请求体**：

| 参数                 | 类型     | 必填 | 说明                 |
| -------------------- | -------- | ---- | -------------------- |
| `user_guids`         | string[] | 是   | 用户 GUID 列表       |
| `tfa_enforce`        | boolean  | 否   | 是否强制开启 2FA     |
| `email_verification` | boolean  | 否   | 是否开启邮箱验证登录 |

**请求示例**：

```http
PATCH /api/users/batch/security
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "user_guids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ],
  "tfa_enforce": true
}
```

**响应示例**：

```json
{
  "message": "批量安全设置已更新"
}
```

---

### 1.12 批量强制登出

**端点**：`DELETE /api/users/batch/sessions`

**权限**：管理员

**简介**：批量撤销多个用户的登录令牌。

**请求体**：

| 参数         | 类型     | 必填 | 说明           |
| ------------ | -------- | ---- | -------------- |
| `user_guids` | string[] | 是   | 用户 GUID 列表 |

**请求示例**：

```http
DELETE /api/users/batch/sessions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "user_guids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ]
}
```

**响应示例**：

```json
{
  "message": "强制登出成功"
}
```

---

## 五、错误码汇总

| HTTP 状态码 | 场景                                     |
| ----------- | ---------------------------------------- |
| 400         | 参数错误、业务规则冲突（如用户名已存在） |
| 401         | 认证失败（密码错误、TOTP 码错误）        |
| 403         | 权限不足（非管理员访问管理员接口）       |
| 404         | 资源不存在（用户 GUID 无效）             |
