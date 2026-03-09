# Findings & Decisions
<!--
  WHAT: Your knowledge base for the task. Stores everything you discover and decide.
  WHY: Context windows are limited. This file is your "external memory" - persistent and unlimited.
  WHEN: Update after ANY discovery, especially after 2 view/browser/search operations (2-Action Rule).
-->

## Requirements
- 工业安全检查App，支持隐患上报、设备巡检、AI辅助
- 三条业务流程：扫码检查、隐患随手拍、安全检查
- 用户角色：普通用户、巡检人员、管理人员
- 离线可用：三条业务流程 + 设备查看
- 本地SQLite存储，预留后端接口
- 登录方式：账号+密码，首次绑定企业与部门

## Research Findings
- 项目名：Young-agent (MightYoung)
- 原型包含15个页面，覆盖启动、相机、拍照、检查、历史、详情、消息、AI等功能
- 设备二维码构成：设备ID_位置ID_类型ID_部门ID
- 隐患类型：单级分类+其他（用户输入）
- 消息中心：系统公告+巡检任务+隐患审核+账号安全
- 检查模板：每个设备独立配置
- 离线数据同步：本地优先/云端优先用户选择

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Swarm: hierarchical-mesh | 15 max agents, supports auto-scaling |
| Memory: hybrid backend | HNSW indexing enabled, pattern learning enabled |
| 登录: 账号+密码 | 企业级应用标准方案 |
| 设备关联: 部门+区域 | 支持数据级权限控制 |
| 离线策略: 本地SQLite | 测试阶段简单高效 |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Memory embedding generation failed | Core memory operations work; needs API key |

## Resources
- 项目路径: D:\dev\react-app\hazard_shot
- 原型路径: D:\dev\react-app\hazard_shot\resources\stitch_generated_screen
- 需求文档: D:\dev\react-app\hazard_shot\docs\requirements.md

## Visual/Browser Findings
- 原型设计风格：现代简约，暗色/亮色主题切换
- 主要颜色：#0088cc (主色), #07C160 (成功), #ff4b2b (警告)
- 设计规范：Material Design + Tailwind CSS

---
*Update this file after every 2 view/browser/search operations*
