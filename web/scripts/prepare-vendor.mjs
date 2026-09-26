// 本地 UMD 分发准备（M21/VIZ-1 配套）：web/public/vendor/ 按 14 号 v0.18 约定不入库
// （.gitignore 覆盖），克隆或重装依赖后目录为空——Graph3D 经 /vendor/3d-force-graph.min.js
// 注入会 404→SPA fallback 回 HTML→「三维视图初始化失败」。本脚本自 node_modules 的
// 3d-force-graph npm 包复制 UMD，挂接在 npm run dev / build 前自动执行（免手工放置）。
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const dest = join(root, 'public', 'vendor')
mkdirSync(dest, { recursive: true })

// WebVOWL 资源走 tools/fetch-webvowl.sh（GitHub 下载，一次性）；此处只管 npm 依赖内可得的部分
const jobs = [
  { from: '3d-force-graph/dist/3d-force-graph.min.js', to: '3d-force-graph.min.js' },
]

for (const { from, to } of jobs) {
  try {
    copyFileSync(join(root, 'node_modules', from), join(dest, to))
    console.log(`[prepare-vendor] ${to} ← node_modules/${from}`)
  } catch (e) {
    console.warn(`[prepare-vendor] 警告: ${to} 复制失败（${e?.message}）——三维视图将诚实降级报错`)
  }
}
