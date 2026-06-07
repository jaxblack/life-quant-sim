'use client'

// LongRangeCostChart
// 长期机会成本变化结果展示组件（纯展示，不做核心算法）。
//
// 验收口径：
// - 展示不同分叉在 5 / 10 / 20 / 30 年维度的"累计机会成本"
// - 展示"年度差值"（每年新增的机会成本 / 收益）
// - 标记关键拐点（窗口收窄 / 年龄硬卡 / 体能下滑等节点）
// - 正负机会成本用颜色区分（红=损失累积，绿=收益累积）
//
// 边界（非常重要）：
// - 本组件**不引入输入表单**，也**不修改核心算法**。
// - branch 的展示性成本曲线是从 OpportunityWindow 已有字段
//   （ageStart / ageEnd / branches 顺序）以确定性方式派生的"展示用合成模型"，
//   仅用于让用户直观看到"不同分叉随时间累积的差值结构"，
//   不是真实仿真结果。组件 UI 上明确标注了这一点。

import { useMemo, useState } from 'react'

// 输入窗口的最小契约（与 page.tsx 中的 OpportunityWindow 兼容；
// 这里写一个本地 type 而不是从 page.tsx 导入，是为了让组件无侧向耦合）。
export type OpportunityWindowLike = {
  id: string
  title: string
  ageStart: number
  ageEnd: number
  branches: string[]
}

export type LongRangeCostChartProps = {
  windows: OpportunityWindowLike[]
  currentAge: number
}

type ChartTab = 'cumulative' | 'annual' | 'turning'

// 展示用合成模型：见文件头注释
function syntheticCumulativeCost(
  win: OpportunityWindowLike,
  branchIndex: number,
  yearsFromNow: number,
  currentAge: number
): number {
  const totalBranches = Math.max(1, win.branches.length)
  const conservatism =
    totalBranches === 1 ? 0.5 : branchIndex / (totalBranches - 1)
  const aggression = 1 - conservatism

  const targetAge = currentAge + yearsFromNow
  const windowMid = (win.ageStart + win.ageEnd) / 2
  const windowSpan = Math.max(1, win.ageEnd - win.ageStart)
  const distanceFromMid = (targetAge - windowMid) / windowSpan

  const yearsAfterWindowEnd = Math.max(0, targetAge - win.ageEnd)
  const yearsBeforeWindowStart = Math.max(0, win.ageStart - targetAge)
  const insideWindow = targetAge >= win.ageStart && targetAge <= win.ageEnd

  const aggressiveEarlyPain =
    aggression *
    40 *
    (1 - Math.exp(-Math.max(0, yearsFromNow) / 4)) *
    (insideWindow ? 1 : 0.4)
  const aggressivePayoff =
    aggression * 90 * (1 - Math.exp(-yearsAfterWindowEnd / 6))
  const aggressiveCost = aggressiveEarlyPain - aggressivePayoff

  const conservativeLoss =
    conservatism *
    100 *
    (1 - Math.exp(-Math.max(0, yearsFromNow) / 8)) *
    (1 + 0.4 * Math.tanh(distanceFromMid))

  const dampening =
    yearsBeforeWindowStart > 0 ? Math.exp(-yearsBeforeWindowStart / 4) : 1

  return (aggressiveCost + conservativeLoss) * dampening
}

function syntheticAnnualDelta(
  win: OpportunityWindowLike,
  branchIndex: number,
  yearsFromNow: number,
  currentAge: number
): number {
  if (yearsFromNow <= 0) return 0
  const cur = syntheticCumulativeCost(win, branchIndex, yearsFromNow, currentAge)
  const prev = syntheticCumulativeCost(
    win,
    branchIndex,
    yearsFromNow - 1,
    currentAge
  )
  return cur - prev
}

function turningPoints(
  win: OpportunityWindowLike,
  currentAge: number
): { year: number; label: string }[] {
  const points: { year: number; label: string }[] = []
  const start = win.ageStart - currentAge
  const mid = (win.ageStart + win.ageEnd) / 2 - currentAge
  const end = win.ageEnd - currentAge
  if (start >= 0 && start <= 30) {
    points.push({ year: Math.round(start), label: `开窗（${win.ageStart} 岁）` })
  }
  if (mid >= 0 && mid <= 30 && Math.abs(mid - start) >= 1) {
    points.push({
      year: Math.round(mid),
      label: `窗口中段（${Math.round((win.ageStart + win.ageEnd) / 2)} 岁）`,
    })
  }
  if (end >= 0 && end <= 30 && Math.abs(end - mid) >= 1) {
    points.push({ year: Math.round(end), label: `关窗（${win.ageEnd} 岁）` })
  }
  const aftermath = end + 5
  if (aftermath >= 0 && aftermath <= 30) {
    points.push({
      year: Math.round(aftermath),
      label: `成本释放高峰（关窗 +5 年）`,
    })
  }
  return points
}

function costColor(value: number, alpha = 1): string {
  if (Number.isNaN(value)) return `rgba(156,163,175,${alpha})`
  const v = Math.max(-120, Math.min(120, value))
  if (v >= 0) {
    const t = v / 120
    const r = 254 - Math.round(t * 80)
    const g = Math.round(202 - t * 150)
    const b = Math.round(202 - t * 160)
    return `rgba(${r},${g},${b},${alpha})`
  } else {
    const t = -v / 120
    const r = Math.round(167 - t * 130)
    const g = 243 - Math.round(t * 50)
    const b = Math.round(208 - t * 90)
    return `rgba(${r},${g},${b},${alpha})`
  }
}

const SERIES_COLORS = [
  '#dc2626',
  '#2563eb',
  '#059669',
  '#d97706',
  '#7c3aed',
  '#0891b2',
]

const HORIZON_YEARS = [5, 10, 20, 30] as const

export default function LongRangeCostChart({
  windows,
  currentAge,
}: LongRangeCostChartProps) {
  const validWindows = useMemo(
    () => windows.filter((w) => w.branches && w.branches.length > 0),
    [windows]
  )

  const [selectedId, setSelectedId] = useState<string>(
    validWindows[0]?.id ?? ''
  )
  const [tab, setTab] = useState<ChartTab>('cumulative')

  const selected =
    validWindows.find((w) => w.id === selectedId) ?? validWindows[0]

  if (!selected) {
    return (
      <section
        aria-labelledby="long-range-cost-heading"
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 16,
          background: 'white',
          color: '#6b7280',
          fontSize: 13,
        }}
      >
        <h2
          id="long-range-cost-heading"
          style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}
        >
          长期机会成本曲线
        </h2>
        <p style={{ marginTop: 8 }}>当前没有可展示的窗口数据。</p>
      </section>
    )
  }

  return (
    <section
      aria-labelledby="long-range-cost-heading"
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 16,
        background: 'white',
        display: 'grid',
        gap: 12,
      }}
    >
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h2
            id="long-range-cost-heading"
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: '#111827',
            }}
          >
            长期机会成本曲线（5 / 10 / 20 / 30 年）
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>
            展示性可视化：从已有窗口数据派生的"分叉相对成本"指数曲线，
            用于直观对比不同分叉的累计差值与年度增量。
            <br />
            <span style={{ color: '#9ca3af' }}>
              ⚠ 非真实仿真：曲线由窗口结构（年龄区间、分叉序号）确定性派生；
              不引入新输入或核心算法变更。
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: '#374151' }}>
            选择窗口：
            <select
              value={selected.id}
              onChange={(e) => setSelectedId(e.target.value)}
              style={{
                marginLeft: 6,
                padding: '4px 6px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 12,
                maxWidth: 240,
              }}
            >
              {validWindows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title}（{w.ageStart}-{w.ageEnd} 岁）
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <nav
        aria-label="图表类型"
        style={{
          display: 'flex',
          gap: 4,
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: 4,
        }}
      >
        {(
          [
            ['cumulative', '5/10/20/30 累计'],
            ['annual', '年度差值曲线'],
            ['turning', '关键拐点时间轴'],
          ] as [ChartTab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              fontSize: 12,
              padding: '4px 10px',
              border: '1px solid',
              borderColor: tab === id ? '#111827' : '#e5e7eb',
              borderRadius: 6,
              background: tab === id ? '#111827' : 'white',
              color: tab === id ? 'white' : '#374151',
              cursor: 'pointer',
            }}
            aria-pressed={tab === id}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'cumulative' && (
        <CumulativeBars window={selected} currentAge={currentAge} />
      )}
      {tab === 'annual' && (
        <AnnualDeltaLines window={selected} currentAge={currentAge} />
      )}
      {tab === 'turning' && (
        <TurningPointsAxis window={selected} currentAge={currentAge} />
      )}

      <Legend />
    </section>
  )
}

// ---- 累计柱状图 ----
function CumulativeBars({
  window: win,
  currentAge,
}: {
  window: OpportunityWindowLike
  currentAge: number
}) {
  const matrix = win.branches.map((_label, bi) =>
    HORIZON_YEARS.map((y) =>
      Math.round(syntheticCumulativeCost(win, bi, y, currentAge))
    )
  )
  const flat = matrix.flat()
  const maxAbs = Math.max(120, ...flat.map((v) => Math.abs(v)))

  const W = 640
  const H = 280
  const padL = 130
  const padR = 16
  const padT = 28
  const padB = 30
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const groupH = innerH / win.branches.length
  const barH = Math.max(8, groupH / (HORIZON_YEARS.length + 1))
  const xZero = padL + innerW / 2
  const halfW = innerW / 2

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${win.title} 累计机会成本柱状图`}
        style={{ width: '100%', maxWidth: W, height: 'auto' }}
      >
        <line
          x1={xZero}
          x2={xZero}
          y1={padT}
          y2={padT + innerH}
          stroke="#9ca3af"
          strokeDasharray="4 3"
        />
        <text x={padL} y={padT - 12} fontSize={11} fill="#047857">
          ← 净收益累积（绿）
        </text>
        <text
          x={padL + innerW}
          y={padT - 12}
          fontSize={11}
          fill="#b91c1c"
          textAnchor="end"
        >
          损失累积（红） →
        </text>
        <text
          x={xZero}
          y={padT - 12}
          fontSize={11}
          fill="#374151"
          textAnchor="middle"
        >
          0
        </text>

        {win.branches.map((label, bi) => {
          const groupY = padT + bi * groupH
          return (
            <g key={label}>
              {bi > 0 && (
                <line
                  x1={padL}
                  x2={W - padR}
                  y1={groupY}
                  y2={groupY}
                  stroke="#f3f4f6"
                />
              )}
              <text
                x={padL - 8}
                y={groupY + groupH / 2}
                fontSize={12}
                fill="#111827"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {label.length > 14 ? label.slice(0, 13) + '…' : label}
              </text>
              {HORIZON_YEARS.map((horizon, hi) => {
                const value = matrix[bi][hi]
                const w = (Math.abs(value) / maxAbs) * halfW
                const x = value >= 0 ? xZero : xZero - w
                const y =
                  groupY +
                  (hi + 0.5) * (groupH / (HORIZON_YEARS.length + 1)) +
                  4
                return (
                  <g key={horizon}>
                    <rect
                      x={x}
                      y={y}
                      width={Math.max(1, w)}
                      height={barH}
                      fill={costColor(value, 0.85)}
                      stroke={costColor(value, 1)}
                    >
                      <title>
                        {label} · {horizon} 年累计：{value > 0 ? '+' : ''}
                        {value}
                      </title>
                    </rect>
                    <text
                      x={padL - 50}
                      y={y + barH / 2}
                      fontSize={10}
                      fill="#6b7280"
                      dominantBaseline="middle"
                    >
                      {horizon}y
                    </text>
                    <text
                      x={value >= 0 ? x + w + 4 : x - 4}
                      y={y + barH / 2}
                      fontSize={10}
                      fill="#111827"
                      dominantBaseline="middle"
                      textAnchor={value >= 0 ? 'start' : 'end'}
                    >
                      {value > 0 ? '+' : ''}
                      {value}
                    </text>
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ---- 年度差值曲线 ----
function AnnualDeltaLines({
  window: win,
  currentAge,
}: {
  window: OpportunityWindowLike
  currentAge: number
}) {
  const years = Array.from({ length: 31 }, (_, i) => i)
  const series = win.branches.map((label, bi) => ({
    label,
    values: years.map((y) => syntheticAnnualDelta(win, bi, y, currentAge)),
  }))
  const allVals = series.flatMap((s) => s.values)
  const yMax = Math.max(20, ...allVals.map((v) => Math.abs(v)))

  const W = 640
  const H = 260
  const padL = 40
  const padR = 16
  const padT = 24
  const padB = 36
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const xOf = (yr: number) => padL + (yr / 30) * innerW
  const yOf = (v: number) => padT + innerH / 2 - (v / yMax) * (innerH / 2)

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${win.title} 年度机会成本差值曲线`}
        style={{ width: '100%', maxWidth: W, height: 'auto' }}
      >
        <line
          x1={padL}
          x2={padL + innerW}
          y1={padT + innerH / 2}
          y2={padT + innerH / 2}
          stroke="#9ca3af"
          strokeDasharray="3 3"
        />
        {[0, 5, 10, 15, 20, 25, 30].map((tick) => (
          <g key={tick}>
            <line
              x1={xOf(tick)}
              x2={xOf(tick)}
              y1={padT + innerH}
              y2={padT + innerH + 4}
              stroke="#9ca3af"
            />
            <text
              x={xOf(tick)}
              y={padT + innerH + 16}
              fontSize={10}
              fill="#6b7280"
              textAnchor="middle"
            >
              +{tick}y
            </text>
          </g>
        ))}
        <text x={4} y={padT + 10} fontSize={10} fill="#b91c1c">
          +损失/年
        </text>
        <text x={4} y={padT + innerH - 2} fontSize={10} fill="#047857">
          −收益/年
        </text>

        {series.map((s, i) => {
          const color = SERIES_COLORS[i % SERIES_COLORS.length]
          const path = s.values
            .map((v, yr) => `${yr === 0 ? 'M' : 'L'} ${xOf(yr)} ${yOf(v)}`)
            .join(' ')
          return (
            <g key={s.label}>
              <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth={1.6}
                strokeOpacity={0.9}
              />
              <circle
                cx={xOf(30)}
                cy={yOf(s.values[30])}
                r={3}
                fill={color}
              >
                <title>
                  {s.label} · 第 30 年差值：
                  {s.values[30] > 0 ? '+' : ''}
                  {s.values[30].toFixed(1)}
                </title>
              </circle>
            </g>
          )
        })}

        <text
          x={W / 2}
          y={H - 6}
          fontSize={10}
          fill="#6b7280"
          textAnchor="middle"
        >
          时间（年，自当前年龄 {currentAge} 岁起）
        </text>
      </svg>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 6,
          fontSize: 11,
          color: '#374151',
        }}
      >
        {series.map((s, i) => (
          <span
            key={s.label}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 2,
                background: SERIES_COLORS[i % SERIES_COLORS.length],
              }}
            />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ---- 关键拐点时间轴 ----
function TurningPointsAxis({
  window: win,
  currentAge,
}: {
  window: OpportunityWindowLike
  currentAge: number
}) {
  const points = turningPoints(win, currentAge)
  const refBranchIndex = 0
  const years = Array.from({ length: 31 }, (_, i) => i)
  const refValues = years.map((y) =>
    syntheticCumulativeCost(win, refBranchIndex, y, currentAge)
  )
  const yMax = Math.max(60, ...refValues.map((v) => Math.abs(v)))

  const W = 640
  const H = 220
  const padL = 24
  const padR = 16
  const padT = 24
  const padB = 56
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const xOf = (yr: number) => padL + (yr / 30) * innerW
  const yOf = (v: number) => padT + innerH / 2 - (v / yMax) * (innerH / 2)

  const refPath = refValues
    .map((v, yr) => `${yr === 0 ? 'M' : 'L'} ${xOf(yr)} ${yOf(v)}`)
    .join(' ')

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${win.title} 关键拐点时间轴`}
        style={{ width: '100%', maxWidth: W, height: 'auto' }}
      >
        {/* 0 轴 */}
        <line
          x1={padL}
          x2={padL + innerW}
          y1={padT + innerH / 2}
          y2={padT + innerH / 2}
          stroke="#9ca3af"
          strokeDasharray="3 3"
        />
        {/* 参考曲线（最进取分支累计成本） */}
        <path
          d={refPath}
          fill="none"
          stroke="#1f2937"
          strokeWidth={1.5}
          strokeOpacity={0.6}
        />
        {/* x 刻度 */}
        {[0, 5, 10, 15, 20, 25, 30].map((tick) => (
          <g key={tick}>
            <line
              x1={xOf(tick)}
              x2={xOf(tick)}
              y1={padT + innerH}
              y2={padT + innerH + 4}
              stroke="#9ca3af"
            />
            <text
              x={xOf(tick)}
              y={padT + innerH + 14}
              fontSize={10}
              fill="#6b7280"
              textAnchor="middle"
            >
              +{tick}y
            </text>
          </g>
        ))}

        {/* 拐点标记：圆点 + 引线 + 标签 */}
        {points.map((p, idx) => {
          const px = xOf(p.year)
          const py = yOf(refValues[Math.max(0, Math.min(30, p.year))])
          // 交错 向上 / 向下 放标签，避免重叠
          const above = idx % 2 === 0
          const labelY = above ? padT + 4 : padT + innerH + padB - 18
          const lineY1 = above ? py : py
          const lineY2 = above ? labelY + 4 : labelY - 4
          return (
            <g key={`${p.year}-${idx}`}>
              <line
                x1={px}
                x2={px}
                y1={lineY1}
                y2={lineY2}
                stroke="#9ca3af"
                strokeDasharray="2 2"
              />
              <circle cx={px} cy={py} r={5} fill="#fbbf24" stroke="#92400e" />
              <text x={px + 6} y={py - 4} fontSize={10} fill="#92400e">
                ★
              </text>
              <rect
                x={px - 60}
                y={labelY - 12}
                width={120}
                height={16}
                rx={3}
                fill="#fffbeb"
                stroke="#fde68a"
              />
              <text
                x={px}
                y={labelY}
                fontSize={10}
                fill="#92400e"
                textAnchor="middle"
              >
                {p.label}
              </text>
            </g>
          )
        })}

        <text
          x={W / 2}
          y={H - 4}
          fontSize={10}
          fill="#6b7280"
          textAnchor="middle"
        >
          黑色曲线 = 入资最进取分叉的累计成本（参考）·★ = 关键拐点
        </text>
      </svg>

      {points.length === 0 && (
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
          当前年龄与该窗口之间没有起 30 年内可见的拐点（或该窗口已完全关闭）。
        </p>
      )}

      <ul
        style={{
          marginTop: 6,
          padding: 0,
          listStyle: 'none',
          display: 'grid',
          gap: 2,
          fontSize: 11,
          color: '#374151',
        }}
      >
        {points.map((p, idx) => (
          <li key={`legend-${p.year}-${idx}`}>
            · +{p.year}y：{p.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---- 颜色 / 说明图例 ----
function Legend() {
  return (
    <div
      style={{
        borderTop: '1px dashed #e5e7eb',
        paddingTop: 8,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        fontSize: 11,
        color: '#374151',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span
          style={{
            display: 'inline-block',
            width: 14,
            height: 10,
            background: costColor(80, 0.85),
            border: `1px solid ${costColor(80, 1)}`,
          }}
        />
        损失累计（机会成本为正）
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span
          style={{
            display: 'inline-block',
            width: 14,
            height: 10,
            background: costColor(-80, 0.85),
            border: `1px solid ${costColor(-80, 1)}`,
          }}
        />
        净收益累计（机会成本为负）
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span
          style={{
            display: 'inline-block',
            width: 14,
            height: 10,
            background: '#fffbeb',
            border: '1px solid #fde68a',
          }}
        />
        ★ 关键拐点（开窗 / 中段 / 关窗 / 关窗 +5y）
      </span>
    </div>
  )
}
