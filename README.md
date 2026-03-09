# Young-Agent

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-blue)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue)](https://reactnative.dev)

[English](#english) | [中文](#中文)

---

## English

### AI-Powered Industrial Safety Inspection App

Young-Agent is an industrial safety inspection mobile application built with Expo and React Native, featuring AI-powered assistance for hazard reporting, device inspection, and safety checks.

### Features

- **🤖 AI Assistant** - Intelligent hazard analysis, intent recognition, and natural language queries
- **📱 Multi-Provider Support** - Works with DeepSeek, OpenAI, Anthropic, MiniMax, Kimi, Doubao, GLM
- **🔍 Hazard Reporting** - Quick capture and reporting of safety hazards with photo evidence
- **📋 Device Inspection** - QR code-based device scanning and inspection tasks
- **✅ Safety Checks** - Structured safety inspection workflows
- **💬 Message Center** - Notifications for tasks, hazard reviews, and system announcements
- **🔄 Offline Support** - Full offline capability with local SQLite storage
- **🌐 Multi-LLM Streaming** - Real-time streaming responses with thinking display

### Architecture

```
src/
├── features/           # Feature modules (DDD-based)
│   ├── ai/           # AI services, providers, tools
│   ├── auth/         # Authentication
│   ├── hazard/       # Hazard management
│   ├── device/      # Device management
│   ├── inspection/  # Inspection workflows
│   ├── message/     # Notifications
│   └── profile/     # User settings
├── core/             # Shared infrastructure
│   ├── components/  # Reusable UI components
│   ├── constants/   # App configuration
│   ├── network/     # API client
│   ├── services/    # Core services
│   └── storage/     # Storage (MMKV, SQLite)
└── shared/          # Shared utilities
    └── api/         # React Query + API
```

### Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Expo SDK 54, React Native 0.81.5 |
| Language | TypeScript |
| State | Zustand |
| Storage | react-native-mmkv, expo-sqlite |
| AI | Multiple LLM Providers (OpenAI-compatible) |
| HTTP | Axios |
| Queries | TanStack Query v5 |

### Quick Start

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on Android
npx expo run:android

# Run on iOS
npx expo run:ios
```

### AI Configuration

The app supports multiple LLM providers. Configure API keys through the in-app settings:

- DeepSeek
- OpenAI
- Anthropic
- MiniMax
- Kimi (Moonshot)
- Doubao (ByteDance)
- GLM (Zhipu)
- Custom endpoint

API keys are securely stored using expo-secure-store.

### Documentation

- [Architecture Design](./docs/plans/2026-03-09-use-chat-hook-design.md)
- [Requirements Specification](./resources/docs/requirements.md)
- [AI Streaming Design](./docs/plans/2025-03-06-ai-streaming-design.md)

### License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 中文

### 工业安全检查智能应用

Young-Agent 是一款基于 Expo 和 React Native 构建的工业安全检查移动应用，提供 AI 辅助的隐患上报、设备巡检和安全检查功能。

### 核心功能

- **🤖 AI 智能助手** - 智能隐患分析、意图识别、自然语言查询
- **📱 多模型支持** - 支持 DeepSeek、OpenAI、Anthropic、MiniMax、Kimi、Doubao、GLM
- **🔍 隐患上报** - 拍照快速上报安全隐患
- **📋 设备巡检** - 二维码扫码巡检任务
- **✅ 安全检查** - 结构化安全检查流程
- **💬 消息中心** - 任务通知、隐患审核、系统公告
- **🔄 离线支持** - 完整离线能力，本地 SQLite 存储
- **🌐 多模型流式响应** - 实时流式响应与思考过程展示

### 技术架构

```
src/
├── features/           # 功能模块 (DDD 设计)
│   ├── ai/           # AI 服务、Provider、工具
│   ├── auth/         # 认证
│   ├── hazard/       # 隐患管理
│   ├── device/      # 设备管理
│   ├── inspection/  # 巡检流程
│   ├── message/     # 消息通知
│   └── profile/     # 用户设置
├── core/             # 共享基础设施
│   ├── components/  # 可复用组件
│   ├── constants/   # 应用配置
│   ├── network/     # API 客户端
│   ├── services/    # 核心服务
│   └── storage/     # 存储 (MMKV, SQLite)
└── shared/          # 共享工具
    └── api/         # React Query + API
```

### 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Expo SDK 54, React Native 0.81.5 |
| 语言 | TypeScript |
| 状态管理 | Zustand |
| 存储 | react-native-mmkv, expo-sqlite |
| AI | 多模型 Provider (OpenAI 兼容) |
| HTTP | Axios |
| 数据获取 | TanStack Query v5 |

### 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npx expo start

# 运行在 Android
npx expo run:android

# 运行在 iOS
npx expo run:ios
```

### AI 配置

应用支持多个人工智能模型。可以通过应用内设置配置 API 密钥：

- DeepSeek
- OpenAI
- Anthropic
- MiniMax
- Kimi (月之暗面)
- Doubao (字节跳动)
- GLM (智谱)
- 自定义端点

API 密钥使用 expo-secure-store 安全存储。

### 文档

- [架构设计](./docs/plans/2026-03-09-use-chat-hook-design.md)
- [需求规格说明](./resources/docs/requirements.md)
- [AI 流式响应设计](./docs/plans/2025-03-06-ai-streaming-design.md)

### 许可证

MIT 许可证 - 详见 [LICENSE](./LICENSE)

---

<p align="center">
  Made with ❤️ by Young-Agent Team
</p>
