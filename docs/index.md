---
layout: home

hero:
  name: "Astron Harness Tutorial"
  tagline: "学习 AstronClaw、Loomy 与 AStudio，从第一个任务走向完整工作流。"
  image:
    src: https://bjcdn.openstorage.cn/aicontest/2026-03-18/29c37a17-5b33-4804-90b5-85599c29e2d5.png
    alt: AstronClaw Logo
  actions:
    - theme: brand
      text: 领养云端 AstronClaw
      link: /guide/astronclaw/introduction
    - theme: alt
      text: 认识桌面搭子 Loomy
      link: /guide/loomy/introduction

    - theme: alt
      text: 开始使用 AStudio
      link: /guide/astudio/intro

features:
  - title: AStudio 全场景生产力工作台
    details: 从目标规划到成果交付，学习项目协作、预览编辑、插件与自动化。
    link: /guide/astudio/intro
  - title: 01 云端一键极速部署
    details: 极简流程，零代码配置，告别环境依赖。云端 7×24 小时运行，随时随地可用。
    link: /guide/astronclaw/getting-started
  - title: 02 丰富的内置技能系统
    details: 支持 130+ 官方技能，一键安装使用，更支持对话自动安装与自定义技能扩展。
    link: /guide/astronclaw/skills
  - title: 03 全天候多渠道响应
    details: 支持无缝接入飞书、钉钉、企业微信，在熟悉的办公协作软件中完成日常任务。
  - title: 04 Loomy 桌面端深度协作
    details: 面向真实办公场景，聚焦“低门槛、高安全、强适配、主动协作”，本地化工具轻松接入。
    link: /guide/loomy/introduction
  - title: 05 丰富的典型工作场景
    details: 覆盖自媒体运营、日常办公协同、投资盯盘、电商运营等多个真实业务闭环。
    link: /guide/loomy/scenarios
  - title: 06 高安全与零运维成本
    details: 平台托管、企业级安全防护；Loomy 目录级授权保障本地数据隐私，让 AI 安全落地。

---

<br>
<div class="home-qr-section">
  <h2>加入交流群</h2>
  <p class="desc">扫码加入官方社群，与开发者和众多用户一起交流</p>

  <div class="qr-container">
    <div class="qr-card">
      <img src="/astronclaw-qr.jpg" alt="AstronClaw 官方社群">
      <p>☁️ AstronClaw 官方社群</p>
    </div>
    <div class="qr-card">
      <img src="/loomy-qr.png" alt="Loomy 交流群">
      <p>💻 Loomy 交流群</p>
    </div>
  </div>
</div>

<style>
.home-qr-section {
  text-align: center;
  padding: 0 24px;
}
.home-qr-section h2 {
  border-top: none;
  margin: 0;
  padding: 0;
}
.home-qr-section .desc {
  color: var(--vp-c-text-2);
  margin-top: 8px;
}
.qr-container {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 32px;
  flex-wrap: wrap;
}
.qr-card {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.qr-card img {
  width: 220px;
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.qr-card p {
  margin-top: 12px;
  font-weight: 500;
}
@media (max-width: 768px) {
  .home-qr-section {
    padding: 0 12px;
  }
  .qr-container {
    gap: 24px;
    margin-top: 24px;
  }
  .qr-card {
    width: 100%;
  }
  .qr-card img {
    width: min(180px, 100%);
  }
}
</style>
