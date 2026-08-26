/**
 * GitHub Pages 公开站点冒烟检查。
 *
 * 单元测试和本地生产预览能够证明计算逻辑与构建产物，但不能证明托管平台
 * 已把正确 artifact 发布到正确子路径。本脚本只使用 Node.js 内置的 fetch，
 * 在部署完成后检查公开 HTTP 边界，不引入浏览器或新的运行时依赖。
 *
 * 它有意不模拟工具输入和键盘操作：这些行为由组件测试与真实浏览器验收
 * 负责。这里验证的是页面、资源、404 和搜索页面映射是否真正对外可用。
 */

const configuredSiteUrl = process.env.SITE_URL ?? 'https://magicbude.github.io/embed-atlas/'
const siteUrl = new URL(configuredSiteUrl)

if (!siteUrl.pathname.endsWith('/')) {
  siteUrl.pathname += '/'
}

const pageChecks = [
  { path: '', marker: 'EmbedAtlas' },
  { path: 'knowledge/', marker: '知识库' },
  {
    path: 'knowledge/foundations/integer-radix-bit-pattern',
    marker: '整数、进制与位模式',
  },
  { path: 'learning-paths/', marker: '学习路线' },
  { path: 'tools/', marker: '在线工具箱' },
  { path: 'tools/base-bit-converter', marker: '进制与位运算转换器' },
  { path: 'tools/hex-text-converter', marker: 'HEX、ASCII 与字符串转换器' },
  { path: 'tools/crc-calculator', marker: 'CRC 计算器' },
  { path: 'tools/endianness-converter', marker: '大小端与字节交换转换器' },
  { path: 'about/', marker: '关于 EmbedAtlas' },
]

const expectedSearchPages = [
  'knowledge_foundations_integer-radix-bit-pattern.md',
  'tools_base-bit-converter.md',
  'tools_hex-text-converter.md',
  'tools_crc-calculator.md',
  'tools_endianness-converter.md',
]

/**
 * Pages 刚切换 artifact 时，边缘节点可能短暂返回旧内容或 5xx。
 * 仅对服务端错误和网络错误重试；404 等确定性客户端错误立即交给调用者判断。
 */
async function fetchWithRetry(url, attempts = 6) {
  let lastError

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': 'EmbedAtlas-public-smoke-check' },
        redirect: 'follow',
      })

      if (response.status < 500 || attempt === attempts) {
        return response
      }

      lastError = new Error(`${url} 返回 HTTP ${response.status}`)
    } catch (error) {
      lastError = error
    }

    await new Promise((resolve) => setTimeout(resolve, 5_000))
  }

  throw lastError
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function checkPage({ path, marker }) {
  const url = new URL(path, siteUrl)
  const response = await fetchWithRetry(url)
  const html = await response.text()

  assert(response.status === 200, `${url} 预期 HTTP 200，实际为 ${response.status}`)
  assert(html.includes(marker), `${url} 缺少页面标识文字：${marker}`)
  assert(html.includes(`${siteUrl.pathname}assets/`), `${url} 未引用 Pages 子路径下的静态资源`)

  console.log(`✓ ${response.status} ${url.pathname} — ${marker}`)
  return html
}

async function checkHomeAssets(homeHtml) {
  const assetPaths = [
    ...homeHtml.matchAll(/(?:href|src)="([^"#?]+\/assets\/[^"#?]+)"/g),
  ].map((match) => match[1])

  const uniqueAssetPaths = [...new Set(assetPaths)]
  assert(uniqueAssetPaths.length > 0, '首页没有发现可检查的静态资源')

  for (const assetPath of uniqueAssetPaths) {
    const assetUrl = new URL(assetPath, siteUrl)
    const response = await fetchWithRetry(assetUrl)
    assert(response.status === 200, `${assetUrl} 预期 HTTP 200，实际为 ${response.status}`)
  }

  console.log(`✓ ${uniqueAssetPaths.length} 个首页静态资源可以访问`)
}

async function checkSearchMap() {
  const searchMapUrl = new URL('hashmap.json', siteUrl)
  const response = await fetchWithRetry(searchMapUrl)
  const searchMap = await response.json()

  assert(response.status === 200, `${searchMapUrl} 预期 HTTP 200，实际为 ${response.status}`)

  for (const pageId of expectedSearchPages) {
    assert(pageId in searchMap, `搜索页面映射缺少 ${pageId}`)
  }

  console.log(`✓ 搜索页面映射包含 ${expectedSearchPages.length} 个关键页面`)
}

async function checkNotFound() {
  const missingUrl = new URL('__embed_atlas_missing_page__', siteUrl)
  const response = await fetchWithRetry(missingUrl)
  assert(response.status === 404, `${missingUrl} 预期 HTTP 404，实际为 ${response.status}`)
  console.log(`✓ ${response.status} ${missingUrl.pathname}`)
}

async function main() {
  console.log(`检查公开站点：${siteUrl}`)

  const [homeHtml] = await Promise.all(pageChecks.map(checkPage))
  await checkHomeAssets(homeHtml)
  await checkSearchMap()
  await checkNotFound()

  console.log('公开站点冒烟检查通过。')
}

main().catch((error) => {
  console.error(`公开站点冒烟检查失败：${error.message}`)
  process.exitCode = 1
})
