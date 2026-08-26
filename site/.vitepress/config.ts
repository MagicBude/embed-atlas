import { defineConfig } from 'vitepress'

/**
 * 站点可能运行在根域，也可能运行在 GitHub Pages 的仓库子路径下。
 *
 * 本地开发默认使用 `/`，因此访问地址保持简洁；部署工作流则注入
 * `/embed-atlas/`，让 VitePress 为静态资源、导航和搜索索引统一添加
 * 仓库路径前缀。环境变量必须同时以 `/` 开头和结尾，这是 VitePress
 * `base` 的格式要求，也能避免手工拼接 URL 时出现双斜线或缺少分隔符。
 */
const siteBase = process.env.VITEPRESS_BASE ?? '/'

if (!siteBase.startsWith('/') || !siteBase.endsWith('/')) {
  throw new Error('VITEPRESS_BASE 必须以 / 开头和结尾，例如 /embed-atlas/。')
}

/**
 * VitePress 的站点级配置。
 *
 * 本文件只保存跨页面共享且相对稳定的设置，例如导航、侧栏和搜索。
 * 某篇文章或某个工具独有的信息应写在对应 Markdown 的 frontmatter 中，
 * 避免每增加一个页面都要修改全局配置。
 */
export default defineConfig({
  base: siteBase,
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
        {
          text: '基础知识',
          items: [
            {
              text: '整数、进制与位模式',
              link: '/knowledge/foundations/integer-radix-bit-pattern',
            },
            {
              text: '二进制补码与有符号整数范围',
              link: '/knowledge/foundations/twos-complement-signed-range',
            },
            {
              text: '位运算、位掩码与寄存器字段',
              link: '/knowledge/foundations/bitwise-mask-register-field',
            },
            {
              text: '字节、字符、编码与字符串',
              link: '/knowledge/foundations/bytes-characters-encoding',
            },
            {
              text: 'HEX 文本与原始二进制数据',
              link: '/knowledge/foundations/hex-text-binary-data',
            },
            {
              text: '字节序与多字节整数',
              link: '/knowledge/foundations/endianness-multibyte-integer',
            },
            {
              text: 'CRC 模型参数与标准检查值',
              link: '/knowledge/foundations/crc-model-parameters',
            },
            {
              text: 'IEEE 754 浮点数表示',
              link: '/knowledge/foundations/ieee-754-floating-point',
            },
          ],
        },
        {
          text: 'C 语言',
          items: [
            {
              text: 'C 定宽整数、提升与溢出边界',
              link: '/knowledge/c-language/c-fixed-width-integers',
            },
          ],
        },
        {
          text: '通信协议',
          items: [
            {
              text: 'UART 帧格式、波特率与实际传输位数',
              link: '/knowledge/protocols/uart-frame-basics',
            },
            {
              text: 'I²C 7 位地址与读写位',
              link: '/knowledge/protocols/i2c-address-read-write',
            },
          ],
        },
      ],
      '/tools/': [
        {
          text: '在线工具箱',
          items: [
            { text: '工具总览', link: '/tools/' },
            {
              text: '进制与位运算转换器',
              link: '/tools/base-bit-converter',
            },
            {
              text: 'HEX、ASCII 与字符串转换器',
              link: '/tools/hex-text-converter',
            },
            {
              text: 'CRC 计算器',
              link: '/tools/crc-calculator',
            },
            {
              text: '大小端与字节交换转换器',
              link: '/tools/endianness-converter',
            },
          ],
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
