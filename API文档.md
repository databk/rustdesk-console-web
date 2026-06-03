# 策略管理 API 文档

所有接口需要管理员权限（JWT Token + `isAdmin: true`）

---

## 1. 获取策略列表

**GET** `/api/strategies`

### Query Parameters

| 参数     | 类型   | 必填 | 默认值 | 说明           |
| -------- | ------ | ---- | ------ | -------------- |
| current  | number | 否   | 1      | 当前页码       |
| pageSize | number | 否   | 100    | 每页数量       |
| name     | string | 否   | -      | 按名称模糊搜索 |

### Response

```json
{
  "data": [
    {
      "guid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "default-policy",
      "note": "默认策略",
      "config_options": {
        "allow-file-transfer": "true",
        "disable-audio": "false"
      },
      "modified_at": 1748716800000,
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-05-31T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

## 2. 获取策略详情

**GET** `/api/strategies/:guid`

### Path Parameters

| 参数 | 类型   | 必填 | 说明      |
| ---- | ------ | ---- | --------- |
| guid | string | 是   | 策略 GUID |

### Response

```json
{
  "guid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "default-policy",
  "note": "默认策略",
  "config_options": {
    "allow-file-transfer": "true",
    "disable-audio": "false"
  },
  "modified_at": 1748716800000,
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-05-31T00:00:00.000Z"
}
```

---

## 3. 创建策略

**POST** `/api/strategies`

### Request Body

```json
{
  "name": "secure-policy",
  "note": "安全策略",
  "config_options": {
    "allow-file-transfer": "false",
    "disable-audio": "true",
    "enable-keyboard": "true"
  }
}
```

| 字段           | 类型   | 必填 | 说明                         |
| -------------- | ------ | ---- | ---------------------------- |
| name           | string | 是   | 策略名称，唯一               |
| note           | string | 否   | 备注                         |
| config_options | object | 否   | 配置项键值对（值均为字符串） |

### Response

```json
{
  "guid": "new-guid-here",
  "name": "secure-policy",
  "note": "安全策略",
  "config_options": {
    "allow-file-transfer": "false",
    "disable-audio": "true",
    "enable-keyboard": "true"
  },
  "modified_at": 1748716800000
}
```

---

## 4. 更新策略

**PATCH** `/api/strategies/:guid`

### Path Parameters

| 参数 | 类型   | 必填 | 说明      |
| ---- | ------ | ---- | --------- |
| guid | string | 是   | 策略 GUID |

### Request Body

```json
{
  "name": "updated-name",
  "note": "更新备注",
  "config_options": {
    "allow-file-transfer": "true"
  }
}
```

所有字段可选，仅更新传入的字段。更新后 `modified_at` 自动刷新。

### Response

```json
{
  "guid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "updated-name",
  "note": "更新备注",
  "config_options": {
    "allow-file-transfer": "true"
  },
  "modified_at": 1748720000000
}
```

---

## 5. 删除策略

**DELETE** `/api/strategies/:guid`

### Path Parameters

| 参数 | 类型   | 必填 | 说明      |
| ---- | ------ | ---- | --------- |
| guid | string | 是   | 策略 GUID |

### Response

```json
{
  "message": "策略删除成功"
}
```

---

## 6. 分配策略

**POST** `/api/strategies/:guid/assign`

将策略分配给设备、用户或设备组。

### Path Parameters

| 参数 | 类型   | 必填 | 说明      |
| ---- | ------ | ---- | --------- |
| guid | string | 是   | 策略 GUID |

### Request Body

```json
{
  "target_type": "device",
  "target_guid": "device-uuid-here"
}
```

| 字段        | 类型   | 必填 | 说明                                           |
| ----------- | ------ | ---- | ---------------------------------------------- |
| target_type | string | 是   | 目标类型：`device` / `user` / `device_group`   |
| target_guid | string | 是   | 目标的 GUID（设备用 uuid，用户/设备组用 guid） |

### Response

```json
{
  "message": "策略分配成功"
}
```

---

## 7. 取消分配

**POST** `/api/strategies/:guid/unassign`

移除设备、用户或设备组的策略关联。

### Request Body

```json
{
  "target_type": "device",
  "target_guid": "device-uuid-here"
}
```

### Response

```json
{
  "message": "策略取消分配成功"
}
```

---

## 可用配置项参考

配置项键名参考 `config.txt`,格式：配置名 默认值 可选值
