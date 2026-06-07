// 最小端到端 TS 版生命模拟器。
// 设计目标：在核心模型（engine/life_sim.py）尚未被前端打包消费的阶段，
// 提供一个名字 / 形状与 Python 引擎一致的本地 fallback：
//   InitialConditions / LifeOutcome 字段命名严格保持一致；
//   simulate(ic, branch) 返回的 LifeOutcome 中包含
//     total_money_value / total_social_value / self_meaning /
//     healthy_lifespan / network_density 五个长期指标，
// 后续接入 Python 引擎（编译为 WASM / 服务端调用）时只需替换实现，
// 调用方 / UI 层无须改动。
//
// 不在此处做：随机事件抽样、Big Five 高维互动、政策约束；
// 这些都留给真正的 engine 模块。

export type BigFive = {
  openness: number
  conscientiousness: number
  extraversion: number
  agreeableness: number
  neuroticism: number
}

export type InitialConditions = {
  family_ses: number // 0..1
  birth_region: string // tier1 / tier2 / tier34 / county / rural / overseas
  big_five: BigFive
  health_baseline: number // 0..1
  luck_seed: number
}

export type LifeOutcome = {
  total_money_value: number
  total_social_value: number
  self_meaning: number
  healthy_lifespan: number
  network_density: number
}

// 分叉路径（BranchDecision）：
// 一个能在 0-100 整段生命周期上施加"年化加成系数"的策略包。
// 现实中这些系数应来自更细粒度的事件抽样（engine 真接入后），
// 这里以 *年化乘子* 形式简化，便于多分叉横向对比时数值稳定。
export type BranchDecision = {
  id: string
  name: string
  description: string
  money_mult?: number
  social_mult?: number
  meaning_mult?: number
  health_mult?: number
}

// Mulberry32 确定性 PRNG，避免 Math.random 让 demo 结果不可复现。
function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 与 engine/life_sim.py 的 _STAGES 切分保持一致。
function stageOf(age: number): string {
  if (age <= 12) return 'childhood'
  if (age <= 19) return 'adolescence'
  if (age <= 39) return 'early_adult'
  if (age <= 59) return 'mid_adult'
  if (age <= 79) return 'late_adult'
  return 'old_age'
}

// 单生命周期模拟：0..100 岁逐年累积四维状态，最终汇总成 LifeOutcome。
export function simulate(
  ic: InitialConditions,
  branch: BranchDecision
): LifeOutcome {
  const rng = makeRng(ic.luck_seed)
  // 起步资本：SES * 100；起步精力：health_baseline。
  let money = ic.family_ses * 100
  let social = 0
  let meaning = 0
  let energy = ic.health_baseline
  let healthyYears = 0

  const moneyMult = branch.money_mult ?? 1.0
  const socialMult = branch.social_mult ?? 1.0
  const meaningMult = branch.meaning_mult ?? 1.0
  const healthMult = branch.health_mult ?? 1.0

  const bf = ic.big_five
  // 0.5..1.5：把 0..1 的人格特质映射成乘性调制因子。
  const cMod = 0.5 + bf.conscientiousness
  const eMod = 0.5 + bf.extraversion
  const oMod = 0.5 + bf.openness
  const nMod = 0.5 + (1 - bf.neuroticism)

  for (let age = 0; age <= 100; age++) {
    const stage = stageOf(age)
    // 年化基线增量：青年-中年是主要积累窗口，晚年净流出。
    let mGain = 0
    let sGain = 0
    let meGain = 0
    let eGain = 0
    if (stage === 'childhood') {
      mGain = 0.4
      sGain = 0.6
      meGain = 0.3
      eGain = 0.005
    } else if (stage === 'adolescence') {
      mGain = 0.8
      sGain = 1.0
      meGain = 0.5
      eGain = 0.003
    } else if (stage === 'early_adult') {
      mGain = 5.0
      sGain = 2.5
      meGain = 1.2
      eGain = -0.002
    } else if (stage === 'mid_adult') {
      mGain = 6.0
      sGain = 1.5
      meGain = 1.5
      eGain = -0.008
    } else if (stage === 'late_adult') {
      mGain = 1.5
      sGain = 0.5
      meGain = 0.8
      eGain = -0.015
    } else {
      mGain = 0.2
      sGain = 0.2
      meGain = 0.5
      eGain = -0.025
    }

    // 噪声：±10% 抖动，让两条分叉的同维度差值不会完全等同。
    money += mGain * moneyMult * cMod * (0.9 + 0.2 * rng())
    social += sGain * socialMult * eMod * (0.9 + 0.2 * rng())
    meaning += meGain * meaningMult * oMod * (0.9 + 0.2 * rng())
    energy = Math.max(0, energy + eGain * healthMult * nMod)

    if (energy >= 0.5) healthyYears++
  }

  return {
    total_money_value: money,
    total_social_value: social,
    self_meaning: meaning,
    healthy_lifespan: healthyYears,
    network_density: Math.max(0, Math.min(1, social / 200)),
  }
}

// region / family 到 InitialConditions 的轻量映射，与 /sim/ 页面 REGIONS / FAMILIES 对齐。
const REGION_HEALTH: Record<string, number> = {
  tier1: 0.85,
  tier2: 0.85,
  tier34: 0.8,
  county: 0.78,
  rural: 0.75,
  overseas: 0.85,
}
const FAMILY_SES: Record<string, number> = {
  wealthy: 1.0,
  middle: 0.6,
  working: 0.4,
  poor: 0.2,
  single: 0.4,
  leftbehind: 0.25,
}

export function buildInitialConditions(opts: {
  regionId: string
  familyId: string
  age: number
}): InitialConditions {
  const ses = FAMILY_SES[opts.familyId] ?? 0.5
  const health = REGION_HEALTH[opts.regionId] ?? 0.8
  return {
    family_ses: ses,
    birth_region: opts.regionId,
    big_five: {
      openness: 0.5,
      conscientiousness: 0.5,
      extraversion: 0.5,
      agreeableness: 0.5,
      neuroticism: 0.5,
    },
    health_baseline: health,
    luck_seed: hashSeed(`${opts.regionId}:${opts.familyId}:${opts.age}`),
  }
}

// FNV-1a 32-bit hash，仅用于把 (region, family, age) 转为稳定 seed。
function hashSeed(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// /sim/ 页面"机会成本模拟"默认提供的示例分叉。
// 至少两条，且每条 LifeOutcome 之间必须出现可观测差异，
// 这样用户看完区块就能直观体验"分叉 → 长期差值向量"。
export const DEFAULT_BRANCHES: BranchDecision[] = [
  {
    id: 'aggressive_career',
    name: '事业 All-in',
    description:
      '青年-中年期最大化职业资本：长工时、跳槽 / 创业激进，主动堆叠应届 / 移民 / 晋升窗口。',
    money_mult: 1.35,
    social_mult: 0.9,
    meaning_mult: 0.95,
    health_mult: 1.15,
  },
  {
    id: 'balanced',
    name: '稳健中庸',
    description:
      '保留升学 / 事业基线，同步投入长期亲密关系与社群人脉，体能维护以中等运动量为主。',
    money_mult: 1.0,
    social_mult: 1.0,
    meaning_mult: 1.0,
    health_mult: 1.0,
  },
  {
    id: 'meaning_first',
    name: '关系与意义优先',
    description:
      '主动收敛事业野心，把额外预算投入长期关系经营、子女陪伴、意义感探索（艺术 / 社区 / 公益）。',
    money_mult: 0.78,
    social_mult: 1.25,
    meaning_mult: 1.4,
    health_mult: 0.85,
  },
]
