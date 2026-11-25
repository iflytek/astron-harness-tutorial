<p align="center">
  <img src="docs/public/astudio/brand/logo.svg" alt="AStudio" width="180">
</p>

# Astron Harness Tutorial

**AStudio → Loomy → AstronClaw.** Learn to turn a task into a useful deliverable, then build an AI workflow around your own work.

[Read the tutorial](https://astronclaw-tutorial.space/en/) · [Start with AStudio](docs/en/guide/astudio/quickstart.md) · [简体中文](README.md)

<p align="center">
  <a href="https://github.com/iflytek/astron-harness-tutorial/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/iflytek/astron-harness-tutorial/deploy.yml?branch=main" alt="Build status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/iflytek/astron-harness-tutorial" alt="License"></a>
</p>

![Official AStudio workspace overview](docs/public/astudio/images/guide-img-02-mXA0XE.png)

## Choose your starting point

| Product | Best starting point | Learn |
| --- | --- | --- |
| **01 · AStudio** | Goal-oriented tasks and deliverables | [Workspace guide](docs/en/guide/astudio/intro.md) · [Quick start](docs/en/guide/astudio/quickstart.md) |
| **02 · Loomy** | Local knowledge and office workflows | [Desktop guide](docs/en/guide/loomy/introduction.md) · [Quick start](docs/en/guide/loomy/quick-start.md) |
| **03 · AstronClaw** | Cloud tasks and messaging channels | [Cloud guide](docs/en/guide/astronclaw/introduction.md) · [Getting started](docs/en/guide/astronclaw/getting-started.md) |

## 01 · AStudio: from a goal to a deliverable

Begin with the workspace, create a task, then learn projects, Plan and Goal modes, previews, editing, permissions, automation and plugins. Follow the illustrated steps with **56 locally stored official images**, shared by the Chinese and English guides.

- [Core features](docs/en/guide/astudio/features.md): find the right mode and inspect the result.
- [Examples](docs/en/guide/astudio/cases.md) and [tips](docs/en/guide/astudio/tips.md): practice research, website creation and iteration.
- [Plans and points](docs/en/guide/astudio/pricing.md), [FAQ](docs/en/guide/astudio/faq.md) and [privacy](docs/en/guide/astudio/agreements/privacy-client.md): understand the rules before starting.

## 02 · Loomy: a companion for everyday work

Connect local files, knowledge and office tools. Explore [AI companions](docs/en/guide/loomy/companions.md), [the toolbox](docs/en/guide/loomy/toolbox.md), [work scenarios](docs/en/guide/loomy/scenarios.md) and [your personal companion](docs/en/guide/loomy/personal-companion.md).

## 03 · AstronClaw: keep work moving in the cloud

Start with a hosted assistant, then connect [skills](docs/en/guide/astronclaw/skills.md) and [messaging channels](docs/en/guide/astronclaw/channels.md). Review [scenarios](docs/en/guide/astronclaw/scenarios.md) and [billing](docs/en/guide/astronclaw/billing.md) for the work you plan to do.

## Documentation and image updates

The daily watcher checks AStudio, Loomy and AstronClaw. AStudio coverage includes all 15 official guide and agreement pages, plus the image contents. New images and replacements at the same URL are reported for review. See [the watcher guide](scripts/doc-watch/README.md) and [asset sources](docs/public/astudio/README.md).

Screenshots preserve the official Chinese interface; the English version supplies English captions. Images can be enlarged on the tutorial site.

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

## Learn with the community

| AStudio | Loomy | AstronClaw |
| :---: | :---: | :---: |
| <img src="docs/public/astudio/images/guide-img-58-dMj2Xf.png" alt="AStudio WeChat community" width="160"> | <img src="docs/public/loomy-qr.png" alt="Loomy community" width="160"> | <img src="docs/public/astronclaw-qr.jpg" alt="AstronClaw community" width="160"> |

[AStudio Feishu group](docs/public/astudio/images/feishu-group-qr-20260902.png) · [Astron open-source community](https://github.com/iflytek/astron-agent/raw/main/docs/imgs/WeCom_Group.png)

## License

Tutorial source is released under [Apache License 2.0](LICENSE). Official product images and marks remain subject to their respective rights; see the [asset notes](docs/public/astudio/README.md).
