# Astron Harness Tutorial

<p align="center">
  <a href="https://astronclaw-tutorial.space/">
    <img src="https://img.shields.io/badge/Astron_Harness-Tutorial-blue?style=for-the-badge&logo=readthedocs" alt="Astron Harness Tutorial">
  </a>
</p>

<p align="center">
  <img src="https://bjcdn.openstorage.cn/aicontest/2026-03-18/29c37a17-5b33-4804-90b5-85599c29e2d5.png" alt="AstronClaw Logo" height="60">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://loomy.xunfei.cn/images/logo_light.png" alt="Loomy Logo" height="60">
</p>

<p align="center">
  <a href="README_EN.md">English</a> | <b>简体中文</b>
</p>

<p align="center">
  <a href="https://astronclaw-tutorial.space/">🚀 <b>在线阅读</b></a> |
  <a href="https://agent.xfyun.cn/astron-claw">☁️ <b>体验云端龙虾</b></a> |
  <a href="https://loomy.xunfei.cn/">💻 <b>下载 Loomy 桌面端</b></a>
</p>

<p align="center">
  <a href="https://github.com/iflytek/astron-harness-tutorial/blob/main/LICENSE"><img src="https://img.shields.io/github/license/iflytek/astron-harness-tutorial" alt="License"></a>
  <a href="https://github.com/iflytek/astron-harness-tutorial/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/iflytek/astron-harness-tutorial/deploy.yml?branch=main" alt="Deploy Status"></a>
</p>

## 项目简介

本项目是一个面向 **AstronClaw**、**Loomy** 和 **AStudio** 的完整学习教程，帮助你从零开始掌握这款强大的 AI 助理系统。

* **AstronClaw**：基于 OpenClaw 核心能力打造的**云端 AI 助手**，提供全天候在线服务，随时随地通过企业微信、钉钉、飞书等渠道为你效劳。
* **Loomy**：聚焦真实办公场景的**桌面端 AI 工作搭子**，深入打通本地文件和系统工具，构建个人及小团队的高效自动化工作流。
* **AStudio**：面向任务规划、工具执行与成果交付的 **AI 生产力工作台**，支持本地项目、成果预览、插件及自动化。

无论你是想快速上手使用 AstronClaw 提升效率，还是想通过 Loomy 打造专属工作流，本教程都能为你提供清晰的学习路径。

## 核心内容模块

本项目包含三大核心模块：

### ☁️ 第一部分：云端助手 AstronClaw
* **快速上手**：一键极速部署，告别本地繁琐的环境配置，体验 7×24 小时在线的云端助手。
* **技能系统**：内置 130+ 官方技能，支持技能市场一键安装、仓库搜索、对话自动安装，甚至自定义技能。
* **渠道接入**：无缝对接飞书、钉钉、企业微信等企业级协作平台。

### 💻 第二部分：桌面搭子 Loomy
* **定位与特性**：低门槛、高安全、强适配、主动协作，专注于国内办公环境和跨工具流程。
* **典型工作场景**：自媒体运营、日常办公协同、投资与信息盯盘、日历与待办管理、远程移动办公、电商与业务运营。
* **安全与隐私**：目录级授权，保护本地文件安全；支持自定义大模型 API 服务商。

### 第三部分：生产力工作台 AStudio

从 [AStudio 指南](docs/guide/astudio/intro.md)开始，学习快速上手、任务模式、项目、成果预览、案例、技巧、套餐与常见问题。另设八份协议阅读指南，覆盖网页端与客户端服务、隐私、信息清单、订阅和续费规则。每日文档巡检覆盖全部 15 个官方页面。

## 谁适合学习

* **零基础用户**：不需要任何编程经验，想要一个随时待命的云端或桌面 AI 助手。
* **效率达人**：希望通过飞书、钉钉等即时通讯软件随时随地远程控制 AI。
* **内容与运营团队**：自媒体运营、电商从业者等需要频繁处理信息整理和多工具协作的人群。

## 本地开发与预览

本项目基于 [VitePress](https://vitepress.dev/) 构建。如果你想在本地预览或修改文档：

```bash
# 1. 克隆仓库
git clone https://github.com/iflytek/astron-harness-tutorial.git
cd astron-harness-tutorial

# 2. 安装依赖
npm install

# 3. 启动本地预览服务
npm run docs:dev

# 4. 构建静态文件
npm run docs:build
```

### 学习助手模型配置

学习助手使用 **Spark-X2.6-4B**，支持流式回答和中英文页面。将 `.env.example` 复制为 `.env`，填写已开通 Spark-X2.6-4B 权限的 `ASTRON_MAAS_API_KEY`；密钥只在服务端使用，不要放入 `VITE_` 开头的变量。

默认模型为 `spark-x2.6-4b`，接口为 `https://maas-api.cn-huabei-1.xf-yun.com/v2/chat/completions`，思考强度为 `low`。如需调整，可配置 `.env.example` 中的服务端变量。旧客户端传入的模型名不会覆盖服务端配置。

本地使用学习助手时，在一个终端运行 `npm run server`，另一个终端运行 `npm run docs:dev`。Vercel 部署需要配置同名环境变量并重新部署。可运行 `npm run test:chat` 进行无外部调用的回归测试，或运行 `node test-api.js` 验证实际模型连接。

## 贡献与反馈

欢迎提交 Issue 和 PR！让我们一起把它打磨得更好，帮助更多人让 AI 真正进入日常工作流。

在提交 PR 之前，请阅读我们的 [贡献指南](CONTRIBUTING.md)。首次贡献时，CLA Assistant 机器人会自动在您的 PR 下方留言，引导您完成贡献者许可协议 (CLA) 的签署。

## 加入交流群

欢迎扫码加入官方交流群，与开发者和其他用户一起交流：

| ☁️ AstronClaw 官方社群 | 💻 Loomy 交流群 | 💬 Astron 开源交流群 |
| :---: | :---: | :---: |
| <img src="docs/public/astronclaw-qr.jpg" alt="AstronClaw 官方社群" width="250"> | <img src="docs/public/loomy-qr.png" alt="Loomy 交流群" width="250"> | <img src="https://github.com/iflytek/astron-agent/raw/main/docs/imgs/WeCom_Group.png" alt="Astron 开源交流群" width="250"> |

## 开源协议

本项目基于 [Apache License 2.0](LICENSE) 协议开源。
