/**
 * 模型表单（REQ-172 自 SettingsPage 抽取 + 协议感知）：
 * 所属提供商（分组下拉，name/base_url/protocol 随组）· 模型名 · 类型 · 设为默认。
 * - API Key 归属提供商：新建时用 copy_key_from 复用组锚点的密文，模型表单不再出现 Key；
 * - 编辑时切换提供商 = 移动到目标组（名称/Base URL/协议随目标组，Key 亦改用目标提供商）；
 * - 提供商未变则两个 Key 字段都不发送（后端保留原 Key）；
 * - initialProvider：从某提供商行「＋添加模型」进入时预选该分组；
 * - 协议联动（REQ-172）：anthropic 分组仅可选 chat（Anthropic 无官方向量接口）。
 */
import { useEffect, useState } from 'react'
import { Alert, Button, Form, Input, Modal, Select, Space, Switch, Tag } from 'antd'
import { api } from '../../api/client'
import type { ModelConnection } from '../../api/types'
import { useUI } from '../../store/ui'
import { groupOf, isAnthropicProtocol, protocolLabel, providerOfName, uniqueConnName, type ProviderGroup } from './grouping'

export function ModelModal({ conn, groups, conns, initialProvider, onClose, onSaved }: {
  conn: ModelConnection | 'new'
  groups: ProviderGroup[]
  conns: ModelConnection[]
  initialProvider?: string
  onClose: () => void
  onSaved: () => void
}) {
  const { showToast } = useUI()
  const [form] = Form.useForm()
  const [busy, setBusy] = useState(false)
  const editConn = conn === 'new' ? null : conn

  useEffect(() => {
    if (editConn) {
      form.setFieldsValue({ provider: groupOf(editConn), model_name: editConn.model_name, conn_type: editConn.conn_type, is_default: editConn.is_default })
    } else {
      form.setFieldsValue({ provider: initialProvider ?? groups[0]?.key, model_name: '', conn_type: 'chat', is_default: false })
    }
  }, [conn, form, groups, initialProvider])

  const providerKey = Form.useWatch('provider', form)
  const providerGroup = groups.find((g) => g.key === providerKey)
  // REQ-172：随所选提供商的协议联动
  const anthropic = isAnthropicProtocol(providerGroup?.protocol)

  useEffect(() => {
    if (anthropic && form.getFieldValue('conn_type') === 'embedding') {
      form.setFieldsValue({ conn_type: 'chat' })
    }
  }, [anthropic, form])

  const save = async () => {
    let v: any
    try {
      v = await form.validateFields()
    } catch {
      return
    }
    setBusy(true)
    try {
      if (editConn) {
        const target = providerGroup && providerGroup.key !== groupOf(editConn) ? providerGroup : null
        // 名称按 `{提供商}·{模型}` 维护：移动或改模型名时重生成（排除自身，重名追加 (n)）
        const takenOthers = new Set(conns.filter((c) => c.id !== editConn.id).map((c) => c.name))
        const name = target
          ? uniqueConnName(target.name, v.model_name, takenOthers)
          : v.model_name !== editConn.model_name
            ? uniqueConnName(providerGroup?.name ?? providerOfName(editConn.name), v.model_name, takenOthers)
            : editConn.name
        await api.updateConnection(editConn.id, {
          ...editConn,
          ...(target ? { protocol: target.protocol, base_url: target.baseUrl, copy_key_from: target.anchor.id, provider_group_id: target.id } : {}),
          name,
          model_name: v.model_name,
          conn_type: anthropic ? 'chat' : v.conn_type,
          is_default: v.is_default,
        })
        if (v.is_default) await api.setDefaultConnection(editConn.id)
      } else {
        if (!providerGroup) throw new Error('请先选择提供商；新提供商请先添加')
        const created = await api.createConnection({
          name: uniqueConnName(providerGroup.name, v.model_name, new Set(conns.map((c) => c.name))),
          protocol: providerGroup.protocol,
          base_url: providerGroup.baseUrl,
          model_name: v.model_name,
          conn_type: anthropic ? 'chat' : v.conn_type, // anthropic 无向量接口，强制 chat
          provider_group_id: providerGroup.id, // REQ-148：归属所选实例分组
          copy_key_from: providerGroup.anchor.id, // Key 归属提供商：与组锚点共享同一份密文
          enabled: true,
          is_default: false,
        })
        if (v.is_default) await api.setDefaultConnection(created.id)
      }
      showToast('已保存')
      onSaved()
    } catch (e: any) {
      showToast(e.message, 'err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      centered
      title={editConn ? `编辑模型 · ${editConn.model_name}` : '添加模型'}
      onCancel={onClose}
      width={620}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={busy} onClick={save}>保存</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" requiredMark={false} disabled={busy}>
        {!editConn && groups.length === 0 && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="尚无提供商"
            description="请先关闭本弹窗，用「＋ 添加提供商」从厂商预设快速填充访问配置（仅需补 API Key）。"
          />
        )}
        <Form.Item name="provider" label="所属提供商" rules={[{ required: true, message: '请选择提供商；新提供商请先添加' }]} style={{ marginBottom: 8 }}>
          <Select
            placeholder="选择提供商"
            options={groups.map((g) => ({ value: g.key, label: `${g.name}（${g.protocol === 'anthropic' ? 'anthropic' : 'openai_compat'}）` }))}
          />
        </Form.Item>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px', fontSize: 12, color: 'rgba(0,0,0,0.55)' }}>
          <span>接入点：{providerGroup?.baseUrl || '—'}</span>
          {providerGroup && <Tag style={{ margin: 0 }} color={anthropic ? 'purple' : 'blue'}>{protocolLabel(providerGroup.protocol)}</Tag>}
          <span>（随所选提供商）</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item name="model_name" label="模型名" rules={[{ required: true, message: '模型名必填' }]} style={{ flex: 1, marginBottom: 12 }}>
            <Input placeholder={anthropic ? 'claude-sonnet-4-5' : 'deepseek-chat'} />
          </Form.Item>
          <Form.Item name="conn_type" label="类型" style={{ width: 180, marginBottom: 12 }} extra={anthropic ? 'Anthropic 协议仅支持对话模型' : undefined}>
            <Select
              disabled={anthropic}
              options={[
                { value: 'chat', label: 'chat（对话）' },
                { value: 'embedding', label: 'embedding（向量）', disabled: anthropic },
              ]}
            />
          </Form.Item>
        </div>
        <Form.Item label="API Key" style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.55)' }}>
            API Key 由提供商统一管理{editConn ? '；移动到其他提供商时自动沿用目标提供商的 Key。' : '；保存后自动沿用所选提供商的 Key。'}
          </span>
        </Form.Item>
        <Form.Item name="is_default" label="设为该类型默认" valuePropName="checked" extra="chat / embedding 各至多一条默认；「跟随全局默认」的智能体将使用它" style={{ marginBottom: 4 }}>
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}
