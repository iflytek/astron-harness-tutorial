import { defineConfig } from 'vitepress'

export default defineConfig({
  base: process.env.DOCS_BASE || '/',
  title: "Astron Harness Tutorial",
  description: "Astron Harness Tutorial：AstronClaw、Loomy 与 AStudio 实战教程",
  
  vite: {
    server: {
      proxy: {
        '/api/chat': 'http://127.0.0.1:3001'
      }
    }
  },

  locales: {
    root: {
      label: '中文',
      lang: 'zh-CN',
      themeConfig: {
        nav: [
          { text: '首页', link: '/' },
          { text: 'AstronClaw 指南', link: '/guide/astronclaw/introduction' },
          { text: 'Loomy 桌面助理', link: '/guide/loomy/introduction' },
          { text: 'AStudio 指南', link: '/guide/astudio/intro' },
          { text: 'GitHub', link: 'https://github.com/iflytek/astron-harness-tutorial' }
        ],
        sidebar: [
          {
            "text": "生产力工作台 AStudio",
            "items": [
              {
                "text": "介绍与定位",
                "link": "/guide/astudio/intro"
              },
              {
                "text": "快速上手",
                "link": "/guide/astudio/quickstart"
              },
              {
                "text": "核心功能",
                "link": "/guide/astudio/features"
              },
              {
                "text": "实践案例",
                "link": "/guide/astudio/cases"
              },
              {
                "text": "使用技巧",
                "link": "/guide/astudio/tips"
              },
              {
                "text": "套餐与积分",
                "link": "/guide/astudio/pricing"
              },
              {
                "text": "常见问题",
                "link": "/guide/astudio/faq"
              },
              {
                "text": "协议与隐私",
                "collapsed": true,
                "items": [
                  {
                    "text": "网页端用户服务协议",
                    "link": "/guide/astudio/agreements/user-service-web"
                  },
                  {
                    "text": "网页端隐私政策",
                    "link": "/guide/astudio/agreements/privacy-web"
                  },
                  {
                    "text": "客户端用户服务协议",
                    "link": "/guide/astudio/agreements/user-service-client"
                  },
                  {
                    "text": "客户端隐私政策",
                    "link": "/guide/astudio/agreements/privacy-client"
                  },
                  {
                    "text": "个人信息收集清单",
                    "link": "/guide/astudio/agreements/personal-information-collection-list-zh-CN"
                  },
                  {
                    "text": "第三方信息共享清单",
                    "link": "/guide/astudio/agreements/third-party-sharing-list-zh-CN"
                  },
                  {
                    "text": "产品订阅服务协议",
                    "link": "/guide/astudio/agreements/product-subscription-service"
                  },
                  {
                    "text": "自动续费服务协议",
                    "link": "/guide/astudio/agreements/auto-renewal-service"
                  }
                ]
              }
            ]
          },
          {
            text: '云端助手 AstronClaw',
            items: [
              { text: '核心优势与对比', link: '/guide/astronclaw/introduction' },
              { text: '快速上手指南', link: '/guide/astronclaw/getting-started' },
              { text: '技能系统详解', link: '/guide/astronclaw/skills' },
              { text: '积分体系与订阅', link: '/guide/astronclaw/billing' },
              { text: '实际应用场景', link: '/guide/astronclaw/scenarios' },
              { text: '渠道配置指南', link: '/guide/astronclaw/channels' },
              { text: '常见问题', link: '/guide/astronclaw/faq' }
            ]
          },
          {
            text: '桌面搭子 Loomy',
            items: [
              { text: '介绍与定位', link: '/guide/loomy/introduction' },
              { text: '快速开始', link: '/guide/loomy/quick-start' },
              { text: '模型与聊天', link: '/guide/loomy/models' },
              { text: '资料库', link: '/guide/loomy/knowledge-base' },
              { text: 'AI 搭子', link: '/guide/loomy/companions' },
              { text: '工具箱与技能系统', link: '/guide/loomy/toolbox' },
              { text: '定时任务与积分', link: '/guide/loomy/scheduled-tasks' },
              { text: '远程控制', link: '/guide/loomy/remote-control' },
              { text: '办公 CLI 集成', link: '/guide/loomy/office-cli' },
              { text: '典型工作场景', link: '/guide/loomy/scenarios' },
              { text: '实战：打造个人 AI 搭子', link: '/guide/loomy/personal-companion' },
              { text: '常见问题', link: '/guide/loomy/faq' }
            ]
          }
        ],
        footer: {
          message: '基于 Apache License 2.0 许可发布。',
          copyright: `Copyright © ${new Date().getFullYear()} iFlytek Co., Ltd.`
        }
      }
    },
    en: {
      label: 'En',
      lang: 'en',
      link: '/en/',
      description: 'Practical guides to AstronClaw, Loomy and AStudio',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'AstronClaw Guide', link: '/en/guide/astronclaw/introduction' },
          { text: 'Loomy Desktop', link: '/en/guide/loomy/introduction' },
          { text: 'AStudio Guide', link: '/en/guide/astudio/intro' },
          { text: 'GitHub', link: 'https://github.com/iflytek/astron-harness-tutorial' }
        ],
        sidebar: [
          {
            "text": "AStudio Workspace",
            "items": [
              {
                "text": "Introduction",
                "link": "/en/guide/astudio/intro"
              },
              {
                "text": "Quick Start",
                "link": "/en/guide/astudio/quickstart"
              },
              {
                "text": "Core Features",
                "link": "/en/guide/astudio/features"
              },
              {
                "text": "Examples",
                "link": "/en/guide/astudio/cases"
              },
              {
                "text": "Tips",
                "link": "/en/guide/astudio/tips"
              },
              {
                "text": "Plans & Points",
                "link": "/en/guide/astudio/pricing"
              },
              {
                "text": "FAQ",
                "link": "/en/guide/astudio/faq"
              },
              {
                "text": "Agreements & Privacy",
                "collapsed": true,
                "items": [
                  {
                    "text": "Web User Agreement",
                    "link": "/en/guide/astudio/agreements/user-service-web"
                  },
                  {
                    "text": "Web Privacy Policy",
                    "link": "/en/guide/astudio/agreements/privacy-web"
                  },
                  {
                    "text": "Desktop User Agreement",
                    "link": "/en/guide/astudio/agreements/user-service-client"
                  },
                  {
                    "text": "Desktop Privacy Policy",
                    "link": "/en/guide/astudio/agreements/privacy-client"
                  },
                  {
                    "text": "Personal Information Collection",
                    "link": "/en/guide/astudio/agreements/personal-information-collection-list-zh-CN"
                  },
                  {
                    "text": "Third-party Sharing",
                    "link": "/en/guide/astudio/agreements/third-party-sharing-list-zh-CN"
                  },
                  {
                    "text": "Subscription Agreement",
                    "link": "/en/guide/astudio/agreements/product-subscription-service"
                  },
                  {
                    "text": "Auto-renewal Agreement",
                    "link": "/en/guide/astudio/agreements/auto-renewal-service"
                  }
                ]
              }
            ]
          },
          {
            text: 'Cloud Assistant AstronClaw',
            items: [
              { text: 'Core Advantages', link: '/en/guide/astronclaw/introduction' },
              { text: 'Getting Started', link: '/en/guide/astronclaw/getting-started' },
              { text: 'Skills System', link: '/en/guide/astronclaw/skills' },
              { text: 'Billing & Points', link: '/en/guide/astronclaw/billing' },
              { text: 'Scenarios', link: '/en/guide/astronclaw/scenarios' },
              { text: 'Channels Config', link: '/en/guide/astronclaw/channels' },
              { text: 'FAQ', link: '/en/guide/astronclaw/faq' }
            ]
          },
          {
            text: 'Desktop Companion Loomy',
            items: [
              { text: 'Introduction', link: '/en/guide/loomy/introduction' },
              { text: 'Quick Start', link: '/en/guide/loomy/quick-start' },
              { text: 'Models & Chat', link: '/en/guide/loomy/models' },
              { text: 'Knowledge Base', link: '/en/guide/loomy/knowledge-base' },
              { text: 'AI Companions', link: '/en/guide/loomy/companions' },
              { text: 'Toolbox & Skills', link: '/en/guide/loomy/toolbox' },
              { text: 'Scheduled Tasks', link: '/en/guide/loomy/scheduled-tasks' },
              { text: 'Remote Control', link: '/en/guide/loomy/remote-control' },
              { text: 'Office CLI', link: '/en/guide/loomy/office-cli' },
              { text: 'Scenarios', link: '/en/guide/loomy/scenarios' },
              { text: 'Build a Personal AI Companion', link: '/en/guide/loomy/personal-companion' },
              { text: 'FAQ', link: '/en/guide/loomy/faq' }
            ]
          }
        ],
        footer: {
          message: 'Released under the Apache License 2.0.',
          copyright: `Copyright © ${new Date().getFullYear()} iFlytek Co., Ltd.`
        }
      }
    }
  },

  themeConfig: {
  }
})
