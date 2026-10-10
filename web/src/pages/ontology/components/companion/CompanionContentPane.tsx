import { Empty, Table, Tag, Tooltip, Typography } from 'antd'
import type { CompanionGraph } from '../../../../api/companion'

// ---------------------------------------------------------------------------
// REQ-285③：伴生内容清单（只读投影）——图看结构（沉淀总览）、表看明细（本分区）。
// 数据=资产详情页页面级伴生图加载结果（零额外请求）；实体表（kind/名称/定义/置信/时点/
// 入图时间）+ 关系表（主体/关系/客体/印证数/入图时间）。
// ---------------------------------------------------------------------------

const fmtTime = (s?: string) => (s ? s.slice(0, 19).replace('T', ' ') : '—')

export default function CompanionContentPane({ graph }: { graph: CompanionGraph | null }) {
  if (!graph || graph.nodes.length === 0) {
    return <Empty description="伴生图暂无沉淀内容（绑定智能体对话收尾后自动生长）" style={{ padding: '40px 0' }} />
  }
  const concepts = graph.nodes.filter((n) => n.kind === 'Concept')
  const events = graph.nodes.filter((n) => n.kind === 'Event')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <Typography.Title level={5} style={{ marginTop: 0 }}>
          实体（概念 {concepts.length} · 事件 {events.length}）
        </Typography.Title>
        <Table
          size="small"
          dataSource={graph.nodes.map((n, i) => ({ key: i, ...n }))}
          pagination={{ pageSize: 20, hideOnSinglePage: true, showSizeChanger: false }}
          columns={[
            {
              title: '类型', width: 70,
              render: (_: unknown, r: any) => (
                <Tag color={r.kind === 'Event' ? 'purple' : 'cyan'} style={{ margin: 0 }}>{r.kind === 'Event' ? '事件' : '概念'}</Tag>
              ),
            },
            { title: '名称', dataIndex: 'label', width: 180, render: (v: string) => <Typography.Text strong style={{ fontSize: 12 }}>{v}</Typography.Text> },
            {
              title: '定义', dataIndex: 'definition', ellipsis: { showTitle: false },
              render: (v?: string) => (
                <Tooltip title={v || undefined}><Typography.Text type="secondary" style={{ fontSize: 12 }}>{v || '（未沉淀定义）'}</Typography.Text></Tooltip>
              ),
            },
            { title: '置信', dataIndex: 'confidence', width: 70, render: (v?: number) => (typeof v === 'number' ? v.toFixed(2) : '—') },
            { title: '时点', dataIndex: 'time_scope', width: 90, render: (v?: string) => v || '—' },
            { title: '入图时间', dataIndex: 'created_at', width: 160, render: (v?: string) => <span style={{ color: 'var(--c-ink-3)', fontSize: 11 }}>{fmtTime(v)}</span> },
          ]}
        />
      </div>
      <div>
        <Typography.Title level={5} style={{ marginTop: 0 }}>关系（{graph.edges.length}）</Typography.Title>
        {graph.edges.length === 0 ? (
          <Empty description="暂无关系边" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Table
            size="small"
            dataSource={graph.edges.map((e, i) => ({ key: i, ...e }))}
            pagination={{ pageSize: 20, hideOnSinglePage: true, showSizeChanger: false }}
            columns={[
              { title: '主体', dataIndex: 'source', width: 160, render: (v: string) => <Typography.Text style={{ fontSize: 12 }}>{v}</Typography.Text> },
              { title: '关系', dataIndex: 'rel', width: 120, render: (v: string) => <Tag color="geekblue" style={{ margin: 0 }}>{v}</Tag> },
              { title: '客体', dataIndex: 'target', width: 160, render: (v: string) => <Typography.Text style={{ fontSize: 12 }}>{v}</Typography.Text> },
              {
                title: '印证', dataIndex: 'confirm_count', width: 70,
                render: (v?: number) => (
                  <Tooltip title="同事实被确认次数（REQ-227① 印证聚合）">
                    <Tag color={(v ?? 1) > 1 ? 'orange' : 'default'} style={{ margin: 0 }}>{v ?? 1}×</Tag>
                  </Tooltip>
                ),
              },
              { title: '入图时间', dataIndex: 'created_at', width: 160, render: (v?: string) => <span style={{ color: 'var(--c-ink-3)', fontSize: 11 }}>{fmtTime(v)}</span> },
            ]}
          />
        )}
      </div>
    </div>
  )
}
