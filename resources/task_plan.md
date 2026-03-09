# Task Plan: Hazard Shot - React App Development
<!--
  WHAT: This is your roadmap for the entire task. Think of it as your "working memory on disk."
  WHY: After 50+ tool calls, your original goals can get forgotten. This file keeps them fresh.
  WHEN: Create this FIRST, before starting any work. Update after each phase completes.
-->

## Goal
开发一个面向工业安全检查的高质量移动App，支持多种角色（普通用户、巡检人员、管理人员），具备隐患上报、扫码检查、AI智能辅助等功能，支持离线使用。

## Current Phase
Phase 1

## Phases

### Phase 1: Requirements & Discovery
- [x] 阅读原型设计 (15个页面)
- [x] 与用户讨论业务流程
- [x] 确认用户角色与权限
- [x] 确认离线策略
- [x] 确认登录与设备管理
- [x] 确认动画效果
- [x] 确认AI助手页面设计
- [x] 整理需求文档 (requirements.md)
- [x] 整理字段设计清单 (field_design.md)
- **Status:** complete

### Phase 2: Planning & Structure
- [x] 系统架构设计
- [x] 技术选型确认
- [x] AI模块架构设计 (多Provider + 向量搜索 + Skill)
- [x] 双模式运行架构 (本地模式 + 云端模式)
- [x] 三级RAG存储架构
- [x] 数据库设计
- [x] 页面结构规划
- **Status:** complete

### Phase 3: Implementation
- [x] Initialize React Native project
- [x] Set up project structure (src/, components/, features/, core/, hooks/, types/)
- [x] Implement core storage layer (SQLite + MMKV)
- [x] Implement navigation structure
- [x] Implement authentication flow (Login, BindEnterprise)
- [x] Implement Camera/Home screen
- [x] Implement AI Assistant module
- [x] Test the application (TypeScript + ESLint passed)
- **Status:** complete

### Phase 4: Testing & Verification
- [ ] Verify all requirements met
- [ ] Document test results in progress.md
- [ ] Fix any issues found
- **Status:** pending

### Phase 5: Delivery
- [ ] Review all output files
- [ ] Ensure deliverables are complete
- [ ] Deliver to user
- **Status:** pending

## Key Questions (已确认)
1. ✓ 隐患全生命周期：随手拍 → 确认 → 整改 → 验收，确认/验收可退回（文字/语音原因）
2. ✓ 确认退回→草稿箱（档案），验收退回→再次整改→验收
3. ✓ 功能权限：页面级显示控制
4. ✓ 数据权限：部门级 + 公司级（可见全部数据）
5. ✓ 动画效果：
   - 首页首次进入：浮现动画
   - Logo流光效果：参考Google Labs Flow
   - 语音输入波纹：参考微信
   - 检查卡片切换：参考探探
   - 页面滑动切换：300ms ease-out
   - 底部弹起：250ms ease-out
   - 按钮点击反馈：scale 0.95
6. ✓ AI助手页面：底部菜单栏（AI助手/台账查询/个人中心），顶部热门功能卡片
2. ✓ 隐患类型：单级分类+其他（用户输入）
3. ✓ 检查模板：每个设备独立配置
4. ✓ 权限分配：普通用户/巡检人员/管理人员，报表查看入口，消息中心作为审核/任务入口
5. ✓ 离线模式：三条业务流程可用，联网后同步
6. ✓ 登录方式：账号+密码，首次登录绑定企业与部门
7. ✓ 设备管理：增删改查、分类筛选
8. ✓ 用户管理：部门绑定、默认角色+可自定义、数据级权限
9. ✓ 消息推送：需要在线，失败定期重试
10. ✓ 个人中心：我的台账、我的任务、设置

## 已确认的需求
1. 用户角色：普通用户、巡检人员、管理人员（不同权限）
2. 业务流程：
   - 流程A：扫描二维码 → 扫码检查 → 逐项检查 → 合格/不合格 → 提交报告
   - 流程B：拍照 → 隐患随手拍 → 隐患类型/地点/描述 → 提交
   - 流程C：检查按钮 → 安全检查 → 选择任务 → 执行检查
3. AI功能：图像识别、知识库查询、流程跟踪、统计分析
4. 后端支持：测试阶段本地SQLite，预留接口
5. 随手拍：全员开放
6. 隐患类型：单级分类 + 其他（用户输入）
7. 检查模板：每个设备独立配置
8. 消息中心：隐患审核、任务分配入口
9. 离线模式：三条业务流程可离线使用，联网后同步

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| Embedding generation failed | 1 | Likely missing API key - core memory ops still work |

## Notes
- Update phase status as you progress: pending → in_progress → complete
- Re-read this plan before major decisions (attention manipulation)
- Log ALL errors - they help avoid repetition
- Never repeat a failed action - mutate your approach instead
