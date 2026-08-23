import DefaultTheme from 'vitepress/theme'
import './custom.css'

/**
 * 当前只扩展 VitePress 默认主题，而不重写整套主题。
 *
 * 默认主题已经解决了文档导航、深色模式、键盘操作和响应式布局等
 * 基础问题。先在真实内容和工具中验证需求，再逐步增加共享组件，
 * 可以避免项目早期背负一套难以维护的自定义主题。
 */
export default DefaultTheme
