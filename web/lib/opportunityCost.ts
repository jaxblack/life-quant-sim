// web/lib/opportunityCost.ts
//
// 机会成本(Opportunity Cost)纯数据模型与计算函数。
//
// 适用场景:
//   给定"当前人生状态"(年龄、家庭、地域、四个核心指标的起点),
//   给定"两个或多个分叉路径"(如 考公 vs 留学 vs 创业),
//   给定"时间跨度"(最长投影到 100 岁),
//   逐年算出每条路径在四个维度(资产/身份/学历/健康)上的演化曲线,
//   以及"以基线路径为参照,其他路径的累计差额(机会成本)".
//
// 设计原则:
//   1. 纯函数, 无副作用, 不依赖 React / DOM / Node 特有 API,
//      可在浏览器、SSR、CLI、单元测试里同样运行.
//   2. 不替换 web/app/sim/page.tsx 已有的趋势卡 / 窗口分支逻辑;
//      此模块只是为后续可视化与对比新增一个独立的数据层.
//   3. 数值是相对量纲(0-100 的"指数"), 不是真实货币 / 学位等级,
//      避免在原型期承诺无法兑现的精度.
//
// 使用示例(伪代码, 见 default 导出 simulateForks):
//   const result = simulateForks({
//     baseline: { age: 24, ... },
//     forks: [forkA, forkB, forkC],
//     horizonYears: 20,
//   })
//   result.timelines[forkId][year].metrics.wealth
//   result.opportunityCost[forkId].cumulative.wealth

// ---- 指标维度 ----------------------------------------------------------

// 与 web/app/sim/page.tsx StatusCard.key 对齐: wealth / identity / education / body
export type MetricKey = 'wealth' | 'identity' | 'education' | 'body'

export const METRIC_KEYS: readonly MetricKey[] = [
  'wealth',
  'identity',
  'education',
  'body',
] as const

export type MetricVector = Record<MetricKey, number>

// 指标的"年增量修饰", 用于描述某条分叉路径对每个维度的影响.
// 单位都是同一个相对量纲(指数点 / 年), 不是货币 / GPA.
export type MetricDelta = Partial<MetricVector>

// ---- 当前人生状态 -----------------------------------------------------

// 调用方传入的"起点", 与 sim 页面四象限指标对齐.
// 数值范围建议 0-100, 但函数本身不强制裁剪起点 —— 仅在每年演化时
// 通过 clamp 防止越界.
export type LifeState = {
  age: number
  // 出身家庭(与 web/app/sim/page.tsx FAMILIES.id 对齐), 仅作元数据,
  // 不参与默认演化公式 —— 调用方可据此选择不同的 fork 集合.
  familyId?: string
  regionId?: string
  // 起始指标. 缺省时按"中等水准"60 起步.
  metrics: MetricVector
}

// ---- 分叉路径 ---------------------------------------------------------

export type ForkId = string

export type LifeFork = {
  id: ForkId
  name: string
  // 一句话描述, 给 UI 显示.
  brief: string
  // 该路径在每年对四个维度的"基础年增量"(可正可负).
  // 例:留学路径前 3 年 wealth -8 / education +6, 之后 wealth +4 / education +2.
  // 用 segments 表示分段; 第一个 ageStart 必须 ≤ baseline.age, 之后段连续.
  segments: ForkSegment[]
}

export type ForkSegment = {
  ageStart: number // 包含
  ageEnd: number   // 包含
  perYear: MetricDelta
  // 段内一次性事件(发生在 ageStart 那一年, 仅触发一次), 例如毕业、买房、生子.
  oneOff?: MetricDelta
  // 给 UI 与 debug 显示用的标签(可选)
  label?: string
}

// ---- 计算输入 / 输出 --------------------------------------------------

export type SimulateInput = {
  baseline: LifeState
  // 至少 2 条 fork. forks[0] 视为参考基线(机会成本的对照系).
  // 若调用方希望以"什么都不做"为基线, 可在 forks[0] 写一条全 0 的 segment.
  forks: LifeFork[]
  // 投影年数(包含起始年). 例如 horizonYears=20 表示算 20 年.
  // 内部会裁剪到 baseline.age + horizonYears ≤ 100.
  horizonYears: number
}

export type YearlySnapshot = {
  age: number
  metrics: MetricVector
  // 当年相对于上一年的实际变化(已 clamp).
  delta: MetricVector
}

export type ForkTimeline = {
  forkId: ForkId
  forkName: string
  years: YearlySnapshot[]
}

// 机会成本汇总:相对 forks[0]
export type OpportunityCost = {
  forkId: ForkId
  baselineForkId: ForkId
  // 与基线相比, 每年的差额(此 fork - 基线), 单位仍是指数点.
  perYear: { age: number; diff: MetricVector }[]
  // 累计差额(各年 diff 的累加). 正值 = 此 fork 在该维度上比基线多得到的.
  cumulative: MetricVector
  // 年化平均差额, 便于比较不同 horizon 长度.
  annualized: MetricVector
}

export type SimulateResult = {
  baseline: LifeState
  horizonYears: number
  timelines: Record<ForkId, ForkTimeline>
  opportunityCost: Record<ForkId, OpportunityCost>
}

// ---- 工具函数 ---------------------------------------------------------

const METRIC_MIN = 0
const METRIC_MAX = 100
const MAX_AGE = 100

function clamp(v: number, lo = METRIC_MIN, hi = METRIC_MAX): number {
  if (Number.isNaN(v)) return lo
  if (v < lo) return lo
  if (v > hi) return hi
  return v
}

function zeroVector(): MetricVector {
  return { wealth: 0, identity: 0, education: 0, body: 0 }
}

function addDelta(target: MetricVector, delta: MetricDelta): MetricVector {
  return {
    wealth: target.wealth + (delta.wealth ?? 0),
    identity: target.identity + (delta.identity ?? 0),
    education: target.education + (delta.education ?? 0),
    body: target.body + (delta.body ?? 0),
  }
}

function diffVector(a: MetricVector, b: MetricVector): MetricVector {
  return {
    wealth: a.wealth - b.wealth,
    identity: a.identity - b.identity,
    education: a.education - b.education,
    body: a.body - b.body,
  }
}

// 在 segments 中找包含给定 age 的那一段.
// 段缺失 / 完全不覆盖时, 用 0 增量回退, 并在调用方 console.warn(留给上层选).
function segmentAt(fork: LifeFork, age: number): ForkSegment | undefined {
  return fork.segments.find((s) => age >= s.ageStart && age <= s.ageEnd)
}

// ---- 主入口 -----------------------------------------------------------

/**
 * 演化一条 fork 路径, 输出 horizon 内每一年的指标快照.
 * 纯函数:相同输入 → 相同输出.
 */
export function simulateFork(
  baseline: LifeState,
  fork: LifeFork,
  horizonYears: number,
): ForkTimeline {
  const startAge = baseline.age
  const safeHorizon = Math.max(
    1,
    Math.min(horizonYears, MAX_AGE - startAge + 1),
  )

  let metrics: MetricVector = { ...baseline.metrics }
  const years: YearlySnapshot[] = []

  for (let i = 0; i < safeHorizon; i++) {
    const age = startAge + i
    const seg = segmentAt(fork, age)

    // 段起点这一年触发一次性事件.
    if (seg && seg.oneOff && age === seg.ageStart) {
      metrics = addDelta(metrics, seg.oneOff)
    }
    // 每年增量.
    if (seg && seg.perYear) {
      metrics = addDelta(metrics, seg.perYear)
    }

    // 上限/下限裁剪 + 计算与上一年的实际 delta(裁剪后).
    const prev = years.length > 0 ? years[years.length - 1].metrics : baseline.metrics
    const clamped: MetricVector = {
      wealth: clamp(metrics.wealth),
      identity: clamp(metrics.identity),
      education: clamp(metrics.education),
      body: clamp(metrics.body),
    }
    metrics = clamped

    years.push({
      age,
      metrics: { ...clamped },
      delta: diffVector(clamped, prev),
    })
  }

  return {
    forkId: fork.id,
    forkName: fork.name,
    years,
  }
}

/**
 * 计算一条 fork 相对基线 fork 的机会成本.
 * 两条 timeline 必须长度一致, 否则按较短长度截断.
 */
export function computeOpportunityCost(
  fork: ForkTimeline,
  baseline: ForkTimeline,
): OpportunityCost {
  const len = Math.min(fork.years.length, baseline.years.length)
  const perYear: { age: number; diff: MetricVector }[] = []
  const cumulative = zeroVector()

  for (let i = 0; i < len; i++) {
    const f = fork.years[i]
    const b = baseline.years[i]
    const diff = diffVector(f.metrics, b.metrics)
    perYear.push({ age: f.age, diff })
    cumulative.wealth += diff.wealth
    cumulative.identity += diff.identity
    cumulative.education += diff.education
    cumulative.body += diff.body
  }

  const denom = Math.max(len, 1)
  const annualized: MetricVector = {
    wealth: cumulative.wealth / denom,
    identity: cumulative.identity / denom,
    education: cumulative.education / denom,
    body: cumulative.body / denom,
  }

  return {
    forkId: fork.forkId,
    baselineForkId: baseline.forkId,
    perYear,
    cumulative,
    annualized,
  }
}

/**
 * 一次性跑完所有 fork, 返回每条 timeline 与每条 fork 相对 forks[0] 的机会成本.
 */
export function simulateForks(input: SimulateInput): SimulateResult {
  if (!input.forks || input.forks.length < 2) {
    throw new Error('simulateForks: 至少需要 2 条 forks(forks[0] 作为机会成本基线)')
  }
  const horizonYears = Math.max(1, Math.min(input.horizonYears, MAX_AGE - input.baseline.age + 1))

  const timelines: Record<ForkId, ForkTimeline> = {}
  for (const f of input.forks) {
    timelines[f.id] = simulateFork(input.baseline, f, horizonYears)
  }

  const baselineTimeline = timelines[input.forks[0].id]
  const opportunityCost: Record<ForkId, OpportunityCost> = {}
  for (const f of input.forks) {
    opportunityCost[f.id] = computeOpportunityCost(
      timelines[f.id],
      baselineTimeline,
    )
  }

  return {
    baseline: input.baseline,
    horizonYears,
    timelines,
    opportunityCost,
  }
}

// ---- 内部导出, 仅给 unit test / 调试 -------------------------------

export const __internal = {
  clamp,
  zeroVector,
  addDelta,
  diffVector,
  segmentAt,
  METRIC_MIN,
  METRIC_MAX,
  MAX_AGE,
}
