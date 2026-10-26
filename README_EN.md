# Astron Harness Tutorial

<p align="center">
  <a href="https://astronclaw-tutorial.space/en/">
    <img src="https://img.shields.io/badge/Astron_Harness-Tutorial-blue?style=for-the-badge&logo=readthedocs" alt="Astron Harness Tutorial">
  </a>
</p>

<p align="center">
  <img src="https://bjcdn.openstorage.cn/aicontest/2026-03-18/29c37a17-5b33-4804-90b5-85599c29e2d5.png" alt="AstronClaw Logo" height="60">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://loomy.xunfei.cn/images/logo_light.png" alt="Loomy Logo" height="60">
</p>

<p align="center">
  <b>English</b> | <a href="README.md">简体中文</a>
</p>

<p align="center">
  <a href="https://astronclaw-tutorial.space/en/">🚀 <b>Read Online</b></a> |
  <a href="https://agent.xfyun.cn/astron-claw">☁️ <b>Try Cloud AstronClaw</b></a> |
  <a href="https://loomy.xunfei.cn/">💻 <b>Download Desktop Loomy</b></a>
</p>

<p align="center">
  <a href="https://github.com/iflytek/astron-harness-tutorial/blob/main/LICENSE"><img src="https://img.shields.io/github/license/iflytek/astron-harness-tutorial" alt="License"></a>
  <a href="https://github.com/iflytek/astron-harness-tutorial/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/iflytek/astron-harness-tutorial/deploy.yml?branch=main" alt="Deploy Status"></a>
</p>

## Introduction

This project is a comprehensive learning tutorial for **AstronClaw**, **Loomy**, and **AStudio**, designed to help you master this powerful AI assistant system from scratch.

* **AstronClaw**: A **cloud-based AI assistant** built on OpenClaw's core capabilities, providing 7x24 online services through channels like WeCom, DingTalk, and Feishu.
* **Loomy**: A **desktop AI companion** focused on real-world office scenarios, deeply integrating with local files and system tools to build efficient automated workflows for individuals and small teams.
* **AStudio**: An **AI productivity workspace** for planning tasks, using tools and delivering results, with local projects, previews, plugins and automation.

Whether you want to quickly get started with AstronClaw to boost productivity or build custom workflows with Loomy, this tutorial provides a clear learning path.

## Core Modules

The project consists of three main modules:

### ☁️ Part 1: Cloud Assistant AstronClaw
* **Quick Start**: One-click deployment, eliminating tedious local environment configurations to experience a 7x24 online cloud assistant.
* **Skills System**: Over 130 built-in official skills, supporting one-click installation from the skill market, repository search, auto-installation via chat, and custom skills.
* **Channels**: Seamless integration with enterprise collaboration platforms like Feishu, DingTalk, and WeCom.

### 💻 Part 2: Desktop Companion Loomy
* **Features**: Low barrier to entry, high security, strong adaptability, and proactive collaboration, focusing on local office environments and cross-tool workflows.
* **Typical Scenarios**: Social media operations, daily office collaboration, investment tracking, calendar & todo management, remote mobile office, and e-commerce operations.
* **Security & Privacy**: Directory-level authorization to protect local files; supports custom LLM API providers.

### Part 3: AStudio Productivity Workspace

Start with the [AStudio guide](docs/en/guide/astudio/intro.md): quick start, task modes, projects, previews, examples, tips, plans and FAQ. Eight agreement guides link to the authoritative web and desktop terms, privacy policies, information lists, subscription and renewal rules. The daily documentation watcher covers all 15 official pages.

## Who is this for?

* **Beginners**: No programming experience required. Perfect for anyone wanting an always-on cloud or desktop AI assistant.
* **Productivity Enthusiasts**: Those who wish to remote-control AI anytime, anywhere via IM apps like Feishu or DingTalk.
* **Content & Operations Teams**: Social media managers, e-commerce professionals, and anyone who frequently handles information organization and multi-tool collaboration.

## Local Development

This project is built with [VitePress](https://vitepress.dev/). To preview or edit the documentation locally:

```bash
# 1. Clone the repository
git clone https://github.com/iflytek/astron-harness-tutorial.git
cd astron-harness-tutorial

# 2. Install dependencies
npm install

# 3. Start the local preview server
npm run docs:dev

# 4. Build static files
npm run docs:build
```

### Learning Assistant model configuration

The Learning Assistant uses **Spark-X2.6-4B**, with streaming replies and Chinese/English pages. Copy `.env.example` to `.env` and set `ASTRON_MAAS_API_KEY` to a key enabled for Spark-X2.6-4B. Keep credentials server-side; do not use variables prefixed with `VITE_` for API keys.

The defaults are model `spark-x2.6-4b`, endpoint `https://maas-api.cn-huabei-1.xf-yun.com/v2/chat/completions`, and `low` reasoning effort. Configure the server variables in `.env.example` to override them. Model IDs sent by cached clients cannot override the server setting.

For local chat, run `npm run server` in one terminal and `npm run docs:dev` in another. Configure the same environment variables on Vercel and redeploy. Run `npm run test:chat` for regression tests without external calls, or `node test-api.js` to verify the live model connection.

## Contributing

Issues and Pull Requests are welcome! Let's polish it together and help more people bring AI into their daily workflows.

Before submitting a PR, please read our [Contributing Guide](CONTRIBUTING.md). When you make your first contribution, the CLA Assistant bot will automatically leave a comment on your PR to guide you through signing the Contributor License Agreement (CLA).

## Join the Community

Welcome to join our official communities to communicate with developers and other users:

| ☁️ AstronClaw Official Community | 💻 Loomy Community | 💬 Astron Open Source Community |
| :---: | :---: | :---: |
| <img src="docs/public/astronclaw-qr.jpg" alt="AstronClaw Official Community" width="250"> | <img src="docs/public/loomy-qr.png" alt="Loomy Community" width="250"> | <img src="https://github.com/iflytek/astron-agent/raw/main/docs/imgs/WeCom_Group.png" alt="Astron Open Source Community" width="250"> |

## License

This project is licensed under the [Apache License 2.0](LICENSE).
