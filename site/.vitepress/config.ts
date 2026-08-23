import { defineConfig } from 'vitepress'

/**
 * VitePress 的站点级配置。
 *
 * 本文件只保存跨页面共享且相对稳定的设置，例如导航、侧栏和搜索。
 * 某篇文章或某个工具独有的信息应写在对应 Markdown 的 frontmatter 中，
 * 避免每增加一个页面都要修改全局配置。
 */
export default defineConfig({
  lang: 'zh-CN',
  title: 'EmbedAtlas',
  titleTemplate: ':title | EmbedAtlas',
  description: '面向中文嵌入式工程师的开源知识库与在线工具箱。',
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['meta', { name: 'theme-color', content: '#0f766e' }],
    ['meta', { name: 'author', content: 'EmbedAtlas contributors' }],
  ],

  themeConfig: {
    siteTitle: 'EmbedAtlas · 嵌入式图谱',

    nav: [
      { text: '首页', link: '/' },
      { text: '学习路线', link: '/learning-paths/' },
      { text: '知识库', link: '/knowledge/' },
      { text: '工具箱', link: '/tools/' },
      { text: '速查', link: '/reference/' },
      { text: '关于', link: '/about/' },
    ],

    sidebar: {
      '/learning-paths/': [
        {
          text: '学习路线',
          items: [{ text: '路线总览', link: '/learning-paths/' }],
        },
      ],
      '/knowledge/': [
        {
          text: '知识库',
          items: [{ text: '分类总览', link: '/knowledge/' }],
        },
      ],
      '/tools/': [
        {
          text: '在线工具箱',
          items: [{ text: '工具总览', link: '/tools/' }],
        },
      ],
      '/reference/': [
        {
          text: '工程速查',
          items: [{ text: '速查总览', link: '/reference/' }],
        },
      ],
      '/about/': [
        {
          text: '关于项目',
          items: [{ text: '关于 EmbedAtlas', link: '/about/' }],
        },
      ],
    },

    /**
     * 第一阶段采用 VitePress 自带的本地全文搜索。
     * 搜索索引随静态网站一起生成，不需要账号、API 密钥或外部搜索服务，
     * 符合项目“静态优先、本地优先”的架构原则。
     */
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索',
            buttonAriaLabel: '搜索站内内容',
          },
          modal: {
            displayDetails: '显示详细结果',
            resetButtonTitle: '清除查询',
            backButtonTitle: '关闭搜索',
            noResultsText: '没有找到相关内容',
            footer: {
              selectText: '选择',
              selectKeyAriaLabel: '回车',
              navigateText: '切换',
              navigateUpKeyAriaLabel: '上箭头',
              navigateDownKeyAriaLabel: '下箭头',
              closeText: '关闭',
              closeKeyAriaLabel: 'Esc',
            },
          },
        },
      },
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/MagicBude/embed-atlas' },
    ],

    editLink: {
      pattern: 'https://github.com/MagicBude/embed-atlas/edit/main/site/:path',
      text: '在 GitHub 上改进此页',
    },

    outline: {
      level: [2, 3],
      label: '本页目录',
    },

    lastUpdated: {
      text: '最后更新',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short',
      },
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '返回顶部',

    footer: {
      message: '程序代码采用 MIT License，知识内容采用 CC BY-SA 4.0。',
      copyright: 'Copyright © 2026 MagicBude and EmbedAtlas contributors',
    },
  },
})
