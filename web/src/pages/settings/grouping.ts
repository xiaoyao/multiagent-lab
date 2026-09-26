/**
 * 模型管理分组模型与工具函数（自 SettingsPage 抽取，REQ-172 二级配置界面组件化）。
 */
import type { ModelConnection } from '../../api/types'

/**
 * 提供商分组（REQ-148 起分组标识与 BaseURL 解耦）：
 * 后端 model_connection 带 provider_group_id（provider_group 表，含展示别名），同一供应商可多实例
 * （同 BaseURL 不同账号/Key）。老数据由后端按 (protocol, base_url) 幂等回填，存量行为不变。
 * - 连接命名约定：`{提供商名}·{模型名}`（间隔符 U+00B7），保证 name 的 UNIQUE 约束不冲突；
 * - 提供商展示名 = 组别名（仅展示层）> 连接名中第一个 · 之前的部分（锚点派生）；
 * - 提供商改名（真名变更）= 按新前缀批量重生成组内全部连接名；别名 = 仅展示层，两者语义分离；
 * - 合并列表：提供商为可展开行（聚合行），其模型直接嵌套在展开区（明细行）。
 */
export interface ProviderGroup {
  key: string // `pg:${provider_group_id}`（空 id 回退 `${protocol}::${base_url}`，兼容未回填数据）
  id: string // provider_group_id（空 = 回退分组）
  alias: string // 组别名（展示层）
  name: string // 提供商展示名（别名优先，缺省从锚点派生）
  baseUrl: string
  protocol: string
  anchor: ModelConnection
  members: ModelConnection[]
}

export function groupOf(c: ModelConnection): string {
  return c.provider_group_id ? `pg:${c.provider_group_id}` : `${c.protocol}::${c.base_url}`
}

export const NAME_SEP = '·'

/** 提供商名 = 连接名中第一个 · 之前的部分；老数据（无 ·）取整名 */
export function providerOfName(name: string): string {
  const i = name.indexOf(NAME_SEP)
  return i > 0 ? name.slice(0, i) : name
}

/** 生成唯一连接名 `{provider}·{model}`；与 taken 冲突时追加 ` (n)`（n 从 2 起） */
export function uniqueConnName(provider: string, model: string, taken: Set<string>): string {
  const base = `${provider}${NAME_SEP}${model}`
  let name = base
  for (let n = 2; taken.has(name); n += 1) {
    name = `${base} (${n})`
  }
  return name
}

/** 协议展示名（REQ-172：openai_compat / anthropic 双协议） */
export function protocolLabel(p: string): string {
  return p === 'anthropic' ? 'anthropic（Messages API）' : 'openai_compat（OpenAI 兼容）'
}

/** 协议是否为 anthropic（REQ-172：决定表单联动——BaseURL 口径/类型限制/模型名占位） */
export function isAnthropicProtocol(p: string | undefined | null): boolean {
  return p === 'anthropic'
}
