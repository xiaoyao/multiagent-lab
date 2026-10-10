import { useEffect, useState } from 'react'
import { Alert, Button, Space, Tabs, Tag, Typography } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { api } from '../../api/client'
import type { RuntimeProfile } from '../../api/types'
import AuditObserveTab, { hasQualityWarn } from './components/audit/AuditObserveTab'
import AuditDecisionTab from './components/audit/AuditDecisionTab'
import AuditHomeTab from './components/audit/AuditHomeTab'

// ---------------------------------------------------------------------------
// 消费与审计（第五栏，D-O15/REQ-110；REQ-290/M94 内容置换）
// 栏定位=本体消费侧观测台（D-O19），REQ-290 把边界厘清从「文案与来源徽标」推进到
// 「内容归属」：KB 抽取 KG 的图谱观测与 GraphRAG 试查退役归知识库模块（能力在
// 知识库 GraphRAG「图谱与统计」「全局问答」全量在位），本栏回填本体消费内容——
// 消费观测（运行方案装载/质量快照 + TTL 关键词快查 + 消费面导航）+ 决策审计
// （onto_decision 跨模块留痕，默认 ontology 过滤）+ PROV-O 导出。零后端变更。
// ---------------------------------------------------------------------------

/** 跨栏跳转到本栏（与 BuildPage/RuntimePage 的 onto-sidebar-change 机制一致） */
export function gotoAuditPane() {
  localStorage.setItem('eino.onto.sidebar', 'audit')
  window.dispatchEvent(new CustomEvent('onto-sidebar-change'))
}

export default function AuditPage() {
  const [profiles, setProfiles] = useState<RuntimeProfile[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('observe')

  const loadProfiles = () => {
    setLoading(true)
    api
      .listRuntimeProfiles()
      .then((ps) => setProfiles(ps))
      .catch(() => setProfiles([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  const running = (profiles ?? []).filter((p) => p.status === 'running')
  const warnCount = running.filter(hasQualityWarn).length

  return (
    <div className="main">
      <div className="work-main sema-main">
        <div className="work-head">
          <div className="work-head-text">
            <div className="work-head-title">
              <Typography.Title level={4} style={{ margin: 0 }}>
                消费与审计
              </Typography.Title>
              <Tag color="purple" style={{ margin: 0 }}>
                本体消费侧观测台
              </Tag>
              <Tag style={{ margin: 0 }}>TTL 消费 · 决策留痕</Tag>
            </div>
            <p className="work-head-desc">
              本体消费侧观测台（D-O19/REQ-290）：观测本体 TTL 装载后的消费面（消费一览 / 关键词快查 / 运行态实渲 · SPARQL · AI 消费 · CQ 验收导航），构建与治理决策全程留痕可溯源并导出 PROV-O。知识库文本抽取 KG 的展示与治理在知识库模块（内容置换出本栏）。
            </p>
          </div>
          <Space size={8} wrap>
            <Button icon={<ReloadOutlined />} loading={loading} onClick={loadProfiles}>
              刷新
            </Button>
          </Space>
        </div>

        {/* 状态条：运行方案聚合 + 质量低分警示（REQ-234① 口径，只警示不阻断） */}
        <div className="sema-status">
          {profiles === null ? (
            <Alert type="info" showIcon title="运行方案加载中…" />
          ) : running.length === 0 ? (
            <Alert
              type="info"
              showIcon
              title="暂无运行中的本体方案"
              description="消费面观测需先启动方案：到「本体运行」栏启动（或创建）运行方案后，此处展示装载版本与质量快照。"
            />
          ) : (
            <Alert
              type={warnCount > 0 ? 'warning' : 'success'}
              showIcon
              title={
                <Space size={8} wrap>
                  <span>
                    <b>{running.length}</b> 个运行方案消费中
                  </span>
                  {warnCount > 0 && (
                    <Tag color="orange" style={{ margin: 0 }}>
                      质量低分警示 ×{warnCount}
                    </Tag>
                  )}
                </Space>
              }
              description={
                <Space size={16} wrap>
                  <span>消费面见「消费观测」页签；决策留痕见「决策审计」页签</span>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    质量快照由方案启动异步快评写入（REQ-234①），低分仅警示不阻断
                  </Typography.Text>
                </Space>
              }
            />
          )}
        </div>

        <Tabs
          activeKey={tab}
          onChange={setTab}
          items={[
            { key: 'observe', label: '消费观测', children: <AuditObserveTab profiles={profiles ?? []} loading={loading} onReload={loadProfiles} /> },
            { key: 'audit', label: '决策审计', children: <AuditDecisionTab /> },
            { key: 'home', label: '学习引导', children: <AuditHomeTab /> },
          ]}
        />

      </div>
    </div>
  )
}
