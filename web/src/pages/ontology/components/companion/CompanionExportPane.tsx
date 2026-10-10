import { useState } from 'react'
import { Alert, Button, Card, Typography } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { useUI } from '../../../../store/ui'

// ---------------------------------------------------------------------------
// REQ-284④：伴生子图 TTL 导出——对话生长产物可进 Protégé 等外部工具
// （与普通本体「进得来出得去」的互操作面对齐）。后端 GET
// /api/companion/ontologies/{id}/export-ttl：EnsureHost → 全量三元组 → Turtle 序列化。
// ---------------------------------------------------------------------------

export default function CompanionExportPane({ ontologyId }: { ontologyId: string }) {
  const { showToast } = useUI()
  const [busy, setBusy] = useState(false)
  const download = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/companion/ontologies/${encodeURIComponent(ontologyId)}/export-ttl`)
      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try {
          const j = await res.json()
          if (j?.error) msg = j.error
        } catch { /* 非 JSON 错误体 */ }
        throw new Error(msg)
      }
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `companion-${ontologyId}.ttl`
      a.click()
      URL.revokeObjectURL(a.href)
      showToast('TTL 已下载')
    } catch (e: any) {
      showToast(e?.message ?? '导出失败', 'err')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Card size="small" styles={{ body: { display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' } }}>
      <Typography.Title level={5} style={{ margin: 0 }}>伴生子图导出（Turtle）</Typography.Title>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        导出当前伴生子图全部三元组（概念/事件/关系与溯源标注，bot: 薄本体词表）为 .ttl 文件——
        可导入 Protégé、rdflib 等标准 RDF 工具查看与加工。数据为只读快照，不影响平台内伴生图。
      </Typography.Text>
      <Alert
        type="info"
        showIcon
        message="导出经宿主方案引擎实时读取；引擎未运行时会自动拉起（读侧兜底），不可达时导出失败并给出原因。"
        style={{ width: '100%' }}
      />
      <Button type="primary" icon={<DownloadOutlined />} loading={busy} onClick={download}>
        导出 companion-{ontologyId.slice(0, 12)}….ttl
      </Button>
    </Card>
  )
}
