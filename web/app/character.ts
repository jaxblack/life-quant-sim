// 角色外观数据 (与渲染引擎解耦).
// 之前内联在 page.tsx，现抽出为共享模块，供 page.tsx 与 PixiCharacter (WebGL) 共用。
// 7 个阶段(childhood/adolescence/early_adult/adult_30s/mid_adult/late_adult/old_age)
// 各给出身高比例、服装/裤子/头发/肤色、嘴形、姿态、走路节奏与配饰。
export type CharacterAccessory =
  | 'none'
  | 'school'
  | 'school_tie'
  | 'headphones'
  | 'tie'
  | 'briefcase'
  | 'cane'
  | 'cane_glasses'
export type Mouth = 'big-smile' | 'smile' | 'calm' | 'firm' | 'soft-down'
export type Posture = 'upright' | 'leaning-fwd' | 'stooped' | 'bouncy'
export type HairStyle = 'pony-twin' | 'short' | 'medium' | 'thinning' | 'bald-top' | 'bald'
export type CharacterAppearance = {
  heightScale: number // 0.55 童年 → 1.0 青/成年 → 0.95 中年 → 0.85 高龄
  outfitFill: string
  outfitStroke: string
  outfitFillLight: string // 衣服渐变亮色
  outfitFillDark: string // 衣服渐变暗色
  legFill: string // 裤子颜色
  hairFill: string
  hairHighlight: string // 发丝高光
  hairStyle: HairStyle
  skinFill: string
  skinShade: string
  mouth: Mouth
  posture: Posture
  walkSpeedSec: number // 走路周期 (横向往返一次)
  bobSpeedSec: number // 步频
  bobAmpPx: number // 弹跳幅度
  paunch: boolean // 中年微肚
  accessory: CharacterAccessory
  caption: string
}

export const CHARACTER_BY_STAGE: Record<string, CharacterAppearance> = {
  childhood: {
    heightScale: 0.55,
    outfitFill: '#fbbf24', outfitStroke: '#b45309',
    outfitFillLight: '#fef3c7', outfitFillDark: '#f59e0b',
    legFill: '#1d4ed8',
    hairFill: '#1f2937', hairHighlight: '#374151',
    hairStyle: 'pony-twin',
    skinFill: '#fde7c4', skinShade: '#f1c596',
    mouth: 'big-smile', posture: 'bouncy',
    walkSpeedSec: 6.5, bobSpeedSec: 0.7, bobAmpPx: 4,
    paunch: false,
    accessory: 'school',
    caption: '小学生背包',
  },
  adolescence: {
    heightScale: 0.78,
    outfitFill: '#1d4ed8', outfitStroke: '#1e3a8a',
    outfitFillLight: '#3b82f6', outfitFillDark: '#1d4ed8',
    legFill: '#1e3a8a',
    hairFill: '#0f172a', hairHighlight: '#1f2937',
    hairStyle: 'medium',
    skinFill: '#fde7c4', skinShade: '#f1c596',
    mouth: 'smile', posture: 'upright',
    walkSpeedSec: 7.5, bobSpeedSec: 0.8, bobAmpPx: 3,
    paunch: false,
    accessory: 'school_tie',
    caption: '中学校服',
  },
  early_adult: {
    heightScale: 1.0,
    outfitFill: '#0ea5e9', outfitStroke: '#0369a1',
    outfitFillLight: '#38bdf8', outfitFillDark: '#0284c7',
    legFill: '#1e293b',
    hairFill: '#0f172a', hairHighlight: '#374151',
    hairStyle: 'short',
    skinFill: '#fde7c4', skinShade: '#f1c596',
    mouth: 'smile', posture: 'upright',
    walkSpeedSec: 8.0, bobSpeedSec: 0.85, bobAmpPx: 2.5,
    paunch: false,
    accessory: 'headphones',
    caption: 'T 恤 + 牛仔 + 耳机',
  },
  adult_30s: {
    heightScale: 1.0,
    outfitFill: '#1f2937', outfitStroke: '#0f172a',
    outfitFillLight: '#334155', outfitFillDark: '#0f172a',
    legFill: '#0f172a',
    hairFill: '#0f172a', hairHighlight: '#1f2937',
    hairStyle: 'short',
    skinFill: '#fde7c4', skinShade: '#e5b591',
    mouth: 'firm', posture: 'leaning-fwd',
    walkSpeedSec: 7.0, bobSpeedSec: 0.78, bobAmpPx: 2.2,
    paunch: false,
    accessory: 'briefcase',
    caption: '通勤西装 + 公文包',
  },
  mid_adult: {
    heightScale: 0.96,
    outfitFill: '#475569', outfitStroke: '#1e293b',
    outfitFillLight: '#64748b', outfitFillDark: '#334155',
    legFill: '#1e293b',
    hairFill: '#94a3b8', hairHighlight: '#cbd5e1',
    hairStyle: 'thinning',
    skinFill: '#fbe1c0', skinShade: '#d4a07a',
    mouth: 'calm', posture: 'upright',
    walkSpeedSec: 8.5, bobSpeedSec: 0.9, bobAmpPx: 2,
    paunch: true,
    accessory: 'tie',
    caption: '中年组长颜',
  },
  late_adult: {
    heightScale: 0.92,
    outfitFill: '#7c3aed', outfitStroke: '#4c1d95',
    outfitFillLight: '#a78bfa', outfitFillDark: '#7c3aed',
    legFill: '#1f2937',
    hairFill: '#cbd5e1', hairHighlight: '#e2e8f0',
    hairStyle: 'thinning',
    skinFill: '#f5d4ad', skinShade: '#c89066',
    mouth: 'calm', posture: 'upright',
    walkSpeedSec: 9.5, bobSpeedSec: 1.0, bobAmpPx: 1.6,
    paunch: true,
    accessory: 'cane',
    caption: '退休休闲装',
  },
  old_age: {
    heightScale: 0.85,
    outfitFill: '#9ca3af', outfitStroke: '#4b5563',
    outfitFillLight: '#cbd5e1', outfitFillDark: '#94a3b8',
    legFill: '#475569',
    hairFill: '#e5e7eb', hairHighlight: '#f1f5f9',
    hairStyle: 'bald-top',
    skinFill: '#ecd2ad', skinShade: '#b8845b',
    mouth: 'soft-down', posture: 'stooped',
    walkSpeedSec: 11.5, bobSpeedSec: 1.2, bobAmpPx: 1.2,
    paunch: false,
    accessory: 'cane_glasses',
    caption: '高龄助行',
  },
}

export function appearanceForStageId(id: string): CharacterAppearance {
  return CHARACTER_BY_STAGE[id] ?? CHARACTER_BY_STAGE.early_adult
}

// 家境层级：驱动人物服饰的"贵气/朴素"档位（与阶段服装叠加）。
//   wealthy 富裕 → 金边西装 / 胸袋巾 / 腕表 / 锃亮皮鞋
//   middle  中产 → 干净得体，无额外装饰
//   working 工薪 → 朴素低饱和
//   poor    贫困 → 衣物补丁 / 素简
export type WealthTier = 'wealthy' | 'middle' | 'working' | 'poor'

// 出身家庭 id → 家境层级（单亲并入工薪、留守并入贫困，仅就服饰观感而言）。
export function wealthTierForFamilyId(id: string): WealthTier {
  switch (id) {
    case 'wealthy':
      return 'wealthy'
    case 'middle':
      return 'middle'
    case 'working':
    case 'single':
      return 'working'
    case 'poor':
    case 'leftbehind':
      return 'poor'
    default:
      return 'middle'
  }
}
