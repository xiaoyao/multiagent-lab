// Package modelproto 模型连接协议常量与协议相关纯函数（REQ-172）。
// model_connection.protocol 决定建模通道与探测端点形态；本包只做协议判定与 URL 归一，
// 不依赖 store/model，供 api（测试连接/自动发现）与 chat（建模）双向复用。
package modelproto

import "strings"

const (
	// OpenAICompat OpenAI 兼容协议（/chat/completions、/embeddings、/models）——既有默认。
	OpenAICompat = "openai_compat"
	// Anthropic Anthropic Messages API 协议（/v1/messages、/v1/models）。
	Anthropic = "anthropic"
)

// anthropicAPIVersion Anthropic API 版本头（探测请求需显式携带；SDK 建模由 anthropic-sdk-go 自带）。
const anthropicAPIVersion = "2023-06-01"

// APIVersion 返回 Anthropic 协议版本头取值。
func APIVersion() string { return anthropicAPIVersion }

// Known 报告协议取值是否受支持（创建/更新连接白名单；空串由 store 兜底为 openai_compat）。
func Known(protocol string) bool {
	return protocol == "" || protocol == OpenAICompat || protocol == Anthropic
}

// IsAnthropic 报告该协议是否走 Anthropic Messages 通道。
func IsAnthropic(protocol string) bool { return protocol == Anthropic }

// NormalizeAnthropicBase 归一 Anthropic 网关根地址：去首尾空白与尾随 '/'；
// 容忍 OpenAI 习惯粘贴的尾随 '/v1'（anthropic-sdk-go 在根地址上自动追加 /v1/messages，
// 不剥离会产生 /v1/v1/messages 404）。DeepSeek（…/anthropic）、智谱（…/api/anthropic）等
// 兼容网关的文档口径即根地址 + /v1/messages。
func NormalizeAnthropicBase(base string) string {
	base = strings.TrimRight(strings.TrimSpace(base), "/")
	base = strings.TrimSuffix(base, "/v1")
	return strings.TrimRight(base, "/")
}

// MessagesURL Anthropic Messages 探测端点：{root}/v1/messages。
func MessagesURL(base string) string { return NormalizeAnthropicBase(base) + "/v1/messages" }

// ModelsURL Anthropic 模型列表探测端点：{root}/v1/models?limit=1000（limit 拉满一页，
// 不做分页遍历——探测场景够用，超出部分诚实缺失）。
func ModelsURL(base string) string { return NormalizeAnthropicBase(base) + "/v1/models?limit=1000" }
