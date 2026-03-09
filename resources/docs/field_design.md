# 字段设计清单

## 1. 用户模块 (User)

### 1.1 登录/认证

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|:----:|------|
| id | VARCHAR(36) | ✓ | 主键，UUID |
| username | VARCHAR(50) | ✓ | 登录账号 |
| password | VARCHAR(128) | ✓ | 密码(加密存储) |
| salt | VARCHAR(32) | ✓ | 密码盐值 |
| role_id | VARCHAR(36) | ✓ | 关联角色 |
| dept_id | VARCHAR(36) | ✓ | 关联部门 |
| enterprise_id | VARCHAR(36) | ✓ | 关联企业 |
| status | TINYINT | ✓ | 状态: 0-禁用 1-正常 2-锁定 |
| last_login_time | DATETIME | | 最后登录时间 |
| last_login_ip | VARCHAR(50) | | 最后登录IP |
| created_at | DATETIME | ✓ | 创建时间 |
| updated_at | DATETIME | | 更新时间 |

### 1.2 用户信息

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|:----:|------|
| user_id | VARCHAR(36) | ✓ | 外键，关联用户 |
| real_name | VARCHAR(50) | ✓ | 真实姓名 |
| avatar | VARCHAR(255) | | 头像URL |
| phone | VARCHAR(20) | | 手机号 |
| email | VARCHAR(100) | | 邮箱 |
| employee_no | VARCHAR(50) | | 工号 |

### 1.3 角色

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|:----:|------|
| id | VARCHAR(36) | ✓ | 主键 |
| name | VARCHAR(50) | ✓ | 角色名称 |
| code | VARCHAR(50) | ✓ | 角色编码 |
| is_system | TINYINT | ✓ | 是否系统角色(不可删除) |
| description | VARCHAR(255) | | 描述 |
| created_at | DATETIME | ✓ | 创建时间 |

### 1.4 角色-页面权限

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|:----:|------|
| role_id | VARCHAR(36) | ✓ | 角色ID |
| page_code | VARCHAR(50) | ✓ | 页面编码 |

---

## 2. 企业与部门模块

### 2.1 企业

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|:----:|------|
| id | VARCHAR(36) | ✓ | 主键 |
| name | VARCHAR(100) | ✓ | 企业名称 |
| logo | VARCHAR(255) | | 企业LOGO |
| contact_phone | VARCHAR(20) | | 联系电话 |
| address | VARCHAR(255) | | 地址 |
| status | TINYINT | ✓ | 状态: 0-禁用 1-正常 |
| created_at | DATETIME | ✓ | 创建时间 |

### 2.2 部门

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|:----:|------|
| id | VARCHAR(36) | ✓ | 主键 |
| enterprise_id | VARCHAR(36) | ✓ | 所属企业 |
| parent_id | VARCHAR(36) | | 上级部门(树形) |
| name | VARCHAR(100) | ✓ | 部门名称 |
| code | VARCHAR(50) | ✓ | 部门编码 |
| leader_id | VARCHAR(36) | | 部门负责人 |
| sort_order | INT | | 排序号 |
| status | TINYINT | ✓ | 状态 |
| created_at | DATETIME | ✓ | 创建时间 |

---

## 3. 设备模块

### 3.1 设备类型

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|:----:|------|
| id | VARCHAR(36) | ✓ | 主键 |
| name | VARCHAR(100) | ✓ | 类型名称 |
| code | VARCHAR(50) | ✓ | 类型编码 |
| icon | VARCHAR(255) | | 图标 |
| description | VARCHAR(255) | | 描述 |
| created_at | DATETIME | ✓ | 创建时间 |

### 3.2 设备位置

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|:----:|------|
| id | VARCHAR(36) | ✓ | 主键 |
| name | VARCHAR(100) | ✓ | 位置名称 |
| code | VARCHAR(50) | ✓ | 位置编码 |
| parent_id | VARCHAR(36) | | 上级位置(树形) |
| building | VARCHAR(50) | | 楼栋 |
| floor | VARCHAR(20) | | 楼层 |
| area | VARCHAR(50) | | 区域 |
| created_at | DATETIME | ✓ | 创建时间 |

### 3.3 设备台账

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|:----:|------|
| id | VARCHAR(36) | ✓ | 主键 |
| name | VARCHAR(100) | ✓ | 设备名称 |
| device_no | VARCHAR(50) | ✓ | 设备编号(唯一) |
| qr_code | VARCHAR(255) | ✓ | 二维码内容 |
| device_type_id | VARCHAR(36) | ✓ | 设备类型 |
| device_location_id | VARCHAR(36) | ✓ | 设备位置 |
| dept_id | VARCHAR(36) | ✓ | 所属部门 |
| brand | VARCHAR(50) | | 品牌 |
| model | VARCHAR(50) | | 型号 |
| serial_no | VARCHAR(50) | | 序列号 |
| purchase_date | DATE | | 采购日期 |
| install_date | DATE | | 安装日期 |
| responsible_id | VARCHAR(36) | | 负责人 |
| status | TINYINT | ✓ | 状态: 0-停用 1-运行中 2-维修中 3-报废 |
| created_at | DATETIME | ✓ | 创建时间 |
| updated_at | DATETIME | | 更新时间 |

### 3.4 检查模板

| 字段名 |类型| 必填 | 说明 |
|--------|------|:----:|------|
| id | VARCHAR(36) | ✓ | 主键 |
| device_id | VARCHAR(36) | ✓ | 关联设备(每个设备独立配置) |
| name | VARCHAR(100) | ✓ | 模板名称 |
| items | JSON | ✓ | 检查项列表(JSON数组) |
| created_at | DATETIME | ✓ | 创建时间 |
| updated_at | DATETIME | | 更新时间 |

**检查项结构 (items JSON):**
```json
[
  {
    "id": "item_001",
    "name": "外观检查",
    "type": "choice",  // choice-选择题 text-填空题
    "options": ["正常", "异常"],
    "required": true,
    "sort_order": 1
  },
  {
    "id": "item_002",
    "name": "振动检测值",
    "type": "text",
    "unit": "mm/s",
    "threshold": "2.5",
    "required": false,
    "sort_order": 2
  }
]
```

---

## 4. 巡检模块

### 4.1 检查任务

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|:----:|------|
| id | VARCHAR(36) | ✓ | 主键 |
| task_no | VARCHAR(50) | ✓ | 任务编号 |
| task_type | TINYINT | ✓ | 任务类型: 1-定期巡检 2-临时任务 |
| device_ids | JSON | ✓ | 关联设备ID数组 |
| dept_id | VARCHAR(36) | ✓ | 执行部门 |
| assignee_id | VARCHAR(36) | ✓ | 执行人 |
| assigner_id | VARCHAR(36) | | 指派人 |
| plan_date | DATE | ✓ | 计划日期 |
| due_date | DATETIME | | 截止时间 |
| status | TINYINT | ✓ | 状态: 0-待执行 1-进行中 2-已完成 3-已取消 |
| priority | TINYINT | ✓ | 优先级: 1-低 2-中 3-高 |
| remark | VARCHAR(500) | | 备注 |
| created_at | DATETIME | ✓ | 创建时间 |
| completed_at | DATETIME | | 完成时间 |

### 4.2 检查记录

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|:----:|------|
| id | VARCHAR(36) | ✓ | 主键 |
| record_no | VARCHAR(50) | ✓ | 记录编号 |
| task_id | VARCHAR(36) | | 关联任务ID |
| device_id | VARCHAR(36) | ✓ | 关联设备 |
| user_id | VARCHAR(36) | ✓ | 检查人 |
| check_date | DATETIME | ✓ | 检查时间 |
| status | TINYINT | ✓ | 状态: 1-合格 2-不合格 3-部分合格 |
| result | TINYINT | ✓ | 结果: 0-草稿 1-已提交 |
| location_gps | VARCHAR(50) | | 检查地点GPS |
| items | JSON | ✓ | 检查项结果(JSON) |
| photos | JSON | | 检查照片(JSON数组) |
| remark | VARCHAR(500) | | 备注 |
| created_at | DATETIME | ✓ | 创建时间 |
| submitted_at | DATETIME | | 提交时间 |

**检查项结果结构 (items JSON):**
```json
[
  {
    "item_id": "item_001",
    "item_name": "外观检查",
    "result": "正常",
    "is_qualified": true,
    "remark": "",
    "photo": "url"
  },
  {
    "item_id": "item_002",
    "item_name": "振动检测值",
    "result": "2.1",
    "is_qualified": true,
    "remark": ""
  }
]
```

---

## 5. 隐患模块

### 5.1 隐患记录

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|:----:|------|
| id | VARCHAR(36) | ✓ | 主键 |
| hazard_no | VARCHAR(50) | ✓ | 隐患编号 |
| source | TINYINT | ✓ | 来源: 1-随手拍 2-巡检发现 |
| photos | JSON | ✓ | 隐患照片(JSON数组) |
| hazard_type | VARCHAR(50) | ✓ | 隐患类型 |
| custom_type | VARCHAR(100) | | 自定义类型(选择"其他"时) |
| location_desc | VARCHAR(255) | | 地点描述 |
| device_id | VARCHAR(36) | | 关联设备(如有) |
| dept_id | VARCHAR(36) | | 所属部门 |
| description | TEXT | | 文字描述 |
| voice_note | VARCHAR(255) | | 语音备注URL |
| user_id | VARCHAR(36) | ✓ | 上报人 |
| reporter_phone | VARCHAR(20) | | 上报人电话 |
| gps_location | VARCHAR(50) | | GPS位置 |
| status | TINYINT | ✓ | 状态(见5.2) |
| created_at | DATETIME | ✓ | 创建时间 |
| updated_at | DATETIME | | 更新时间 |

### 5.2 隐患状态流转

| 状态值 | 状态名称 | 说明 |
|-------|---------|------|
| 1 | 待确认 | 提交待审核 |
| 2 | 已确认 | 管理员确认有效 |
| 3 | 已派发 | 已派发给整改人员 |
| 4 | 整改中 | 整改执行中 |
| 5 | 待验收 | 整改完成，待验收 |
| 6 | 已通过 | 验收通过，隐患关闭 |
| 7 | 已退回 | 被退回(需记录原因) |
| 8 | 草稿箱 | 确认退回的档案 |

### 5.3 隐患流程记录

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|:----:|------|
| id | VARCHAR(36) | ✓ | 主键 |
| hazard_id | VARCHAR(36) | ✓ | 关联隐患 |
| from_status | TINYINT | ✓ | 流转前状态 |
| to_status | TINYINT | ✓ | 流转后状态 |
| operator_id | VARCHAR(36) | ✓ | 操作人 |
| action_type | TINYINT | ✓ | 操作类型: 1-确认 2-退回 3-派发 4-整改 5-验收 |
| remark | TEXT | | 操作备注 |
| voice_note | VARCHAR(255) | | 语音备注URL |
| created_at | DATETIME | ✓ | 操作时间 |

---

## 6. 消息模块

### 6.1 消息记录

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|:----:|------|
| id | VARCHAR(36) | ✓ | 主键 |
| user_id | VARCHAR(36) | ✓ | 接收人 |
| type | TINYINT | ✓ | 消息类型: 1-系统公告 2-巡检任务 3-隐患提醒 4-账号安全 |
| title | VARCHAR(100) | ✓ | 标题 |
| content | TEXT | | 内容 |
| link_type | VARCHAR(20) | | 跳转类型: task/hazard/device |
| link_id | VARCHAR(36) | | 跳转ID |
| read_status | TINYINT | ✓ | 已读状态: 0-未读 1-已读 |
| read_at | DATETIME | | 阅读时间 |
| created_at | DATETIME | ✓ | 发送时间 |

### 6.2 消息配置(推送失败重试)

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|:----:|------|
| id | VARCHAR(36) | ✓ | 主键 |
| message_id | VARCHAR(36) | ✓ | 消息ID |
| retry_count | INT | ✓ | 重试次数 |
| last_retry_at | DATETIME | | 最后重试时间 |
| status | TINYINT | ✓ | 状态: 0-pending 1-sent 2-failed |
| error_msg | VARCHAR(500) | | 错误信息 |

---

## 7. 报表模块

### 7.1 隐患统计

| 字段名 | 类型 | 说明 |
|--------|------|------|
| total_count | INT | 隐患总数 |
| pending_count | INT | 待处理数 |
| processing_count | INT | 处理中数 |
| closed_count | INT | 已关闭数 |
| by_type | JSON | 按类型统计 |
| by_dept | JSON | 按部门统计 |
| by_month | JSON | 按月统计趋势 |

### 7.2 巡检统计

| 字段名 | 类型 | 说明 |
|--------|------|------|
| total_tasks | INT | 任务总数 |
| completed_tasks | INT | 已完成任务 |
| completion_rate | DECIMAL | 完成率 |
| on_time_rate | INT | 按时完成率 |
| by_dept | JSON | 按部门统计 |
| by_month | JSON | 按月趋势 |

### 7.3 设备统计

| 字段名 | 类型 | 说明 |
|--------|------|------|
| total_devices | INT | 设备总数 |
| running_count | INT | 运行中 |
| maintenance_count | INT | 维修中 |
| fault_count | INT | 故障数 |
| by_type | JSON | 按类型统计 |
| by_location | JSON | 按位置统计 |

### 7.4 人员统计

| 字段名 | 类型 | 说明 |
|--------|------|------|
| user_id | VARCHAR(36) | 人员ID |
| task_count | INT | 任务数量 |
| completed_count | INT | 完成数量 |
| hazard_count | INT | 隐患数量 |
| avg_duration | DECIMAL | 平均检查时长 |

---

## 8. 离线存储策略

### 8.1 SQLite表结构

| 表名 | 数据类型 | 说明 |
|-----|---------|------|
| user | 结构化 | 当前用户信息 |
| enterprise | 结构化 | 企业信息 |
| department | 结构化 | 部门列表 |
| device | 结构化 | 设备台账缓存 |
| device_type | 结构化 | 设备类型缓存 |
| device_location | 结构化 | 设备位置缓存 |
| checklist_template | 半结构化 | 检查模板(JSON) |
| inspection_record | 半结构化 | 检查记录(JSON含结果) |
| hazard_record | 半结构化 | 隐患记录(JSON含照片) |
| message | 结构化 | 消息缓存 |
| sync_queue | 结构化 | 待同步队列 |

### 8.2 文件存储

| 类型 | 存储路径 | 说明 |
|-----|---------|------|
| 隐患照片 | /files/hazards/{id}/ | 按隐患ID存储 |
| 检查照片 | /files/inspections/{id}/ | 按记录ID存储 |
| 语音文件 | /files/voices/{id}/ | 语音备注 |
| 头像 | /files/avatars/{id}/ | 用户头像 |

---

*文档版本：v1.0*
*最后更新：2026-03-04*
