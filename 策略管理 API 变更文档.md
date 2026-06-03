# 策略管理 API 变更文档

> 本文档面向前端开发者，涵盖策略模块重构的所有接口变更。

---

## 一、变更概述

本次重构主要包含以下变更：

1. **移除 `modifiedAt` 字段**：统一使用 TypeORM 自动管理的 `updated_at` 字段
2. **简化策略列表响应**：列表接口仅返回基本字段，详细信息需通过详情接口获取
3. **批量分配/取消分配**：支持批量操作，单次最多处理 200 个目标

---

## 二、字段变更

### 2.1 移除的字段

| 字段          | 说明                               |
| ------------- | ---------------------------------- |
| `modified_at` | 已移除，请使用 `updated_at` 代替   |
| `created_at`  | 列表接口不再返回，详情接口仍可获取 |

### 2.2 字段映射

| 旧字段        | 新字段       | 说明                                             |
| ------------- | ------------ | ------------------------------------------------ |
| `modified_at` | `updated_at` | 时间戳格式变更：从毫秒时间戳改为 ISO 8601 字符串 |

---

## 三、接口变更详情

### 3.1 获取策略列表

**端点**：`GET /api/strategies`

**变更说明**：响应简化，仅返回基本字段。

**响应变更对照**：

| 字段             | 变更前 | 变更后     |
| ---------------- | ------ | ---------- |
| `guid`           | ✓      | ✓          |
| `name`           | ✓      | ✓          |
| `note`           | ✓      | ✓          |
| `config_options` | ✓      | **已移除** |
| `modified_at`    | ✓      | **已移除** |
| `created_at`     | ✓      | **已移除** |
| `updated_at`     | -      | ✓ (新增)   |

**变更前响应示例**：

```json
{
  "data": [
    {
      "guid": "550e8400-e29b-41d4-a716-446655440000",
      "name": "默认策略",
      "note": "系统默认策略",
      "config_options": {
        "option1": "value1"
      },
      "modified_at": 1717234567890,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-06-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

**变更后响应示例**：

```json
{
  "data": [
    {
      "guid": "550e8400-e29b-41d4-a716-446655440000",
      "name": "默认策略",
      "note": "系统默认策略",
      "updated_at": "2024-06-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 3.2 创建策略

**端点**：`POST /api/strategies`

**变更说明**：响应字段变更。

**响应变更对照**：

| 字段             | 变更前 | 变更后     |
| ---------------- | ------ | ---------- |
| `name`           | ✓      | ✓          |
| `note`           | ✓      | ✓          |
| `config_options` | ✓      | ✓          |
| `modified_at`    | ✓      | **已移除** |
| `updated_at`     | -      | ✓ (新增)   |

**变更前响应示例**：

```json
{
  "name": "新策略",
  "note": "策略说明",
  "config_options": {},
  "modified_at": 1717234567890
}
```

**变更后响应示例**：

```json
{
  "name": "新策略",
  "note": "策略说明",
  "config_options": {},
  "updated_at": "2024-06-01T00:00:00.000Z"
}
```

---

### 3.3 更新策略

**端点**：`PATCH /api/strategies/:guid`

**变更说明**：响应字段变更。

**响应变更对照**：

| 字段             | 变更前 | 变更后     |
| ---------------- | ------ | ---------- |
| `name`           | ✓      | ✓          |
| `note`           | ✓      | ✓          |
| `config_options` | ✓      | ✓          |
| `modified_at`    | ✓      | **已移除** |
| `updated_at`     | -      | ✓ (新增)   |

**变更前响应示例**：

```json
{
  "name": "更新后的策略",
  "note": "更新后的说明",
  "config_options": {},
  "modified_at": 1717234567890
}
```

**变更后响应示例**：

```json
{
  "name": "更新后的策略",
  "note": "更新后的说明",
  "config_options": {},
  "updated_at": "2024-06-01T00:00:00.000Z"
}
```

---

### 3.4 获取策略详情

**端点**：`GET /api/strategies/:guid`

**变更说明**：响应字段变更。

**响应变更对照**：

| 字段             | 变更前 | 变更后     |
| ---------------- | ------ | ---------- |
| `guid`           | ✓      | ✓          |
| `name`           | ✓      | ✓          |
| `note`           | ✓      | ✓          |
| `config_options` | ✓      | ✓          |
| `modified_at`    | ✓      | **已移除** |
| `created_at`     | ✓      | **已移除** |
| `updated_at`     | -      | ✓ (新增)   |

**变更前响应示例**：

```json
{
  "guid": "550e8400-e29b-41d4-a716-446655440000",
  "name": "默认策略",
  "note": "系统默认策略",
  "config_options": {
    "option1": "value1"
  },
  "modified_at": 1717234567890,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-06-01T00:00:00.000Z"
}
```

**变更后响应示例**：

```json
{
  "guid": "550e8400-e29b-41d4-a716-446655440000",
  "name": "默认策略",
  "note": "系统默认策略",
  "config_options": {
    "option1": "value1"
  },
  "updated_at": "2024-06-01T00:00:00.000Z"
}
```

---

### 3.5 分配策略（批量操作）

**端点**：`POST /api/strategies/:guid/assign`

**变更说明**：支持批量分配，请求体和响应体结构变更。

#### 请求体变更

| 参数           | 变更前        | 变更后                       |
| -------------- | ------------- | ---------------------------- |
| `target_type`  | ✓             | ✓ (不变)                     |
| `target_guid`  | string (单个) | **已移除**                   |
| `target_guids` | -             | string[] (批量，最多 200 个) |

**变更前请求示例**：

```http
POST /api/strategies/550e8400-e29b-41d4-a716-446655440000/assign
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "target_type": "device",
  "target_guid": "device-uuid-123"
}
```

**变更后请求示例**：

```http
POST /api/strategies/550e8400-e29b-41d4-a716-446655440000/assign
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "target_type": "device",
  "target_guids": [
    "device-uuid-1",
    "device-uuid-2",
    "device-uuid-3"
  ]
}
```

#### 响应体变更

**变更前响应**：

```json
{
  "message": "策略分配成功"
}
```

**变更后响应**（最佳努力模式）：

```json
{
  "success": ["device-uuid-1", "device-uuid-2"],
  "errors": [
    {
      "target_guid": "device-uuid-3",
      "reason": "设备不存在"
    }
  ]
}
```

> **最佳努力模式说明**：
>
> - 接口会尝试处理所有目标，成功的返回在 `success` 数组中
> - 失败的目标返回在 `errors` 数组中，包含失败原因
> - 即使部分失败，成功的部分仍会生效
> - 如果所有目标都失败，`success` 数组为空

---

### 3.6 取消分配策略（批量操作）

**端点**：`POST /api/strategies/unassign`

**变更说明**：支持批量取消分配，请求体和响应体结构变更。

#### 请求体变更

| 参数           | 变更前        | 变更后                       |
| -------------- | ------------- | ---------------------------- |
| `target_type`  | ✓             | ✓ (不变)                     |
| `target_guid`  | string (单个) | **已移除**                   |
| `target_guids` | -             | string[] (批量，最多 200 个) |

**变更前请求示例**：

```http
POST /api/strategies/unassign
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "target_type": "device",
  "target_guid": "device-uuid-123"
}
```

**变更后请求示例**：

```http
POST /api/strategies/unassign
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "target_type": "device",
  "target_guids": [
    "device-uuid-1",
    "device-uuid-2",
    "device-uuid-3"
  ]
}
```

#### 响应体变更

**变更前响应**：

```json
{
  "message": "策略取消分配成功"
}
```

**变更后响应**（最佳努力模式）：

```json
{
  "success": ["device-uuid-1", "device-uuid-2"],
  "errors": [
    {
      "target_guid": "device-uuid-3",
      "reason": "设备不存在"
    }
  ]
}
```

---

## 四、错误响应

批量操作不再抛出 404 错误，而是将失败项放入 `errors` 数组：

| target_type    | reason       |
| -------------- | ------------ |
| `device`       | 设备不存在   |
| `user`         | 用户不存在   |
| `device_group` | 设备组不存在 |

---

## 五、变更对照表

| 接口                            | 变更类型     | 说明                                               |
| ------------------------------- | ------------ | -------------------------------------------------- |
| `GET /strategies`               | 响应简化     | 移除 `config_options`、`modified_at`、`created_at` |
| `POST /strategies`              | 字段变更     | `modified_at` → `updated_at`                       |
| `PATCH /strategies/:guid`       | 字段变更     | `modified_at` → `updated_at`                       |
| `GET /strategies/:guid`         | 字段变更     | 移除 `modified_at`、`created_at`                   |
| `POST /strategies/:guid/assign` | 批量操作     | `target_guid` → `target_guids[]`，响应结构变更     |
| `POST /strategies/unassign`     | 批量操作     | `target_guid` → `target_guids[]`，响应结构变更     |
| `POST /heartbeat`               | 字段来源变更 | `modified_at` 值来源变更                           |
