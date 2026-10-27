<script setup>
import { computed, ref } from 'vue'
import { useData, withBase } from 'vitepress'

const { lang } = useData()
const en = computed(() => lang.value.startsWith('en'))
const active = ref(0)
const link = (path) => withBase(`${en.value ? '/en' : ''}/guide/${path}.html`)
const products = computed(() => [
  { name: 'AStudio', number: '01', type: en.value ? 'AI productivity workspace' : '全场景 AI 生产力工作台',
    description: en.value ? 'Plan a task, work with your files, and refine a real deliverable. Start here to learn a complete AI workflow.' : '从任务规划到工具执行，再到成果预览与迭代。在这里学习一套完整的 AI 工作方式。',
    image: '/astudio/brand/logo.svg', route: 'astudio/intro', start: 'astudio/quickstart',
    tags: en.value ? ['Task modes', 'Local projects', 'Preview & edit'] : ['任务模式', '本地项目', '预览与编辑'] },
  { name: 'Loomy', number: '02', type: en.value ? 'Your desktop companion' : '深入日常办公的桌面搭子',
    description: en.value ? 'Bring together local files, knowledge and tools. Build a companion around the way you work.' : '连接本地文件、资料库与办公工具，围绕你的日常工作构建专属搭子。',
    image: '/brands/loomy.png', route: 'loomy/introduction', start: 'loomy/quick-start',
    tags: en.value ? ['Knowledge', 'Companions', 'Office tools'] : ['资料库', 'AI 搭子', '办公工具'] },
  { name: 'AstronClaw', number: '03', type: en.value ? 'Your cloud AI assistant' : '随时在线的云端 AI 助手',
    description: en.value ? 'Get started in the cloud and connect skills and messaging channels to keep work moving wherever you are.' : '从云端快速开始，连接技能与消息渠道，在熟悉的协作工具中推进任务。',
    image: '/brands/astronclaw.png', route: 'astronclaw/introduction', start: 'astronclaw/getting-started',
    tags: en.value ? ['Cloud setup', 'Skills', 'Messaging'] : ['云端部署', '技能系统', '消息渠道'] }
])
const selected = computed(() => products.value[active.value])
const steps = computed(() => en.value ? [
  ['Start with a task', 'Install AStudio, learn the workspace and complete your first request.', 'astudio/quickstart'],
  ['Make the workflow yours', 'Choose a task mode, connect a project and review each result.', 'astudio/features'],
  ['Practice and repeat', 'Try research and website projects, then reuse what works.', 'astudio/cases']
] : [
  ['先完成一个任务', '安装 AStudio，认识工作区，用真实需求完成第一次交付。', 'astudio/quickstart'],
  ['掌握自己的工作流', '选择任务模式，关联项目，检查成果并逐步调整。', 'astudio/features'],
  ['从案例走向复用', '练习文献调研与网站搭建，把有效的方法带入日常。', 'astudio/cases']
])
</script>

<template>
  <div class="harness-home">
    <section class="home-intro" aria-labelledby="home-title">
      <div class="intro-copy">
        <p class="eyebrow">ASTRON HARNESS TUTORIAL</p>
        <h1 id="home-title">{{ en ? 'Turn an idea into' : '让想法成为' }}<br><span>{{ en ? 'work you can use.' : '真正可用的成果。' }}</span></h1>
        <p class="intro-description">{{ en ? 'Start with AStudio. Explore Loomy and AstronClaw. Learn to plan, execute and improve your everyday AI workflows.' : '从 AStudio 开始，探索 Loomy 与 AstronClaw。学习规划、执行与迭代，让 AI 进入你的真实工作。' }}</p>
        <div class="intro-actions">
          <a class="primary-link" :href="link('astudio/quickstart')">{{ en ? 'Start with AStudio' : '开始学习 AStudio' }} <span aria-hidden="true">↗</span></a>
          <a class="text-link" href="#products">{{ en ? 'Explore the three products' : '了解三款产品' }} <span aria-hidden="true">↓</span></a>
        </div>
        <div class="intro-meta"><span>{{ en ? 'Chinese / English' : '中英双语' }}</span><span>{{ en ? 'Step-by-step guides' : '图解操作步骤' }}</span><span>{{ en ? 'Official sources' : '官方资料同步' }}</span></div>
      </div>
      <a class="workspace-preview" :href="link('astudio/quickstart')">
        <div class="preview-heading"><img :src="withBase('/astudio/brand/logo.svg')" alt="AStudio" width="118" height="34"><span>{{ en ? 'MEET YOUR WORKSPACE' : '认识你的工作台' }}</span></div>
        <img class="workspace-shot" :src="withBase('/astudio/images/guide-img-02-mXA0XE.png')" :alt="en ? 'Official AStudio workspace overview, with the Chinese interface' : 'AStudio 官方工作界面总览'" width="1920" height="1008" fetchpriority="high">
        <div class="preview-caption"><span>{{ en ? 'A goal. A workspace. A finished result.' : '一个目标，一个工作区，一份可交付的成果。' }}</span><span aria-hidden="true">→</span></div>
      </a>
    </section>

    <section id="products" class="product-section" aria-labelledby="products-title">
      <div class="section-heading"><div><p class="eyebrow">{{ en ? 'FIND YOUR WORKFLOW' : '选择你的工作方式' }}</p><h2 id="products-title">{{ en ? 'Three products. A clear place to start.' : '三款产品，各有擅长。' }}</h2></div><p>{{ en ? 'Choose by the work you want to do.' : '从需求出发，找到适合自己的工具。' }}</p></div>
      <div class="product-tabs" role="tablist" :aria-label="en ? 'Product guides' : '产品指南'">
        <button v-for="(product, index) in products" :id="`product-tab-${index}`" :key="product.name" role="tab" :aria-selected="active === index" :aria-controls="'product-detail'" :tabindex="active === index ? 0 : -1" :class="{ selected: active === index }" @click="active = index" @keydown.right.prevent="active = (active + 1) % 3; $nextTick(() => $el.querySelector('#product-tab-' + active)?.focus())" @keydown.left.prevent="active = (active + 2) % 3; $nextTick(() => $el.querySelector('#product-tab-' + active)?.focus())"><span>{{ product.number }}</span>{{ product.name }}</button>
      </div>
      <div id="product-detail" class="product-detail" role="tabpanel" :aria-labelledby="`product-tab-${active}`">
        <div class="product-copy"><p class="product-type">{{ selected.type }}</p><h3>{{ selected.name }}</h3><p>{{ selected.description }}</p><div class="product-tags"><span v-for="tag in selected.tags" :key="tag">{{ tag }}</span></div><a class="text-link" :href="link(selected.route)">{{ en ? 'Read the guide' : '阅读完整指南' }} <span aria-hidden="true">→</span></a></div>
        <div class="product-art" :class="selected.name.toLowerCase()"><img :src="withBase(selected.image)" :alt="selected.name" loading="lazy"><span>{{ selected.number }} / 03</span></div>
      </div>
      <div class="product-shortcuts"><a v-for="product in products" :key="product.name" :href="link(product.start)"><span>{{ product.name }}</span>{{ en ? 'Quick start' : '快速上手' }} <span aria-hidden="true">↗</span></a></div>
    </section>

    <section class="learning-path" aria-labelledby="path-title">
      <div class="section-heading"><div><p class="eyebrow">{{ en ? 'LEARN BY DOING' : '从上手到熟练' }}</p><h2 id="path-title">{{ en ? 'Your first AStudio workflow' : '你的第一条 AStudio 学习路径' }}</h2></div><a class="text-link" :href="link('astudio/tips')">{{ en ? 'Practical tips' : '查看使用技巧' }} →</a></div>
      <div class="path-grid"><a v-for="(step, index) in steps" :key="step[0]" :href="link(step[2])"><span class="step-number">0{{ index + 1 }}</span><h3>{{ step[0] }}</h3><p>{{ step[1] }}</p><span class="step-arrow" aria-hidden="true">↗</span></a></div>
    </section>

    <section class="reference-strip"><div><h2>{{ en ? 'Before you go further' : '开始使用前，也了解这些' }}</h2><p>{{ en ? 'Plans, permissions and answers to common questions.' : '了解套餐、权限与常见问题，让每一步更清楚。' }}</p></div><div class="reference-links"><a :href="link('astudio/pricing')">{{ en ? 'Plans & points' : '套餐与积分' }} ↗</a><a :href="link('astudio/agreements/privacy-client')">{{ en ? 'Privacy & permissions' : '隐私与权限' }} ↗</a><a :href="link('astudio/faq')">{{ en ? 'FAQ' : '常见问题' }} ↗</a></div></section>

    <section class="community-section" aria-labelledby="community-title"><div class="section-heading"><div><p class="eyebrow">{{ en ? 'KEEP LEARNING TOGETHER' : '一起交流，持续学习' }}</p><h2 id="community-title">{{ en ? 'Join the community' : '加入产品交流群' }}</h2></div><p>{{ en ? 'Scan an official QR code to join.' : '扫描官方二维码，与其他使用者交流。' }}</p></div><div class="community-grid"><figure v-for="group in [{name:'AStudio',image:'/astudio/images/guide-img-58-dMj2Xf.png'},{name:'Loomy',image:'/loomy-qr.png'},{name:'AstronClaw',image:'/astronclaw-qr.jpg'}]" :key="group.name"><img :src="withBase(group.image)" :alt="`${group.name} ${en ? 'community QR code' : '社群二维码'}`" loading="lazy" width="160" height="160"><figcaption>{{ group.name }}</figcaption></figure></div></section>
  </div>
</template>

<style scoped>
.harness-home{max-width:1280px;margin:auto;padding:64px 40px 80px;color:var(--vp-c-text-1)}
.home-intro{display:grid;grid-template-columns:1fr 1.15fr;align-items:center;gap:56px;padding:32px 0 80px}.eyebrow{font-size:11px;line-height:1.6;font-weight:700;letter-spacing:2px;color:var(--vp-c-brand-1);margin:0 0 16px}
h1{font-size:clamp(36px,3.8vw,56px);line-height:1.13;letter-spacing:-2px;font-weight:750;margin:0 0 26px}h1 span{color:var(--vp-c-brand-1)}.intro-description{max-width:440px;font-size:17px;line-height:1.9;color:var(--vp-c-text-2);margin:0 0 30px}.intro-actions{display:flex;align-items:center;gap:24px;flex-wrap:wrap}.primary-link{display:inline-flex;align-items:center;gap:24px;background:var(--vp-c-brand-1);color:#fff;padding:13px 20px;border-radius:8px;font-size:14px;font-weight:600}.primary-link:hover{background:var(--vp-c-brand-2)}.text-link{display:inline-flex;align-items:center;gap:12px;font-weight:600;font-size:14px;color:var(--vp-c-brand-1)}.intro-meta{display:flex;gap:18px;flex-wrap:wrap;margin-top:28px;font-size:11px;color:var(--vp-c-text-2)}.intro-meta span+span:before{content:'·';margin-right:18px;color:var(--vp-c-text-3)}
.workspace-preview{display:block;border:1px solid var(--vp-c-divider);border-radius:16px;overflow:hidden;background:var(--vp-c-bg);box-shadow:0 20px 60px #17375b10;transform:rotate(-1deg);transition:transform .2s}.workspace-preview:hover{transform:rotate(0)}.preview-heading{display:flex;justify-content:space-between;align-items:center;padding:24px;background:#fff;color:#5c6375}.preview-heading span{font-size:9px;letter-spacing:1.2px}.workspace-shot{display:block;width:100%;height:auto;border-block:1px solid var(--vp-c-divider)}.preview-caption{display:flex;justify-content:space-between;gap:12px;padding:20px;font-size:12px;color:var(--vp-c-text-2)}
.product-section,.learning-path,.community-section{padding:56px 0;border-top:1px solid var(--vp-c-divider);scroll-margin-top:90px}.section-heading{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:28px}.section-heading .eyebrow{margin-bottom:10px}h2{font-size:28px;line-height:1.35;letter-spacing:-.7px;font-weight:650;margin:0}.section-heading>p{font-size:13px;color:var(--vp-c-text-2);max-width:240px}.product-tabs{display:flex;border-bottom:1px solid var(--vp-c-divider);gap:36px}.product-tabs button{display:flex;align-items:center;gap:12px;padding:16px 0;border-bottom:3px solid transparent;font-size:17px;font-weight:600;color:var(--vp-c-text-2)}.product-tabs button span{font-size:11px;opacity:.6}.product-tabs button.selected{border-color:var(--vp-c-brand-1);color:var(--vp-c-brand-1)}.product-detail{display:grid;grid-template-columns:1fr 1fr;min-height:330px;background:var(--vp-c-bg-soft);border-radius:0 0 12px 12px;overflow:hidden}.product-copy{padding:42px}.product-type{font-size:12px;color:var(--vp-c-brand-1);margin:0 0 10px}.product-copy h3{font-size:36px;line-height:1.2;font-weight:650;letter-spacing:-1px;margin:0 0 16px}.product-copy>p:not(.product-type){font-size:15px;line-height:1.8;color:var(--vp-c-text-2);max-width:440px}.product-tags{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}.product-tags span{font-size:11px;padding:4px 10px;border:1px solid var(--vp-c-divider);border-radius:5px}.product-art{display:flex;align-items:center;justify-content:center;position:relative;padding:42px;background:#f1f4ff}.product-art img{width:70%;max-height:200px;object-fit:contain}.product-art.astudio img{width:220px}.product-art.loomy img{width:100%;object-fit:contain}.product-art.astronclaw img{width:200px}.product-art>span{position:absolute;right:24px;bottom:20px;font-size:11px;letter-spacing:2px;color:#67718d}.product-shortcuts{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding-top:20px}.product-shortcuts a{display:flex;gap:10px;align-items:center;font-size:12px;color:var(--vp-c-text-2);padding:8px 0}.product-shortcuts a>span:first-child{font-weight:600;color:var(--vp-c-text-1);margin-right:auto}
.path-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.path-grid>a{position:relative;padding:28px;border:1px solid var(--vp-c-divider);border-radius:12px;transition:border-color .2s,transform .2s}.path-grid>a:hover{border-color:var(--vp-c-brand-1);transform:translateY(-3px)}.step-number{color:var(--vp-c-brand-1);font-size:12px;font-weight:650}.path-grid h3{font-size:19px;font-weight:600;line-height:1.4;margin:28px 0 10px}.path-grid p{font-size:14px;color:var(--vp-c-text-2);line-height:1.8;margin:0}.step-arrow{position:absolute;right:24px;top:24px;color:var(--vp-c-text-3)}.reference-strip{display:flex;align-items:center;justify-content:space-between;gap:28px;background:var(--vp-c-bg-soft);border-radius:12px;padding:32px;margin-bottom:56px}.reference-strip h2{font-size:21px}.reference-strip p{font-size:13px;color:var(--vp-c-text-2);margin:8px 0 0}.reference-links{display:flex;gap:20px;flex-wrap:wrap}.reference-links a{font-size:13px;color:var(--vp-c-brand-1);font-weight:600}.community-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}.community-grid figure{margin:0;display:flex;align-items:center;gap:22px;padding:24px;border:1px solid var(--vp-c-divider);border-radius:12px}.community-grid img{width:100px;height:100px;object-fit:contain;border-radius:5px;background:white}.community-grid figcaption{font-size:16px;font-weight:600}
a:focus-visible,button:focus-visible{outline:3px solid var(--vp-c-brand-1);outline-offset:5px}
@media(min-width:960px) and (max-width:1199px){.home-intro{gap:30px}.community-grid figure{flex-direction:column}.reference-strip{align-items:start;flex-direction:column}}
@media(max-width:959px){.harness-home{padding:32px 24px 40px}.home-intro{grid-template-columns:1fr;gap:32px;padding:20px 0 48px}.intro-description{max-width:600px}.workspace-preview{max-width:700px;transform:none}.section-heading{align-items:start;flex-direction:column;gap:12px}.section-heading>p{max-width:none;margin:0}.product-copy{padding:28px}.product-art{padding:24px}.path-grid{gap:12px}.path-grid>a{padding:22px}.reference-strip{align-items:start;flex-direction:column}.community-grid figure{flex-direction:column;gap:16px;padding:20px}.product-shortcuts{gap:12px}.product-shortcuts a{flex-wrap:wrap}}
@media(max-width:599px){.harness-home{padding:20px 20px 40px}h1{font-size:38px;letter-spacing:-1px}.intro-description{font-size:15px}.intro-actions{gap:20px}.intro-meta{gap:10px;font-size:10px}.intro-meta span+span:before{margin-right:10px}.preview-heading{padding:18px}.preview-heading span{font-size:8px}.preview-caption{font-size:11px;padding:16px}h2{font-size:24px}.product-section,.learning-path,.community-section{padding:36px 0}.product-tabs{gap:24px}.product-tabs button{font-size:15px;gap:7px}.product-detail{grid-template-columns:1fr}.product-art{order:-1;min-height:160px}.product-art img{max-height:120px}.product-copy h3{font-size:30px}.product-shortcuts{grid-template-columns:1fr;gap:0}.product-shortcuts a{padding:12px 0;border-bottom:1px solid var(--vp-c-divider)}.path-grid{grid-template-columns:1fr}.path-grid h3{margin-top:18px}.reference-strip{padding:24px;margin-bottom:32px}.reference-links{flex-direction:column;gap:14px}.community-grid{grid-template-columns:1fr;gap:12px}.community-grid figure{flex-direction:row;padding:20px;gap:28px}.community-grid img{width:90px;height:90px}}
@media(prefers-reduced-motion:reduce){*{transition:none!important;transform:none!important}}
</style>
