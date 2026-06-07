'use client'

import { useMemo, useState } from 'react'

type Stage = '学生' | '职场新人' | '中年' | '退休'
type IdentityTag = '本地' | '一线打工人' | '海外身份' | '自由职业'
type EducationTag = '高中' | '本科' | '硕士' | '博士'

type CurrentState = {
  age: number
  stage: Stage
  assets: number // 万元
  identity: IdentityTag
  identityScore: number // 0-100
  education: EducationTag
  educationScore: number // 0-100
  health: number // 0-100
}

type Branch = {
  id: string
  name: string
  assetGrowth: number // % per year (compound)
  identityDelta: number // per year
  educationDelta: number // per year
  healthDelta: number // per year
}

type StateVec = {
  assets: number
  identity: number
  education: number
  health: number
}

const HORIZONS = [5, 10, 20, 30] as const
const MAX_YEARS = 30

const DEFAULT_BRANCHES: Branch[] = [
  { id: 'b-base', name: '留守大厂（基线）', assetGrowth: 8, identityDelta: 1, educationDelta: 0.5, healthDelta: -0.5 },
  { id: 'b-startup', name: '出海创业', assetGrowth: 15, identityDelta: 2, educationDelta: 1, healthDelta: -1.5 },
]

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x))
}

function projectBranch(start: StateVec, b: Branch, years: number): StateVec[] {
  const states: StateVec[] = [start]
  let cur: StateVec = { ...start }
  for (let y = 1; y <= years; y++) {
    cur = {
      assets: cur.assets * (1 + b.assetGrowth / 100),
      identity: clamp(cur.identity + b.identityDelta, 0, 100),
      education: clamp(cur.education + b.educationDelta, 0, 100),
      health: clamp(cur.health + b.healthDelta, 0, 100),
    }
    states.push(cur)
  }
  return states
}

type Computed = {
  snapshot: Branch[]
  perBranch: Record<string, StateVec[]>
}

const cellStyle: React.CSSProperties = { padding: 6, whiteSpace: 'nowrap' }
const inputStyle: React.CSSProperties = { padding: 6, width: '100%', boxSizing: 'border-box' }

export default function SimPage() {
  const [state, setState] = useState<CurrentState>({
    age: 30,
    stage: '中年',
    assets: 50,
    identity: '一线打工人',
    identityScore: 55,
    education: '硕士',
    educationScore: 75,
    health: 80,
  })
  const [branches, setBranches] = useState<Branch[]>(DEFAULT_BRANCHES)
  const [computed, setComputed] = useState<Computed | null>(null)

  const addBranch = (): void => {
    const id = 'b-' + Date.now().toString(36)
    setBranches([
      ...branches,
      { id, name: '新分叉路径', assetGrowth: 5, identityDelta: 0, educationDelta: 0, healthDelta: 0 },
    ])
  }
  const removeBranch = (id: string): void => {
    if (branches.length <= 2) return
    setBranches(branches.filter((b) => b.id !== id))
  }
  const updateBranch = (id: string, patch: Partial<Branch>): void => {
    setBranches(branches.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }

  const compute = (): void => {
    const start: StateVec = {
      assets: state.assets,
      identity: state.identityScore,
      education: state.educationScore,
      health: state.health,
    }
    const perBranch: Record<string, StateVec[]> = {}
    for (const b of branches) {
      perBranch[b.id] = projectBranch(start, b, MAX_YEARS)
    }
    setComputed({ snapshot: branches.map((b) => ({ ...b })), perBranch })
  }

  type Row = {
    id: string
    name: string
    isBaseline: boolean
    final: StateVec
    diff: StateVec
    cumAsset: number
  }
  type HorizonBlock = { T: number; rows: Row[] }

  const tableBlocks: HorizonBlock[] = useMemo(() => {
    if (!computed) return []
    const baseline = computed.snapshot[0]
    if (!baseline) return []
    const baseSeries = computed.perBranch[baseline.id]
    if (!baseSeries) return []
    return HORIZONS.map<HorizonBlock>((T) => ({
      T,
      rows: computed.snapshot.map<Row>((b) => {
        const series = computed.perBranch[b.id]
        const final = series[T]
        const baseFinal = baseSeries[T]
        let cumAsset = 0
        for (let y = 1; y <= T; y++) {
          cumAsset += series[y].assets - baseSeries[y].assets
        }
        return {
          id: b.id,
          name: b.name,
          isBaseline: b.id === baseline.id,
          final,
          diff: {
            assets: final.assets - baseFinal.assets,
            identity: final.identity - baseFinal.identity,
            education: final.education - baseFinal.education,
            health: final.health - baseFinal.health,
          },
          cumAsset,
        }
      }),
    }))
  }, [computed])

  const fmt = (n: number, digits = 1): string => n.toFixed(digits)
  const signed = (n: number, digits = 1): string => (n >= 0 ? '+' : '') + n.toFixed(digits)
  const diffColor = (n: number): string => (Math.abs(n) < 1e-9 ? '#6b7280' : n > 0 ? '#059669' : '#dc2626')

  return (
    <section style={{ display: 'grid', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 40, marginBottom: 8 }}>机会成本模拟器</h1>
        <p style={{ color: '#4b5563', margin: 0 }}>
          填当前状态 + 至少两条分叉路，看 5 / 10 / 20 / 30 年后资产、身份、学历、健康各维度的差异以及累计机会成本。
        </p>
      </div>

      <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
        <legend style={{ fontWeight: 600, padding: '0 8px' }}>当前状态</legend>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
            年龄
            <input
              type="number"
              value={state.age}
              onChange={(e) => setState({ ...state, age: Number(e.target.value) })}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
            阶段
            <select
              value={state.stage}
              onChange={(e) => setState({ ...state, stage: e.target.value as Stage })}
              style={inputStyle}
            >
              <option value="学生">学生</option>
              <option value="职场新人">职场新人</option>
              <option value="中年">中年</option>
              <option value="退休">退休</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
            资产 (万元)
            <input
              type="number"
              value={state.assets}
              onChange={(e) => setState({ ...state, assets: Number(e.target.value) })}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
            身份
            <select
              value={state.identity}
              onChange={(e) => setState({ ...state, identity: e.target.value as IdentityTag })}
              style={inputStyle}
            >
              <option value="本地">本地</option>
              <option value="一线打工人">一线打工人</option>
              <option value="海外身份">海外身份</option>
              <option value="自由职业">自由职业</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
            身份得分 (0-100)
            <input
              type="number"
              min={0}
              max={100}
              value={state.identityScore}
              onChange={(e) => setState({ ...state, identityScore: Number(e.target.value) })}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
            学历
            <select
              value={state.education}
              onChange={(e) => setState({ ...state, education: e.target.value as EducationTag })}
              style={inputStyle}
            >
              <option value="高中">高中</option>
              <option value="本科">本科</option>
              <option value="硕士">硕士</option>
              <option value="博士">博士</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
            学历得分 (0-100)
            <input
              type="number"
              min={0}
              max={100}
              value={state.educationScore}
              onChange={(e) => setState({ ...state, educationScore: Number(e.target.value) })}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
            健康得分 (0-100)
            <input
              type="number"
              min={0}
              max={100}
              value={state.health}
              onChange={(e) => setState({ ...state, health: Number(e.target.value) })}
              style={inputStyle}
            />
          </label>
        </div>
      </fieldset>

      <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
        <legend style={{ fontWeight: 600, padding: '0 8px' }}>分叉路径（首条为基线）</legend>
        <div style={{ display: 'grid', gap: 12 }}>
          {branches.map((b, idx) => (
            <div
              key={b.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                padding: 12,
                display: 'grid',
                gap: 8,
                background: idx === 0 ? '#f9fafb' : 'transparent',
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#6b7280', minWidth: 56 }}>
                  {idx === 0 ? '基线' : `分叉 ${idx}`}
                </span>
                <input
                  value={b.name}
                  onChange={(e) => updateBranch(b.id, { name: e.target.value })}
                  placeholder="路径名称"
                  style={{ flex: 1, minWidth: 160, padding: 6 }}
                />
                {branches.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeBranch(b.id)}
                    style={{ padding: '4px 10px' }}
                  >
                    删除
                  </button>
                )}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 8,
                }}
              >
                <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
                  资产年化 (%)
                  <input
                    type="number"
                    step="0.5"
                    value={b.assetGrowth}
                    onChange={(e) => updateBranch(b.id, { assetGrowth: Number(e.target.value) })}
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
                  身份分 / 年
                  <input
                    type="number"
                    step="0.1"
                    value={b.identityDelta}
                    onChange={(e) => updateBranch(b.id, { identityDelta: Number(e.target.value) })}
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
                  学历分 / 年
                  <input
                    type="number"
                    step="0.1"
                    value={b.educationDelta}
                    onChange={(e) => updateBranch(b.id, { educationDelta: Number(e.target.value) })}
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
                  健康分 / 年
                  <input
                    type="number"
                    step="0.1"
                    value={b.healthDelta}
                    onChange={(e) => updateBranch(b.id, { healthDelta: Number(e.target.value) })}
                    style={inputStyle}
                  />
                </label>
              </div>
            </div>
          ))}
          <div>
            <button type="button" onClick={addBranch} style={{ padding: '6px 10px' }}>
              + 新增分叉
            </button>
          </div>
        </div>
      </fieldset>

      <div>
        <button
          type="button"
          onClick={compute}
          style={{
            padding: '12px 20px',
            fontSize: 16,
            background: '#111827',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          计算长期机会成本
        </button>
      </div>

      {computed && tableBlocks.length > 0 && (
        <div style={{ display: 'grid', gap: 16 }}>
          <h2 style={{ fontSize: 24, margin: 0 }}>
            结果（基线: {computed.snapshot[0].name}）
          </h2>
          {tableBlocks.map(({ T, rows }) => (
            <div
              key={T}
              style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, overflow: 'auto' }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 8 }}>{T} 年后</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                    <th style={cellStyle}>路径</th>
                    <th style={cellStyle}>资产 (万)</th>
                    <th style={cellStyle}>身份分</th>
                    <th style={cellStyle}>学历分</th>
                    <th style={cellStyle}>健康分</th>
                    <th style={cellStyle}>资产 Δ vs 基线</th>
                    <th style={cellStyle}>身份 Δ</th>
                    <th style={cellStyle}>学历 Δ</th>
                    <th style={cellStyle}>健康 Δ</th>
                    <th style={cellStyle}>累计机会成本 (万·年)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={cellStyle}>{r.isBaseline ? `${r.name} (基线)` : r.name}</td>
                      <td style={cellStyle}>{fmt(r.final.assets)}</td>
                      <td style={cellStyle}>{fmt(r.final.identity)}</td>
                      <td style={cellStyle}>{fmt(r.final.education)}</td>
                      <td style={cellStyle}>{fmt(r.final.health)}</td>
                      <td style={{ ...cellStyle, color: diffColor(r.diff.assets) }}>
                        {r.isBaseline ? '—' : signed(r.diff.assets)}
                      </td>
                      <td style={{ ...cellStyle, color: diffColor(r.diff.identity) }}>
                        {r.isBaseline ? '—' : signed(r.diff.identity)}
                      </td>
                      <td style={{ ...cellStyle, color: diffColor(r.diff.education) }}>
                        {r.isBaseline ? '—' : signed(r.diff.education)}
                      </td>
                      <td style={{ ...cellStyle, color: diffColor(r.diff.health) }}>
                        {r.isBaseline ? '—' : signed(r.diff.health)}
                      </td>
                      <td style={{ ...cellStyle, color: diffColor(r.cumAsset) }}>
                        {r.isBaseline ? '—' : signed(r.cumAsset)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
            资产按年化复利推进；身份 / 学历 / 健康按每年加减并截断在 0-100。"Δ vs 基线" 是 T
            年时点该路径相对基线的差值；"累计机会成本 (万·年)" 是 1..T
            年逐年资产差的累加（积分近似），衡量长期机会成本的总暴露面积。
          </p>
        </div>
      )}
    </section>
  )
}
