'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import PixiCharacter from '../components/PixiCharacter'
import { appearanceForStageId, wealthTierForFamilyId } from './character'

type LifeStage = {
  id: string
  name: string
  ageStart: number
  ageEnd: number
  growth: string
  education: string
  career: string
  psychology: string
  // 关键人生事件：该阶段最具代表性的几类"必须做出选择"的人生节点。
  // 用于在阶段卡片中提示用户：哪些事件天然挤在这个年龄段、错过 / 提前都意味着重大路径切换。
  keyEvents: string[]
}

// 7 个阶段覆盖 0-100 岁全程：童年 / 少年 / 青年(20-29) / 成年(30-39) / 中年(40-59) / 晚年早期 / 高龄。
// 之前的版本将 20-39 整段都叫"青年"，跨度 20 年内涵差异极大；
// 30 岁前后的人生议题（首次买房 / 生育决策 / 35 岁焦虑）实际属于"成年"段，已独立成阶段。
const STAGES: LifeStage[] = [
  {
    id: 'childhood',
    name: '童年',
    ageStart: 0,
    ageEnd: 12,
    growth: '身体快速发育，依恋关系与基础体能形成。',
    education: '学前 → 小学：识字、规则感、同伴关系起步。',
    career: '尚无职业概念，兴趣与好奇心是早期"职业种子"。',
    psychology: '安全感、信任感的关键期；自尊雏形开始建立。',
    keyEvents: [
      '出生 / 上户 / 疫苗接种节奏',
      '入园 / 入学：第一次系统性社会化',
      '艺术 / 体育童子功是否启动（钢琴、绘画、体校）',
      '隔代抚养或留守：依恋对象是否稳定',
    ],
  },
  {
    id: 'adolescence',
    name: '少年',
    ageStart: 13,
    ageEnd: 19,
    growth: '青春期身体剧变，性别意识与自我形象重构。',
    education: '初中 → 高中 → 高考：抽象思维与考试压力同步上升。',
    career: '兴趣分化、职业幻想期；首次面临生涯方向选择。',
    psychology: '身份探索 vs 角色混乱；情绪波动大，自我同一性形成。',
    keyEvents: [
      '中考 / 高考分流：升学路径、文理分科或职高',
      '第一段同伴关系 / 初恋（仅长期关系经验，不评估外貌）',
      '是否离家求学（住校 / 异地 / 留学）',
      '兴趣是否升级为专业方向（艺考、体校、竞赛保送）',
    ],
  },
  {
    id: 'early_adult',
    name: '青年',
    ageStart: 20,
    ageEnd: 29,
    growth: '体能与认知巅峰；建立独立的生活方式。',
    education: '大学 → 研究生 / 入职培训；学习方式从被动转为自驱。',
    career: '应届身份用一次：校招、考公、考研或出国，决定行业入口。',
    psychology: '亲密关系、自我效能与意义感同时上线，从"被照顾者"转为"自我负责者"。',
    keyEvents: [
      '本科 / 硕士毕业：应届身份与首份工作的城市选择',
      '考公 / 考编 / 考研 / 出国 / 创业：首次职业方向锁定',
      '初次同居或长期亲密关系开始',
      '是否在出生城市之外建立生活基地（户口 / 租房 / 买首套）',
    ],
  },
  {
    id: 'adult_30s',
    name: '成年',
    ageStart: 30,
    ageEnd: 39,
    growth: '体能从峰值缓步回落，恢复速度下降，生活习惯开始决定中年斜率。',
    education: '在岗深造、跳槽、读博 / MBA；学习目标从"积累"转向"转型"。',
    career: '专业资本与人脉成型期；首次晋升与"35 岁焦虑"在此阶段叠加出现。',
    psychology: '亲密关系定型、生育决策、与原生家庭重新校准；身份从"年轻人"过渡到"中坚"。',
    keyEvents: [
      '婚姻 / 长期伴侣关系登记或解除',
      '生育决策（一胎 / 二胎 / 不育）与生育力窗口',
      '首次中层晋升或主动跳槽，部分人面临 35 岁裁员风险',
      '首套或改善型住房决策；父母进入慢病期，赡养议题首次落地',
    ],
  },
  {
    id: 'mid_adult',
    name: '中年',
    ageStart: 40,
    ageEnd: 59,
    growth: '体能逐步下滑，慢病风险上升，外貌变化明显。',
    education: '终身学习、行业再学习、为孩子的教育做规划。',
    career: '职业平台期或巅峰；管理岗位、再创业或转型抉择。',
    psychology: '中年危机、意义重审；上有老下有小的多线压力。',
    keyEvents: [
      '40+ 中层瓶颈：晋升、转型或被裁的三岔路',
      '父母重大医疗事件（住院 / 手术 / 失能）首次出现',
      '子女中考 / 高考 / 升学路径与教育资源迁移',
      '婚姻中段调整：分居、离婚或主动维护亲密关系',
    ],
  },
  {
    id: 'late_adult',
    name: '晚年早期',
    ageStart: 60,
    ageEnd: 79,
    growth: '退休后生活节奏重塑；慢病管理成为日常。',
    education: '老年大学、兴趣班；以自我滋养为目的的学习。',
    career: '退休 / 返聘 / 个人兴趣事业；从职位身份转向"做自己"。',
    psychology: '生命回顾、传承感；与孙辈关系是重要情感来源。',
    keyEvents: [
      '正式退休 / 提前退休 / 返聘：身份过渡与社保金启用',
      '抱孙辈 / 隔代抚育是否承担',
      '配偶或同辈挚友首次离世带来的累积性丧失',
      '资产从增值期转入保值期，开始系统规划遗产与传承',
    ],
  },
  {
    id: 'old_age',
    name: '高龄',
    ageStart: 80,
    ageEnd: 100,
    growth: '身体显著衰退，需要更多日常照护。',
    education: '从学习者转为"故事讲述者"；经验沉淀成家庭叙事。',
    career: '基本退出生产性劳动，更多扮演家族精神支柱。',
    psychology: '人生整合 vs 绝望；与时间和解，面向终点的从容。',
    keyEvents: [
      '失能 / 失智照护是否启动（家庭照护 vs 机构）',
      '丧偶后独居或与子女合住的居住安排',
      '医疗预嘱 / 临终意愿的表达与执行',
      '家族叙事的口述传承（家庭故事讲述者角色）',
    ],
  },
]

const STAGE_COLORS = ['#fde68a', '#fca5a5', '#86efac', '#93c5fd', '#c4b5fd', '#f9a8d4']

// ----------------------- 人物成长动画 -----------------------
// 角色外观数据已抽到 ./character (供 page.tsx 与 WebGL 渲染共用)。
// 走路 / 成长动画改由 PixiJS (WebGL) 渲染，见 components/PixiCharacter。

// 阶段角色舞台: 背景 / 地面用 CSS 渲染, 人物走路 / 成长动画交给 WebGL (PixiCharacter).
function CharacterStage({ stageId, age, progress, stageName, regionName, familyName, familyId }: { stageId: string; age: number; progress: number; stageName: string; regionName: string; familyName: string; familyId: string }) {
  const a = appearanceForStageId(stageId)
  const tier = wealthTierForFamilyId(familyId)
  // 姿态补助 class: stooped 高龄、bouncy 童年。 leaning-fwd / upright 不额外加 class.
  const poseClass =
    a.posture === 'stooped' ? 'lqs-pose-stooped' :
    a.posture === 'bouncy'  ? 'lqs-pose-bouncy'  : ''
  return (
    <div
      className={`lqs-character-stage lqs-stage-transition ${poseClass}`}
      key={stageId}
    >
      <div className="lqs-character-caption">{age} 岁 · {stageName} · {a.caption}</div>
      <div className="lqs-character-ground" />
      <PixiCharacter
        a={a}
        progress={progress}
        tier={tier}
        ariaLabel={`在 ${regionName} 出生、来自 ${familyName}, ${age} 岁 · ${stageName} 阶段的小人沿时间轴行走动画: ${a.caption}`}
      />
    </div>
  )
}

type RegionId =
  | 'tier1'
  | 'tier2'
  | 'tier34'
  | 'county'
  | 'rural'
  | 'overseas_us'
  | 'overseas_ca'
  | 'overseas_sg'
  | 'overseas_my'
  | 'overseas_au'
  | 'overseas_uk'

type Region = { id: RegionId; name: string; brief: string }
type Family = { id: string; name: string; brief: string }

const REGIONS: Region[] = [
  { id: 'tier1', name: '一线城市', brief: '资源密度最高，竞争与机会同时拉满。' },
  { id: 'tier2', name: '省会 / 新一线', brief: '机会丰富，生活成本相对一线更低，性价比之地。' },
  { id: 'tier34', name: '三四线城市', brief: '节奏稳定，发展机会与天花板均偏低。' },
  { id: 'county', name: '县城 / 乡镇', brief: '熟人社会，关系链强，但圈层流动通常需要离开。' },
  { id: 'rural', name: '农村', brief: '与土地紧密相连，教育与医疗资源相对稀缺。' },
  { id: 'overseas_us', name: '美国（华人）', brief: '顶尖高校与行业机会多，竞争极强；身份与签证不确定性高。' },
  { id: 'overseas_ca', name: '加拿大（华人）', brief: '移民通道相对清晰，生活稳定；职业天花板与税负需要权衡。' },
  { id: 'overseas_sg', name: '新加坡（华人）', brief: '华语环境友好、治安与秩序佳；节奏快、住房与教育压力高。' },
  { id: 'overseas_my', name: '马来西亚（华人）', brief: '华文生态成熟、生活成本友好；高薪岗位密度与国际跳板需规划。' },
  { id: 'overseas_au', name: '澳大利亚（华人）', brief: '教育与生活质量高；移民政策与职业评估对年龄较敏感。' },
  { id: 'overseas_uk', name: '英国（华人）', brief: '教育资源密集、金融与创意行业机会多；长期身份与税务成本需评估。' },
]

const FAMILIES: Family[] = [
  { id: 'wealthy', name: '富裕家庭', brief: '资本充足，决策自由度最高，主要风险是"温室效应"。' },
  { id: 'middle', name: '中产家庭', brief: '双职工小康，重视教育与稳定，对下行风险敏感。' },
  { id: 'working', name: '工薪家庭', brief: '勤恳节俭，鼓励读书改命，机会集中在升学/考公/进大厂。' },
  { id: 'poor', name: '贫困家庭', brief: '资源极度有限，韧性与时机比天赋更决定走向。' },
  { id: 'single', name: '单亲家庭', brief: '情感纽带可能更紧密，但经济与照护压力较集中。' },
  { id: 'leftbehind', name: '留守儿童家庭', brief: '父母在外打工，隔代抚养，依恋与教育需要补课。' },
]

function stageOfAge(age: number): LifeStage {
  // 取 ageStart 不超过当前年龄的最后一个阶段。
  // 这样小数年龄（自动播放时）落在整数边界的"缝隙"里也能正确归属，
  // 不会因为 age <= ageEnd 不满足而回退到最后一个阶段（高龄）。
  let matched = STAGES[0]
  for (const s of STAGES) {
    if (age >= s.ageStart) matched = s
    else break
  }
  return matched
}

// 个人天赋分类：用于筛选"该天赋下最该抓住的人生窗口"。
// 仅作为"哪些机会窗口对你结构性更重要"的过滤器，不做天赋值评估。
type Talent =
  | 'sports'
  | 'arts'
  | 'academic'
  | 'social'
  | 'expression'
  | 'discipline'
  | 'tech_esports'
  | 'business'

const TALENTS: { id: Talent; name: string }[] = [
  { id: 'sports', name: '运动' },
  { id: 'arts', name: '艺术' },
  { id: 'academic', name: '学业' },
  { id: 'social', name: '社交' },
  { id: 'expression', name: '外貌 / 表达' },
  { id: 'discipline', name: '纪律 / 体制' },
  { id: 'tech_esports', name: '技术 / 电竞' },
  { id: 'business', name: '商业' },
]

// 教养氛围过滤：与“出身家庭”正交的二级类别。
// 之前以“农村 / 县城 / 城市中产 / 富裕家庭”作为过滤项，与“出身家庭”语义大量重合（富裕家庭两边都出）。
// 现重新定义为"教养氛围"：描述父母与子女的互动风格（权威 / 民主 / 放任 / 疏离 / 隔代），
// 与家庭经济资源状况独立。从而与“出身家庭”不再语义重叠。
type FamilyBackground = 'authoritative' | 'democratic' | 'permissive' | 'distant' | 'multigen'

const FAMILY_BACKGROUNDS: { id: FamilyBackground; name: string; brief: string; familyIds: string[] }[] = [
  // 民主型家庭多出现于中产、部分富裕家庭；氟围开明、鼓励发表、重视边界。
  { id: 'democratic', name: '民主开明', brief: '鼓励表达与边界意识，子女发言权高；多出现在中产与部分富裕家庭。', familyIds: ['middle', 'wealthy'] },
  // 权威型：家长说了算、学业驱动；在工薪、中产、部分贫困中都可能出现。
  { id: 'authoritative', name: '权威驱动', brief: '学业 / 规则优先，家长拍板、股励低；常见于工薪、中产、部分贫困家庭。', familyIds: ['working', 'middle', 'poor'] },
  // 放任 / 温室型：以情感补偿代替边界设定；在富裕、单亲中都可能出现。
  { id: 'permissive', name: '宽松补偿', brief: '以情感与资源补偿代替边界；常见于富裕家庭、单亲家庭。', familyIds: ['wealthy', 'single'] },
  // 疏离 / 冷漠型：情感表达较少、互动频率低。
  { id: 'distant', name: '疏离冷漠', brief: '情感表达与互动频率较低，家庭话题以讲事实为主；跨不同经济阶层出现。', familyIds: ['working', 'middle', 'poor', 'single'] },
  // 隔代 / 分住型：祖辈为主要报顾者，父母远在。
  { id: 'multigen', name: '隔代分住', brief: '以祖辈为主要照顾者，父母远在或仅负责汇款；多为留守 / 务工家庭。', familyIds: ['leftbehind', 'poor'] },
]

type FamilyBgEffect = {
  education: number
  identity: number
  body: number
  wealth: number
  focus: string
}

const FAMILY_BG_EFFECTS: Record<FamilyBackground, FamilyBgEffect> = {
  democratic: {
    education: 3,
    identity: 2,
    body: 1,
    wealth: 0,
    focus: '沟通与自主决策强，学业与社交协同更好。',
  },
  authoritative: {
    education: 2,
    identity: -1,
    body: 0,
    wealth: 1,
    focus: '执行力与规则感强，短期成绩更稳但表达弹性偏低。',
  },
  permissive: {
    education: -2,
    identity: 1,
    body: -1,
    wealth: 0,
    focus: '情感支持高但边界弱，长期自律成本更高。',
  },
  distant: {
    education: -2,
    identity: -2,
    body: -1,
    wealth: 0,
    focus: '陪伴密度不足，亲密关系与稳定学习习惯建立更慢。',
  },
  multigen: {
    education: -1,
    identity: -1,
    body: 1,
    wealth: -1,
    focus: '照护连续性较好，但代际教育资源与决策协同偏弱。',
  },
}

const REGION_IDENTITY_BASE: Record<RegionId, number> = {
  tier1: 85,
  tier2: 65,
  tier34: 45,
  county: 30,
  rural: 18,
  overseas_us: 74,
  overseas_ca: 72,
  overseas_sg: 78,
  overseas_my: 61,
  overseas_au: 70,
  overseas_uk: 73,
}

const REGION_IDENTITY_HINT: Record<RegionId, string> = {
  tier1: '一线城市身份 / 高资源密度',
  tier2: '新一线身份 / 资源中上',
  tier34: '三四线身份 / 资源中等',
  county: '县城身份 / 依赖熟人网络',
  rural: '农村身份 / 跨阶层需要离开',
  overseas_us: '美国华人身份 / 高机会高签证风险',
  overseas_ca: '加拿大华人身份 / 稳定路径与税负并存',
  overseas_sg: '新加坡华人身份 / 高密度机会高成本',
  overseas_my: '马来西亚华人身份 / 华文生态友好',
  overseas_au: '澳洲华人身份 / 生活质量高、评估严格',
  overseas_uk: '英国华人身份 / 教育金融资源密集',
}

// 人生窗口的领域线：用于"感情线 / 事业线"切换
// 'love' = 感情线（婚恋 / 亲密关系），'career' = 事业线（学业 / 职业 / 移民 / 资产）
// 'both' = 两条线都要展示的窗口（如生育/家庭，事业与亲密关系都受影响）
type Track = 'love' | 'career' | 'both'

// 当前阶段即将错过的人生窗口（OpportunityWindow）。
// 每条窗口标注关联的"个人天赋"，便于按天赋筛选当下最该抓住的机会成本。
// 文案约束：
//  - 涉及亲密关系（如初恋）仅描述长期关系经验与机会成本，不写性化未成年人内容。
//  - 涉及未成年人训练 / 表演路径，仅描述技能 / 选材窗口与代价，不做外貌物化或群体标签。
// 子分支领域: 教育 / 迁移 / 职业 / 资产 / 健康 / 家庭。
// 仅作渲染色标与过滤用, 不参与状态判断逻辑。
type SubBranchDomain = 'education' | 'migration' | 'career' | 'asset' | 'health' | 'family'

// 子分支: 主分叉展开后看到的"下一层窗口提示"。
type SubBranch = {
  label: string
  longTermLoss?: string
  domain?: SubBranchDomain
}

// 分叉可是纯字符串(老行为, 不可点击展开),
// 也可是带子分支的对象(点击展开下一层)。
type WindowBranchObject = {
  id: string
  label: string
  next?: SubBranch[]
}
type WindowBranch = string | WindowBranchObject

function isBranchObject(b: WindowBranch): b is WindowBranchObject {
  return typeof b === 'object' && b !== null && 'id' in b && 'label' in b
}

type OpportunityWindow = {
  id: string
  title: string
  ageStart: number
  ageEnd: number
  talents: Talent[]
  talentMode?: 'any' | 'all'
  track: Track // 感情线 / 事业线 / 两者都涉及
  regions?: RegionId[]
  familyBackgrounds?: FamilyBackground[]
  branches: WindowBranch[] // 候选分岔（≥3）；对象形式可携带 next 子分支
  longTermLoss: string // 错过窗口后的长期机会成本提示
}

const OPPORTUNITY_WINDOWS: OpportunityWindow[] = [
  {
    id: 'art_child_training',
    title: '艺术专业训练（乐器 / 舞蹈 / 绘画）',
    ageStart: 4,
    ageEnd: 15,
    talents: ['arts'],
    track: 'career',
    branches: ['专业童子功路径', '兴趣班 + 校外考级', '主修学业 + 副修艺术', '不投入'],
    longTermLoss:
      '错过这扇门：肌肉记忆 / 听觉敏感期 / 童子功几乎无法在成年后重建，专业级表现的天花板被锁死，长期机会成本沉淀为"业余永远只能业余"。',
  },
  {
    id: 'sports_youth_pipeline',
    title: '体育专业梯队（省队 / 国家队基础期）',
    ageStart: 6,
    ageEnd: 16,
    talents: ['sports'],
    track: 'career',
    branches: ['进体校 / 专业梯队', '校队 + 学业并行', '业余兴趣保持', '完全放弃'],
    longTermLoss:
      '错过这扇门：竞技体育的体能基底与选材窗口几乎无回头路，职业运动员路径基本封死；转项 / 转教练是次优解。',
  },
  {
    id: 'child_performer',
    title: '童星 / 少儿表演培养',
    ageStart: 6,
    ageEnd: 14,
    talents: ['arts', 'expression'],
    track: 'career',
    branches: ['签约童星公司', '校园文艺骨干', '业余兴趣班', '保护性远离镜头'],
    longTermLoss:
      '错过这扇门：早期镜头经验与行业人脉无法在成年后补；但放弃的反面是更完整、不被消费的童年——这是一笔需要家长替孩子代算的机会成本。',
  },
  {
    id: 'esports_pro',
    title: '电竞职业选手窗口',
    ageStart: 13,
    ageEnd: 22,
    talents: ['tech_esports'],
    talentMode: 'all',
    track: 'career',
    branches: ['青训营 / 职业战队', '半职业 + 直播', '业余高分段', '只当娱乐'],
    longTermLoss:
      '错过这扇门：电竞职业的反应速度峰值非常窄（约 16-23 岁），过窗后转主播 / 教练 / 解说是常见的次优路径。',
  },
  {
    id: 'body_peak',
    title: '身体机能峰值（体能 / 反应 / 恢复力）',
    ageStart: 18,
    ageEnd: 30,
    talents: ['sports'],
    track: 'career',
    branches: [
      {
        id: 'high_intensity_base',
        label: '投入高强度训练打底',
        next: [
          { domain: 'health', label: '抗阻训练 → 中老年肌肉储备', longTermLoss: '30 岁前每多一份肌肉量, 60 岁后跌倒/失能风险下降; 错过基底再想补需 2-3 倍训练量.' },
          { domain: 'health', label: '心肺基础 → 慢病窗口推迟', longTermLoss: '最大摄氧量峰值在 25 岁前后定型, 后续每年 ~1% 下滑; 提前打底等于把慢病出现时间整体后移.' },
          { domain: 'health', label: '运动损伤 → 终身慢性疼痛', longTermLoss: '高强度若不配合康复/睡眠, 半月板/腰椎/肩袖损伤可能转为 30 年慢性炎症, 反向拉低生活质量.' },
          { domain: 'family', label: '运动社群 → 婚恋/朋友圈拓宽', longTermLoss: '运动社群是成年后少数还能产生"同地高频接触"的关系网, 错过期则后续社交回到"工作-家"两点一线.' },
        ],
      },
      '维持中等运动量',
      '只做最低保养',
      '完全久坐',
    ],
    longTermLoss:
      '错过这扇门：肌肉量与最大摄氧量的"利息复利"基底没攒下，40 岁后慢病与衰退斜率会更陡，长期医疗与生活质量成本被前置锁定。',
  },
  {
    id: 'first_love',
    title: '初恋 / 长期亲密关系起步',
    ageStart: 17,
    ageEnd: 24,
    talents: ['social', 'expression'],
    track: 'love',
    branches: [
      '认真投入一段长期关系',
      '多段中短期关系积累经验',
      '专注学业 / 事业暂缓',
      '主动不进入',
    ],
    longTermLoss:
      '错过这扇门：建立深度信任与共同记忆的练习期收窄；成年后从零起步"高浓度长期关系"的成本更高，亲密关系学习曲线被压缩。',
  },
  {
    id: 'fresh_grad',
    title: '应届生身份（校招红利）',
    ageStart: 21,
    ageEnd: 26,
    talents: ['academic', 'discipline'],
    track: 'career',
    branches: [
      '头部公司校招 offer',
      '体制内 / 央国企校招岗',
      {
        id: 'study_master_then_use',
        label: '出国 / 读研延迟使用',
        next: [
          { domain: 'education', label: '考上研究生 → 更广职业前景', longTermLoss: '硕士学历可解锁更多体制内/央国企/外企岗位的报名资格, 起点薪资中位数普遍上浮一档.' },
          { domain: 'education', label: '出国读研 + 海外身份起步', longTermLoss: '语言/学校排名/项目地点共同决定毕业落地难度; 选错 STEM/非 STEM 直接影响 OPT/PSW 长度.' },
          { domain: 'education', label: '边工作边在职读研', longTermLoss: '在职硕士在多数体制内系统中只与全日制硕士对等使用一次, 用作转岗/晋升的"砝码"而非"通行证".' },
          { domain: 'career',    label: '应届身份留待二次校招', longTermLoss: '应届身份只能用一次, 二战留作研究生重新使用; 风险是大厂校招配额按年波动, 错峰可能让赛道集体收紧.' },
        ],
      },
      '直接放弃走社招',
    ],
    longTermLoss:
      '错过这扇门：应届身份只用一次，许多大厂 / 央国企 / 选调 / 定向名额仅向应届开放，社招通道在岗位密度与起薪斜率上都不等价。',
  },
  {
    id: 'civil_servant_age',
    title: '公务员 / 选调生报考资格（年龄上限）',
    ageStart: 22,
    ageEnd: 35,
    talents: ['discipline', 'academic'],
    track: 'career',
    branches: ['应届直接考', '工作几年后考', '考选调 / 定向', '完全不进体制'],
    longTermLoss:
      '错过这扇门：国 / 省考通常 35 岁封顶（应届硕博一般放宽至 40），过线后进体制基本只能走人才引进 / 事业编 / 聘任制，路径明显变窄。',
  },
  {
    id: 'career_choice',
    title: '职业选择权 / 转行成本最低期',
    ageStart: 22,
    ageEnd: 32,
    talents: ['academic', 'business', 'tech_esports'],
    track: 'career',
    branches: [
      '一次定型深耕',
      '主动转一次行',
      {
        id: 'cross_disciplinary',
        label: '复合跨界（如技术 + 商业）',
        next: [
          { domain: 'career',    label: '技术骨干 → 产品/解决方案岗', longTermLoss: '从 IC 转半商业岗的最佳窗口在 28-33 岁; 过窗后通常只能内部"转晋升"而非外部直跳.' },
          { domain: 'education', label: '工科本硕 + MBA 组合', longTermLoss: '中欧/长江/Top US MBA 的有效申请年龄多集中在 25-32 岁, 错峰则只能走 EMBA, 校友网密度差一档.' },
          { domain: 'career',    label: '加入早期创业团队做联合创始', longTermLoss: '联创身份在简历与未来融资两端都有杠杆, 但要求接受 1-3 年现金流断档与高离场风险.' },
          { domain: 'health',    label: '维持训练量与精力管理', longTermLoss: '跨界期高压通勤+学习, 不预留运动/睡眠预算容易在 35 岁前透支基础健康.' },
        ],
      },
      '自由职业起步',
    ],
    longTermLoss:
      '错过这扇门：转行的"沉没成本 + 学习曲线 + 薪资断档"三件套随年龄指数上升，35 岁后职业选择权显著收紧。',
  },
  {
    id: 'study_abroad',
    title: '出国深造 / 留学窗口',
    ageStart: 20,
    ageEnd: 32,
    talents: ['academic'],
    track: 'career',
    branches: ['出国读研 + 留下', '出国读研 + 回国', '在地读研', '直接工作'],
    longTermLoss:
      '错过这扇门：身份 / 语言 / 国际网络的"重置期"关闭，30+ 再出去通常只能走工签 / 投资 / 配偶路径，时间与资金成本陡升。',
  },
  {
    id: 'startup_window',
    title: '创业 / 早期 startup 加入窗口',
    ageStart: 22,
    ageEnd: 36,
    talents: ['business', 'tech_esports'],
    track: 'career',
    branches: ['独立创业', '加入早期联合创始团队', '大厂内部孵化', '保持打工'],
    longTermLoss:
      '错过这扇门：体力 + 精力 + 低家庭负担的三角窗口收窄；中年后创业的容错率与社会评价都更苛刻，长尾右尾几乎无法在 40+ 复制。',
  },
  {
    id: 'first_marriage_child',
    title: '初次婚姻 / 一胎生育窗口',
    ageStart: 24,
    ageEnd: 35,
    talents: ['social'],
    track: 'both',
    branches: [
      {
        id: 'family_then_career',
        label: '先成家再立业',
        next: [
          { domain: 'family', label: '一胎 → 二胎间隔规划', longTermLoss: '间隔过近母体恢复风险高, 间隔过远高龄产风险升高; 25-32 岁两胎是医学上较平稳的窗口.' },
          { domain: 'family', label: '父母帮带 vs 配偶共担', longTermLoss: '隔代抚养便宜但易留下分离焦虑/隔代价值观冲突; 配偶共担则要求双方都接受职业斜率短期变缓.' },
          { domain: 'asset',  label: '婚房 + 学区房 → 资产前置', longTermLoss: '生育前置则资产配置整体前移, 后期在事业上升期反而难以追加大额信贷, 现金流弹性下降.' },
          { domain: 'career', label: '产假/育婴假 → 暂缓晋升', longTermLoss: '产育假在多数民企不计入晋升年限, 错过 P 序列大版本则可能被同期同事拉开 2-3 级.' },
        ],
      },
      '先立业后成家',
      '不婚但生育',
      '丁克 / 不育',
    ],
    longTermLoss:
      '错过这扇门：生育力随年龄客观下降，二胎窗口随之收窄；老年期家庭拓扑结构无法再重置，照护与陪伴的资源结构被锁定。',
  },
  {
    id: 'mortgage_leverage',
    title: '房贷 / 信贷杠杆窗口',
    ageStart: 25,
    ageEnd: 45,
    talents: ['business'],
    track: 'career',
    branches: [
      {
        id: 'tier1_high_leverage',
        label: '一线高杠杆买房',
        next: [
          { domain: 'asset',  label: '首套刚需 → 长期持有自住', longTermLoss: '首套利率/契税/限购名额是终身一次性优惠, 错峰再补需重新满足社保/落户年限.' },
          { domain: 'asset',  label: '首付贷 + 经营贷叠加', longTermLoss: '高杠杆放大收益也放大违约风险; 政策一旦收紧(如房贷集中度), 资金链最先暴雷.' },
          { domain: 'family', label: '婚前购房 + 加名规划', longTermLoss: '加名/赠与/公证三选一, 时序错了在离婚或继承时分配规则会完全不同.' },
          { domain: 'career', label: '为还贷被绑定单一城市', longTermLoss: '高月供降低跳槽弹性, 城市/行业切换的机会成本被房贷锁死, 退路依赖次级流动性资产.' },
        ],
      },
      '二三线低杠杆买房',
      '长期租房 + 投资',
      '买地 / 自建',
    ],
    longTermLoss:
      '错过这扇门：银行按揭年限随年龄递减（通常贷款期 + 年龄 ≤ 70），杠杆放大期一旦错过几乎不可重做，地理与资产绑定结构被冻结。',
  },
  {
    id: 'p_to_m',
    title: '技术 / 专业转管理岗（P→M）',
    ageStart: 28,
    ageEnd: 38,
    talents: ['business', 'social'],
    track: 'career',
    branches: ['主动转 M 线', '深耕 P 线做专家', '转去做 PM / 业务负责人', '出来单干'],
    longTermLoss:
      '错过这扇门：35 岁后管理岗供给紧缩，错过本轮窗口大概率终身停留在 IC 序列，组织影响力与薪资上限随之封顶。',
  },
  {
    id: 'academic_tenure',
    title: '学术黄金期（博士 → 博后 → tenure）',
    ageStart: 22,
    ageEnd: 40,
    talents: ['academic'],
    track: 'career',
    branches: ['一路读到 tenure', '读博后转工业界', '硕士止步 + 工业界研究岗', '完全离开学术'],
    longTermLoss:
      '错过这扇门：高校招聘普遍卡 35 / 40 岁与博士毕业年限；过窗后回学术界基本只能走兼职 / 客座 / 产业教授，独立 PI 路径关闭。',
  },
  // —— 感情线补充窗口 ——
  {
    id: 'campus_love',
    title: '校园恋爱（校园环境下的亲密关系试错期）',
    ageStart: 16,
    ageEnd: 23,
    talents: ['social', 'expression'],
    track: 'love',
    branches: ['认真谈一段校园恋爱', '只谈一次轻量恋爱', '只保持近距离友谊', '主动跳过'],
    longTermLoss:
      '错过这扇门：校园环境下"低资源压力 + 高接触密度"的亲密关系试错期不可复制；成年后交友场景均携带职场 / 货币变量，初始信任成本明显上升。',
  },
  {
    id: 'breakup_window',
    title: '错误关系的及时分手窗口',
    ageStart: 22,
    ageEnd: 32,
    talents: ['social'],
    track: 'love',
    branches: ['及时分手重建', '调整法与对方修复', '接受平台期继续', '进入婚姻赌未来'],
    longTermLoss:
      '错过这扇门：错误亲密关系越晚退出，沉没成本（时间 / 财产 / 社交网络 / 生育安排）越重；多数调查显示亲密关系质量与中老年心身健康高度相关。',
  },
  {
    id: 'marriage_commitment',
    title: '婚姻承诺 / 长期伴侣制度化',
    ageStart: 26,
    ageEnd: 38,
    talents: ['social'],
    track: 'love',
    branches: ['传统婚姻进入', '同居但不登记', '跨地两地婚姻', '不进入任何长期伴侣关系'],
    longTermLoss:
      '错过这扇门：婚姻背后的财产合併 / 子女护照 / 医疗代理等制度化保护需要重新设计；进入中老年后重建同量级的社会接受度与制度依托成本明显高于默认路径。',
  },
  {
    id: 'infidelity_risk',
    title: '婚后出轨风险与关系维护窗口',
    ageStart: 30,
    ageEnd: 50,
    talents: ['social'],
    track: 'love',
    branches: ['明确边界主动维护', '伴侣咨询 / 定期复盘', '默认退让不处理', '隐忽冲突走向出轨'],
    longTermLoss:
      '错过这扇门：中年期亲密关系多受事业压力 / 育儿压力 / 生理变化叠加，出轨事件在各国调查中都呈现与社会压力、沟通质量相关；错过主动维护窗口，修复成本随证据累积指数上升。',
  },
  // —— 事业线：移民 / 阶层跨境窗口 ——
  {
    id: 'immigration_canada',
    title: '移民加拿大（Express Entry / 省提名 / 留学转 PR）',
    ageStart: 22,
    ageEnd: 35,
    talents: ['academic', 'business', 'tech_esports'],
    track: 'career',
    regions: ['overseas_ca'],
    branches: [
      {
        id: 'ee_independent',
        label: 'Express Entry 独立申请',
        next: [
          { domain: 'migration', label: '移民海外 → 全球资产配置', longTermLoss: '取得 PR 后可走全球账户/海外房产/跨币种养老金, 需提前规划 CRS 与税务居民身份切换.' },
          { domain: 'asset',     label: '加拿大置业 + RRSP/TFSA 建仓', longTermLoss: 'TFSA/RRSP 上限是按入境年累计, 越早开户终身额度越多; 错过早期年份不可补回.' },
          { domain: 'family',    label: '配偶 + 子女随同登陆', longTermLoss: '随同登陆与单人登陆在加分项与子女学费两端差距巨大, 落地次序错了再补办需要重新走团聚类签证.' },
          { domain: 'career',    label: '直接迁去主城找当地雇主', longTermLoss: '"加拿大本地工作经验"是后续雇主担保与晋升的硬通货, 远程为外国雇主工作不计入这条积累.' },
        ],
      },
      'PNP 省提名项目',
      '进学 + 毕业工签转 PR',
      '放弃加拿大路径',
    ],
    longTermLoss:
      '错过这扇门：加拿大 EE 评分模型对 30 岁以下赋高年龄分，随年龄接近 35 / 40 年龄分递减分趣近于零；资源型与技术型证书成本随之上升。',
  },
  {
    id: 'immigration_australia',
    title: '移民澳大利亚（技移 / 雇主担保 / 商投）',
    ageStart: 22,
    ageEnd: 38,
    talents: ['academic', 'business', 'tech_esports'],
    track: 'career',
    regions: ['overseas_au'],
    branches: ['189 独立技移', '190 / 491 州担保', '482 / 186 雇主担保', '商业投资类签证'],
    longTermLoss:
      '错过这扇门：澳大利亚技移年龄分 25-32 岁最高，过 45 岁多数技移名单关闭；后期仅剩雇主担保与投资路径，资金与雇主资源門槛明显高于默认路径。',
  },
  {
    id: 'immigration_singapore',
    title: '移民新加坡（EP / S Pass → PR → 公民）',
    ageStart: 22,
    ageEnd: 40,
    talents: ['academic', 'business', 'tech_esports'],
    track: 'career',
    regions: ['overseas_sg'],
    branches: ['EP 高薪岗 + PR 申请', 'Tech.Pass / ONE Pass 高端人才', 'GIP 商业投资者', '仅作为外派驻点不转身份'],
    longTermLoss:
      '错过这扇门：新加坡 PR 审批偏好年轻高薪与技术专家，40+ 首次申请成功率明显下降；不转 PR / 公民则法定购房、子女教育、医疗供给都以外籍价格计算，生活成本長期高位。',
  },
  {
    id: 'class_jump_overseas',
    title: '阶层跨境窗口（护照升级 / 身份跨国）',
    ageStart: 22,
    ageEnd: 45,
    talents: ['business', 'academic'],
    track: 'career',
    regions: ['overseas_us', 'overseas_ca', 'overseas_sg', 'overseas_my', 'overseas_au', 'overseas_uk'],
    branches: ['一本护照上身份变革', '多本护照多身份组合', '只走长期居留', '完全不出境'],
    longTermLoss:
      '错过这扇门：护照升级与投资身份项目资金门槛随全球政策随年上调，中文跨境资产配置与子女教育路径的可选项同步收窄。',
  },
  // —— 中老年事业 / 资产 / 影响力 / 精神归宿 / 婚恋重组窗口（45-85） ——
  {
    id: 'family_trust_setup',
    title: '家族信托 / 财富结构搭建窗口',
    ageStart: 45,
    ageEnd: 65,
    talents: ['business'],
    track: 'career',
    branches: ['境内家族信托 + 保险金信托', '离岸家族信托（开曼 / 新加坡）', '保险 + 控股公司组合', '裸资产 + 遗嘱兜底'],
    longTermLoss:
      '错过这扇门：信托设立前的可处置资产结构、婚姻状态、税务居民身份一旦改变（重病 / 离婚 / 移居），多数信托工具的隔离效力会被认定无效；55 岁后再补，律师 / 税务 / 跨境合规成本指数上升，传承确定性显著下降。',
  },
  {
    id: 'offshore_asset_allocation',
    title: '海外资产配置 / 全球分散窗口',
    ageStart: 50,
    ageEnd: 70,
    talents: ['business', 'academic'],
    track: 'career',
    branches: ['美 / 港 / 新券商账户分散', '海外不动产 + 长租收益', '美元保单 + 全球基金', '完全 onshore 单币种'],
    longTermLoss:
      '错过这扇门：跨境开户的身份认证、资金合规出境、税务申报体系学习曲线在 60+ 明显陡峭；CRS / FATCA 与各国遗产税的叠加在中老年期才补做，多半要走赠与 / 转让的折价路径，资产币种与司法管辖单一化是难以回头的结构性风险。',
  },
  {
    id: 'wealth_inheritance',
    title: '财富传承 / 遗嘱与跨代结构窗口',
    ageStart: 55,
    ageEnd: 78,
    talents: ['business', 'discipline'],
    track: 'career',
    branches: ['公证遗嘱 + 信托双层', '生前赠与 + 持股平台', '保险金传承 + 指定受益人', '不立遗嘱默认继承'],
    longTermLoss:
      '错过这扇门：不立遗嘱进入法定继承，子女 / 配偶 / 父母按份共有，重组家庭与跨境资产场景下极易引发诉讼；意识能力评估一旦在 70+ 出现争议，事后任何安排都可能被推翻，传承秩序与家族关系同时承压。',
  },
  {
    id: 'second_career_founder',
    title: '二次创业 / 55+ 老兵创始人窗口',
    ageStart: 50,
    ageEnd: 65,
    talents: ['business', 'social'],
    track: 'career',
    branches: ['行业老兵主导赛道创业', '与年轻团队联合创办', '收购成熟小公司当 CEO', '只做轻量个人工作室'],
    longTermLoss:
      '错过这扇门：行业资源 / 渠道 / 信任资本的变现窗口与体力 / 决策强度叠加，60 岁后募资方对创始人体力与接班结构的尽调权重明显加大；过窗后只能退守顾问与挂名董事，主导权与股权杠杆都被压缩。',
  },
  {
    id: 'angel_investor_advisor',
    title: '天使投资人 / 产业顾问 / LP 身份建立',
    ageStart: 52,
    ageEnd: 72,
    talents: ['business', 'social'],
    track: 'career',
    branches: ['个人天使 + 跟投基金', '加入 GP 做产业合伙人', '只做付费顾问 / 独立董事', '彻底退出商业网络'],
    longTermLoss:
      '错过这扇门：天使 / 顾问身份的入场券来自仍在场内的人脉与 deal flow，离场 3-5 年后基本被新一代替换；中老年人通过资本与经验放大影响力的杠杆窗口一旦关上，只剩消费型退休路径。',
  },
  {
    id: 'author_thought_leader',
    title: '写书 / 出版 / 思想体系输出窗口',
    ageStart: 50,
    ageEnd: 75,
    talents: ['academic', 'expression'],
    track: 'career',
    branches: ['系统性出版（专著 / 回忆录）', '长期专栏 + 公众号 / 播客', '高校客座讲席', '只在私域闭门分享'],
    longTermLoss:
      '错过这扇门：精力 / 表达力 / 时代相关性的三重交集很窄，过 70 岁后系统性著述的体力与编辑配合成本陡升；个人经验未结构化沉淀，等同于一生方法论随个体消散，影响力无法跨代复利。',
  },
  {
    id: 'public_office_legacy',
    title: '政协 / 人大 / 行业终身成就 / 公众身份窗口',
    ageStart: 55,
    ageEnd: 78,
    talents: ['discipline', 'social'],
    track: 'career',
    branches: ['争取政协 / 人大席位', '行业协会会长 / 标准委员会', '高校名誉教授 / 终身成就奖', '保持私人身份不出场'],
    longTermLoss:
      '错过这扇门：体制内荣誉席位与行业终身荣誉的提名链路依赖在任时段的关系积累与作品基线，离场后基本只能由后辈代为追认；公众身份红利（话语权 / 资源调动 / 子女资源）在过窗后不可补领。',
  },
  {
    id: 'spiritual_practice_deepening',
    title: '宗教 / 哲学修行深化窗口（精神体系沉淀）',
    ageStart: 50,
    ageEnd: 80,
    talents: ['academic', 'social'],
    track: 'love',
    branches: ['系统皈依 / 长期师承', '哲学体系自学 + 私塾', '冥想 / 内观 / 长期闭关', '保持世俗不进入'],
    longTermLoss:
      '错过这扇门：精神体系的内化需要长期、低干扰的练习与导师反馈窗口，70+ 后认知与体力下降时再起步，难以建立稳定的内在秩序；老年期心灵无所归依，孤独与死亡焦虑的成本会显著外溢到家庭。',
  },
  {
    id: 'charity_foundation_legacy',
    title: '慈善基金 / 公益体系建立（成为思想 / 精神领袖路径）',
    ageStart: 55,
    ageEnd: 80,
    talents: ['business', 'social'],
    track: 'career',
    branches: ['注册个人 / 家族慈善基金会', '挂靠大基金做冠名项目', '长期定向捐赠 + 不设机构', '只在去世后由遗嘱处置'],
    longTermLoss:
      '错过这扇门：慈善基金会的合规架构、品牌叙事与受助网络至少需要 5-10 年沉淀才能形成自运转，过 75 岁再起步往往沦为子女代管或被并入他人体系；个人价值观无法转译为跨代制度，精神 / 影响力的归宿失去载体。',
  },
  {
    id: 'late_remarriage',
    title: '黄昏恋 / 再婚 / 长伴侣重组窗口',
    ageStart: 50,
    ageEnd: 72,
    talents: ['social'],
    track: 'love',
    branches: ['正式再婚 + 婚前财产协议', '同居伴侣不登记', '跨地两地稳定关系', '主动选择长期独身'],
    longTermLoss:
      '错过这扇门：60+ 长期伴侣的供给端急剧收窄，健康 / 照护 / 经济结构的匹配难度逐年上升；不进入伴侣关系，老年期日间照护与医疗代理几乎只能依赖子女或机构，决策自由度与生活质量同步下行。',
  },
  {
    id: 'extramarital_risk_midlate',
    title: '婚外关系风险与法律 / 道德代价窗口',
    ageStart: 45,
    ageEnd: 70,
    talents: ['social', 'business'],
    track: 'love',
    branches: ['主动设定边界 + 关系咨询', '与配偶谈判开放式约定', '隐性长期出轨', '一次性事件 + 立即止损'],
    longTermLoss:
      '错过这扇门：中老年婚外关系叠加财产 / 子女 / 继承结构，一旦曝光，离婚财产分割、继承顺位与名誉资本同时崩塌；多地司法对"夫妻共同财产赠与第三者"普遍可追回，但社会关系与子女信任的损伤不可逆，长期代价远高于关系本身收益。',
  },
  // —— 童年 / 少年细化：教育路径与感情线 ——
  {
    id: 'parent_companionship_childhood',
    title: '父母陪伴密度窗口（依恋与安全感）',
    ageStart: 0,
    ageEnd: 12,
    talents: ['social'],
    track: 'love',
    familyBackgrounds: ['democratic', 'distant', 'multigen', 'permissive'],
    branches: [
      {
        id: 'daily_presence',
        label: '高陪伴（日常共餐/共读/稳定回应）',
        next: [
          { domain: 'family', label: '稳定依恋形成', longTermLoss: '0-6 岁回应一致性是安全依恋核心输入，长期影响亲密关系中的信任阈值。' },
          { domain: 'education', label: '家庭阅读习惯建立', longTermLoss: '小学前语言输入总量差异会直接外溢到阅读速度与抽象表达能力。' },
          { domain: 'health', label: '情绪共调能力提升', longTermLoss: '童年情绪命名与安抚经验不足，成年后压力管理成本明显提高。' },
        ],
      },
      '中等陪伴（周末集中陪伴）',
      '低陪伴（长期异地/高强度工作）',
      '主要由祖辈照护',
    ],
    longTermLoss:
      '错过这扇门：童年依恋与情绪调节能力是后续亲密关系和学习自驱力的地基，后补通常需要更长心理成本。',
  },
  {
    id: 'junior_school_choice',
    title: '初中择校窗口（公办/民办/国际）',
    ageStart: 11,
    ageEnd: 15,
    talents: ['academic', 'discipline'],
    track: 'career',
    regions: ['tier1', 'tier2', 'tier34', 'county', 'rural'],
    branches: [
      {
        id: 'public_key_junior',
        label: '冲刺重点公办初中',
        next: [
          { domain: 'education', label: '竞赛/培优体系提前接入', longTermLoss: '初中阶段错过高质量数理训练，后续竞赛与强基路径进入难度大增。' },
          { domain: 'family', label: '学区迁移与陪读安排', longTermLoss: '择校常伴随家庭通勤与居住重构，执行不稳会反向拖累学习连续性。' },
        ],
      },
      '民办初中（高压应试）',
      '国际初中（IB/MYP/双语）',
      '就近普通初中',
    ],
    longTermLoss:
      '错过这扇门：初中阶段决定学习习惯和同伴密度，直接影响高中分层与后续升学赛道入口。',
  },
  {
    id: 'high_school_choice',
    title: '高中择校窗口（普高/国际/职高）',
    ageStart: 14,
    ageEnd: 18,
    talents: ['academic', 'tech_esports', 'arts'],
    track: 'career',
    regions: ['tier1', 'tier2', 'tier34', 'county', 'rural'],
    branches: [
      '重点普高冲一本',
      '国际高中走海外本科',
      '职高/中职走技能路径',
      '普高保底 + 艺体特长',
    ],
    longTermLoss:
      '错过这扇门：高中路径决定高考/留学/技能就业三条主干道，切换成本在 17 岁后快速上升。',
  },
  {
    id: 'gaokao_migration',
    title: '高考移民 / 异地升学窗口',
    ageStart: 16,
    ageEnd: 19,
    talents: ['academic', 'discipline'],
    track: 'career',
    regions: ['tier1', 'tier2', 'tier34', 'county', 'rural'],
    branches: [
      '合规随迁 + 本地高考',
      '回原籍高考',
      '港澳台/海外本科替代',
      '高职单招/春招',
    ],
    longTermLoss:
      '错过这扇门：高考地域政策与户籍/学籍绑定，时序错误会直接丢失当届考试资格或优先录取权。',
  },
  {
    id: 'adolescent_attachment_repair',
    title: '青春期关系修复窗口（亲子/同伴/初恋）',
    ageStart: 13,
    ageEnd: 22,
    talents: ['social', 'expression'],
    track: 'love',
    familyBackgrounds: ['distant', 'authoritative', 'permissive'],
    branches: [
      {
        id: 'family_therapy_track',
        label: '亲子沟通+咨询介入',
        next: [
          { domain: 'family', label: '重建冲突规则与边界', longTermLoss: '青春期冲突若长期失控，会在大学/初职阶段外化为回避沟通与关系极化。' },
          { domain: 'health', label: '焦虑/抑郁早筛早治', longTermLoss: '16-22 岁是情绪障碍高发窗口，早干预可显著降低成年期复发率。' },
        ],
      },
      '通过同伴社群慢慢修复',
      '维持表面和平但不解决根因',
      '关系破裂后长期断联',
    ],
    longTermLoss:
      '错过这扇门：青春期关系脚本会迁移到成年亲密关系与职场协作，延迟修复会放大长期心理与关系成本。',
  },
  {
    id: 'premarital_contract_design',
    title: '婚前协议 / 财产边界设计窗口',
    ageStart: 24,
    ageEnd: 40,
    talents: ['social', 'business'],
    track: 'both',
    branches: [
      {
        id: 'prenup_plus_trust',
        label: '婚前协议 + 保单/信托组合',
        next: [
          { domain: 'asset', label: '婚前婚后资产分层', longTermLoss: '未分层时，一旦离婚或继承触发，共同财产界定争议会吞噬多年增值。' },
          { domain: 'family', label: '再婚家庭继承顺位设计', longTermLoss: '重组家庭不提前设计受益人，老年医疗代理与遗产分配冲突概率显著上升。' },
        ],
      },
      '仅口头约定不落文书',
      '完全共同财产模式',
      '长期同居不登记',
    ],
    longTermLoss:
      '错过这扇门：情感关系进入制度化后再补边界，谈判成本与信任摩擦都更高。',
  },
  // —— 海外华人高频国家：差异化窗口 ——
  {
    id: 'us_k12_college_path',
    title: '美国 K12→本科路径（AP/竞赛/活动组合）',
    ageStart: 12,
    ageEnd: 18,
    talents: ['academic', 'expression'],
    track: 'career',
    regions: ['overseas_us'],
    branches: [
      'AP + SAT/ACT + 竞赛冲 Top 30',
      '州立大学性价比路径',
      '社区大学转学路径',
      '回流亚洲高校',
    ],
    longTermLoss:
      '错过这扇门：美国本科录取是长期档案制，11-12 年级才补活动与课程 rigor 往往来不及。',
  },
  {
    id: 'us_h1b_opt_window',
    title: '美国 OPT / H-1B 身份衔接窗口',
    ageStart: 21,
    ageEnd: 33,
    talents: ['tech_esports', 'academic'],
    track: 'career',
    regions: ['overseas_us'],
    branches: [
      'STEM 专业 + OPT 延长',
      '大厂抽签 + 绿卡排期',
      '转去加拿大/新加坡再回流',
      '直接回国发展',
    ],
    longTermLoss:
      '错过这扇门：OPT 与 H-1B 时序错位会导致身份断档，职业轨迹被迫重启。',
  },
  {
    id: 'canada_bilingual_track',
    title: '加拿大双语/法语加分窗口（学签与移民协同）',
    ageStart: 14,
    ageEnd: 32,
    talents: ['academic', 'social'],
    track: 'career',
    regions: ['overseas_ca'],
    branches: [
      '法语加分 + EE 直通',
      '省提名定向专业',
      'College 就业导向路径',
      '只读书不做身份规划',
    ],
    longTermLoss:
      '错过这扇门：加拿大政策重视语言与本地经历，早期不布局将显著抬高后续移民成本。',
  },
  {
    id: 'sg_psle_aeis_stream',
    title: '新加坡分流窗口（PSLE/AEIS/JC/Poly）',
    ageStart: 10,
    ageEnd: 18,
    talents: ['academic', 'discipline'],
    track: 'career',
    regions: ['overseas_sg'],
    branches: [
      'PSLE 高分进名校链路',
      'AEIS 入学后稳步上升',
      'Poly→就业/大学路径',
      '国际学校路径',
    ],
    longTermLoss:
      '错过这扇门：新加坡教育体系分流早，赛道切换虽可行但每次转换都要付出时间与名额成本。',
  },
  {
    id: 'my_chinese_independent_path',
    title: '马来西亚华校路径窗口（独中/国民型/国际）',
    ageStart: 12,
    ageEnd: 19,
    talents: ['academic', 'expression'],
    track: 'career',
    regions: ['overseas_my'],
    branches: [
      '独中统考（UEC）升学',
      '国民型中学 + 双语强化',
      '国际学校跳板',
      '本地就业导向路径',
    ],
    longTermLoss:
      '错过这扇门：华校体系、语言能力与大学申请规则强耦合，后期临时切轨会损失关键升学窗口。',
  },
  {
    id: 'au_selective_school_migration',
    title: '澳洲择校与职业评估联动窗口',
    ageStart: 15,
    ageEnd: 35,
    talents: ['academic', 'tech_esports', 'business'],
    track: 'career',
    regions: ['overseas_au'],
    branches: [
      'Selective school / ATAR 冲刺',
      '技术移民职业清单导向选专业',
      '先就业再雇主担保',
      '仅留学不做移民规划',
    ],
    longTermLoss:
      '错过这扇门：澳洲移民与职业评估对专业、年限和年龄耦合度高，前置规划不足会导致毕业后路径骤窄。',
  },
  {
    id: 'uk_a_level_ucas_path',
    title: '英国 A-Level / UCAS 窗口（本科与实习协同）',
    ageStart: 15,
    ageEnd: 23,
    talents: ['academic', 'expression'],
    track: 'career',
    regions: ['overseas_uk'],
    branches: [
      'A-Level 高配冲 G5',
      'Foundation 过渡路径',
      '本科 + 实习直连就业',
      '读完即回流亚洲',
    ],
    longTermLoss:
      '错过这扇门：UCAS 与实习节奏高度前置，错过早期申请窗口会连锁影响毕业后留英竞争力。',
  },
]

type OpportunityStatus = 'upcoming' | 'current' | 'closing' | 'missed'

function classifyWindow(age: number, win: OpportunityWindow): OpportunityStatus {
  if (age < win.ageStart) return 'upcoming'
  if (age > win.ageEnd) return 'missed'
  // 当前在窗内：距离 ageEnd ≤ 3 年，或已走过 70% 时长 → "即将错过"
  const span = win.ageEnd - win.ageStart
  const remaining = win.ageEnd - age
  if (remaining <= 3 || (span > 0 && (age - win.ageStart) / span >= 0.7)) {
    return 'closing'
  }
  return 'current'
}

const PLAYBACK_SPEEDS = [0.5, 1, 2, 4] as const
type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number]
const BASE_MS_PER_YEAR = 5000

export default function SimPage() {
  const [age, setAge] = useState<number>(18)
  const [isTimelinePlaying, setIsTimelinePlaying] = useState<boolean>(true)
  const [timelineSpeed, setTimelineSpeed] = useState<PlaybackSpeed>(1)
  const animationFrameRef = useRef<number | null>(null)
  const lastFrameMsRef = useRef<number | null>(null)
  const [regionId, setRegionId] = useState<RegionId>(REGIONS[1].id)
  const [familyId, setFamilyId] = useState<string>(FAMILIES[1].id)
  const [selectedTalents, setSelectedTalents] = useState<Talent[]>(
    TALENTS.map((t) => t.id)
  )
  const [showMissed, setShowMissed] = useState<boolean>(false)
  // 新增：教养氛围过滤（多选）与感情线 / 事业线 tab。
  const [familyBg, setFamilyBg] = useState<FamilyBackground[]>(
    FAMILY_BACKGROUNDS.map((b) => b.id)
  )
  const [trackTab, setTrackTab] = useState<'love' | 'career'>('career')

  // 机会窗口分叉展开状态: key 为 `${winId}::${branchId}`。
  // 仅受点击 handler 驱动, 不影响其他任何计算 / 现有趋势指标 / 人物动画。
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(
    () => new Set<string>(),
  )
  const toggleBranch = (winId: string, branchId: string) => {
    setExpandedBranches((prev) => {
      const key = `${winId}::${branchId}`
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const region = REGIONS.find((r) => r.id === regionId) ?? REGIONS[0]
  const family = FAMILIES.find((f) => f.id === familyId) ?? FAMILIES[0]
  const stage = useMemo(() => stageOfAge(age), [age])
  const displayAge = Math.round(age)
  const scoreBandOf = (score: number) =>
    score >= 80 ? 'high' : score >= 50 ? 'mid' : 'low'

  const toggleTalent = (id: Talent) => {
    setSelectedTalents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }
  const toggleFamilyBg = (id: FamilyBackground) => {
    setFamilyBg((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  useEffect(() => {
    if (!isTimelinePlaying) {
      lastFrameMsRef.current = null
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    const tick = (now: number) => {
      const last = lastFrameMsRef.current ?? now
      const elapsed = Math.min(now - last, 250)
      lastFrameMsRef.current = now
      setAge((prev) => {
        const next = prev + (elapsed / BASE_MS_PER_YEAR) * timelineSpeed
        if (next > 100) return 1 + ((next - 1) % 100)
        return Math.max(1, next)
      })
      animationFrameRef.current = requestAnimationFrame(tick)
    }

    animationFrameRef.current = requestAnimationFrame(tick)
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      lastFrameMsRef.current = null
    }
  }, [isTimelinePlaying, timelineSpeed])

  const pauseTimeline = () => setIsTimelinePlaying(false)
  const resumeTimeline = () => setIsTimelinePlaying(true)
  const resetTimeline = () => {
    lastFrameMsRef.current = null
    setAge(1)
    setIsTimelinePlaying(false)
  }

  // 根据“教养氛围”多选过滤出“出身家庭”可选项。未选任何氛围时，退回全部。
  const visibleFamilies = useMemo(() => {
    if (familyBg.length === 0) return FAMILIES
    const allowed = new Set<string>(
      FAMILY_BACKGROUNDS.filter((b) => familyBg.includes(b.id)).flatMap(
        (b) => b.familyIds
      )
    )
    const list = FAMILIES.filter((f) => allowed.has(f.id))
    return list.length > 0 ? list : FAMILIES
  }, [familyBg])

  // 保证当前选中的 familyId 仍在可见列表里。
  const effectiveFamilyId = visibleFamilies.find((f) => f.id === familyId)
    ? familyId
    : visibleFamilies[0]?.id ?? familyId
  if (effectiveFamilyId !== familyId) {
    // 仅调整显示不仅 setState——避免反复渲染循环。
  }

  // 教养氛围量化到连续分值：使其不仅影响下拉选项，也会影响状态分与窗口命中。
  const bgEffect = useMemo(() => {
    if (familyBg.length === 0) {
      return { education: 0, identity: 0, body: 0, wealth: 0, focus: '未限定教养氛围：使用中性基准。' }
    }
    const sum = familyBg.reduce(
      (acc, id) => {
        const e = FAMILY_BG_EFFECTS[id]
        acc.education += e.education
        acc.identity += e.identity
        acc.body += e.body
        acc.wealth += e.wealth
        return acc
      },
      { education: 0, identity: 0, body: 0, wealth: 0 },
    )
    const n = familyBg.length
    const focus = familyBg
      .map((id) => FAMILY_BG_EFFECTS[id].focus)
      .slice(0, 2)
      .join('；')
    return {
      education: sum.education / n,
      identity: sum.identity / n,
      body: sum.body / n,
      wealth: sum.wealth / n,
      focus,
    }
  }, [familyBg])

  // 当前状态卡：资产 / 身份 / 学历 / 身体机能。
  // 仅以 (age, region, family) 派生出“趋势”字符，不是真实模拟输出，用于 demo 中红/绿涨跌可视化。
  type StatTrend = 'up' | 'down' | 'flat'
  type StatusCard = {
    key: string
    label: string
    value: string
    trend: StatTrend
    hint: string
    // 数值变化指标（与上一时间步比较，按各维度合理量纲显示）。
    score: number // 当前分值
    delta: number // 与上一时间步差值（带符号）
    unit: string // 单位 / 量纲标签，例如 '万' / '分' / '%'。
    deltaPrecision: number // 差值显示小数位数。
  }

  // —— 每个维度的连续分值（与 (age, regionId, familyId) 单向派生）——
  // 用连续数值，而不是离散字符串，便于做差值与红/绿可视化。
  // 量纲选择：
  //   资产 wealth: 万（家庭资本 + 主动积累曲线，0~约 1500）
  //   身份 identity: 分（地域基础分 + 年龄阶段红利，0~100）
  //   学历 education: 分（受教育年限 + 上限封顶，0~100）
  //   身体 body: 分（婴幼儿爬升 → 25 岁前后峰值 → 老年衰退，0~100）
  const wealthScore = (() => {
    const familyBase =
      familyId === 'wealthy' ? 400
        : familyId === 'middle' ? 60
        : familyId === 'working' ? 12
        : 3
    // 主动积累曲线（更贴近现实：钱很难赚）。
    //   22-30 起步期：还贷 / 攒首付，积累极慢；
    //   30-45 提速期：收入与复利同时起来，但被房贷 / 育儿成本拖累；
    //   45-58 高位期：负担减轻 + 资历溢价，积累最快；
    //   58-68 见顶平台：增量趋缓；
    //   68+   消耗期：退休后净资产缓慢下行。
    const seg = (from: number, to: number, slope: number) =>
      Math.max(0, Math.min(age, to) - from) * slope
    let active = 0
    if (age >= 22) {
      active =
        seg(22, 30, 3) +   // 起步期：8 年才攒 ~24 万
        seg(30, 45, 12) +  // 提速期：15 年 ~180 万
        seg(45, 58, 18) +  // 高位期：13 年 ~234 万
        seg(58, 68, 5)     // 平台期：增量很小
      if (age > 68) active -= (age - 68) * 9 // 消耗期：退休后净资产下行
    }
    // 出身家庭对“主动积累斜率”的加成（资本越厚，钱生钱越快）。
    const slopeBonus = familyId === 'wealthy' ? active * 0.45
      : familyId === 'middle' ? active * 0.12
      : 0
    return Math.max(0, Math.round(familyBase + active + slopeBonus + bgEffect.wealth * 6))
  })()

  const identityScore = (() => {
    const regionBase = REGION_IDENTITY_BASE[regionId]
    // 年龄阶段红利：在校 < 应届 < 在职 < 中坚；老年回落。
    const stageBonus =
      age < 7 ? 0
        : age < 19 ? 3
        : age < 23 ? 8
        : age < 35 ? 12
        : age < 60 ? 14
        : age < 75 ? 6
        : 0
    const raw = regionBase + stageBonus + bgEffect.identity * 2 - (age >= 60 ? (age - 60) * 0.3 : 0)
    return Math.max(0, Math.min(100, Math.round(raw * 10) / 10))
  })()

  const educationScore = (() => {
    // 简化的“受教育投入分”累计曲线，到 25 岁前后封顶。
    let s = 0
    if (age >= 0) s = Math.min(8, age) * 1 // 0-7: 学前/识字
    if (age >= 7) s += Math.min(6, age - 7) * 3 // 7-12: 小学
    if (age >= 13) s += Math.min(3, age - 12) * 5 // 13-15: 初中
    if (age >= 16) s += Math.min(3, age - 15) * 6 // 16-18: 高中
    if (age >= 19) s += Math.min(4, age - 18) * 7 // 19-22: 本科
    if (age >= 23) s += Math.min(3, age - 22) * 4 // 23-25: 硕士 / 早期工作沉淀
    if (age >= 26) s += Math.min(60, age - 25) * 0.05 // 持续学习的边际加成（很小）
    // 老年期：学历折旧（行业更迭，含金量逐年下降）。
    if (age >= 60) s -= (age - 60) * 0.2
    s += bgEffect.education * 1.5
    return Math.max(0, Math.min(100, Math.round(s * 10) / 10))
  })()

  const bodyScore = (() => {
    // 0-25 爬升至 100，25-30 维持，30-50 缓降，50+ 加速下降。
    let s = 0
    if (age <= 25) s = (age / 25) * 100
    else if (age <= 30) s = 100
    else if (age <= 50) s = 100 - (age - 30) * 1.0
    else if (age <= 70) s = 80 - (age - 50) * 1.8
    else s = 80 - 20 * 1.8 - (age - 70) * 2.4
    s += bgEffect.body * 1.4
    return Math.max(0, Math.min(100, Math.round(s * 10) / 10))
  })()

  // 缓存上一时间步分值，用于计算 delta。初次渲染 delta = 0 / trend = 'flat'。
  const prevScoresRef = useRef<{ wealth: number; identity: number; education: number; body: number } | null>(null)
  const prev = prevScoresRef.current
  const dWealth = prev ? Math.round((wealthScore - prev.wealth) * 10) / 10 : 0
  const dIdentity = prev ? Math.round((identityScore - prev.identity) * 10) / 10 : 0
  const dEducation = prev ? Math.round((educationScore - prev.education) * 10) / 10 : 0
  const dBody = prev ? Math.round((bodyScore - prev.body) * 10) / 10 : 0
  // 在渲染完成后把当前分值落到 ref，下一次比较用。
  useEffect(() => {
    prevScoresRef.current = {
      wealth: wealthScore,
      identity: identityScore,
      education: educationScore,
      body: bodyScore,
    }
  }, [wealthScore, identityScore, educationScore, bodyScore])

  const trendOf = (d: number): StatTrend => (d > 0.05 ? 'up' : d < -0.05 ? 'down' : 'flat')

  const statusCards: StatusCard[] = useMemo(() => {
    // 学历趋势：18-25 上升，25-45 趋于平稳，老年期轻微贬值。
    const educationStage =
      age < 7
        ? '学前'
        : age < 13
        ? '小学'
        : age < 16
        ? '初中'
        : age < 19
        ? '高中'
        : age < 23
        ? '本科在读 / 起步'
        : age < 28
        ? '本科 / 硕士 / 首份工作'
        : age < 60
        ? '在职定型'
        : '退休后、经验依据'
    const educationTrend: StatTrend = trendOf(dEducation)

    // 资产趋势：与出身家庭与年龄双向相关。同一家庭起点，青年-中年为上升期，高龄为衰退期。
    const wealthBaseline =
      familyId === 'wealthy'
        ? '高位 / 代际资本丰厚'
        : familyId === 'middle'
        ? '中位 / 双职工资本'
        : familyId === 'working'
        ? '起点偏低 / 主要靠工资'
        : '起点低 / 代际可调动资金有限'
    const wealthTrend: StatTrend = trendOf(dWealth)

    // 身体机能：18-30 峰值，30-50 平原 + 轻下，50+ 加速下降。
    const bodyStage =
      age < 18
        ? '发育中'
        : age < 30
        ? '峰值期'
        : age < 45
        ? '高位平台'
        : age < 60
        ? '轻度下行'
        : age < 80
        ? '衰退期'
        : '依赖照护'
    const bodyTrend: StatTrend = trendOf(dBody)

    // 身份：与出身地域 + 年龄阶段拼接。
    const identityRole =
      age < 7
        ? '孩童'
        : age < 19
        ? '在校学生'
        : age < 23
        ? '青年'
        : age < 35
        ? '在职青年'
        : age < 60
        ? '中坚力量'
        : '老年阶段'
    const identityHint = `${REGION_IDENTITY_HINT[regionId]}；教养氛围：${bgEffect.focus}`
    const identityTrend: StatTrend = trendOf(dIdentity)

    return [
      {
        key: 'wealth',
        label: '资产',
        value: wealthBaseline,
        trend: wealthTrend,
        score: wealthScore,
        delta: dWealth,
        unit: '万',
        deltaPrecision: 1,
        hint:
          age < 22
            ? '仍主要以家庭资本为主，未进入主动积累阶段。'
            : age < 30
            ? '起步期：收入低、还贷攒首付，钱很难存下来。'
            : age < 45
            ? '提速期：收入与复利起来，但被房贷 / 育儿成本拖累。'
            : age < 58
            ? '高位积累期：负担减轻 + 资历溢价，攒钱最快。'
            : age < 68
            ? '见顶平台期：增量趋缓，转向保值与传承规划。'
            : '消耗期：退休后主要靠存量与社保，净资产缓慢下行。',
      },
      {
        key: 'identity',
        label: '身份',
        value: identityRole,
        trend: identityTrend,
        score: identityScore,
        delta: dIdentity,
        unit: '分',
        deltaPrecision: 1,
        hint: identityHint,
      },
      {
        key: 'education',
        label: '学历',
        value: educationStage,
        trend: educationTrend,
        score: educationScore,
        delta: dEducation,
        unit: '分',
        deltaPrecision: 1,
        hint:
          age < 23
            ? '学历资本净增期；应届身份仅能使用一次。'
            : age < 60
            ? '学历出于使用期，补学需考虑机会成本。'
            : '学历转为历史背景；实践经验权重上升。',
      },
      {
        key: 'body',
        label: '身体机能',
        value: bodyStage,
        trend: bodyTrend,
        score: bodyScore,
        delta: dBody,
        unit: '分',
        deltaPrecision: 1,
        hint:
          age < 30
            ? '体能 / 反应 / 恢复均处于峰值期。'
            : age < 50
            ? '进入保育期；运动习惯决定后期斜率。'
            : '慢病管理期；医疗与生活质量成本上升。',
      },
    ]
  }, [age, familyId, regionId, wealthScore, identityScore, educationScore, bodyScore, dWealth, dIdentity, dEducation, dBody, bgEffect])

  // 未来10年关注窗：只展示当前年龄起未来最多 10 年内可触达的窗口。
  // 超过 10 年的"即将到来"窗口被视为非当前关注，在主列表中隐藏。
  const FUTURE_HORIZON_YEARS = 10
  // 刚刚错过的人生窗口：默认在主列表底部列出过去 5 年内刚关闭的窗口，
  // 错过太久的超过该阈值则默认隐藏；showMissed=true 时才加载 5 年外的全量回顾。
  const MISSED_LOOKBACK_YEARS = 5

  // 轻量“数据库”：把树状窗口按 talent/region/familyBg 建索引，便于后续规模化扩展。
  const windowDb = useMemo(() => {
    const byTalent: Record<Talent, OpportunityWindow[]> = {
      sports: [],
      arts: [],
      academic: [],
      social: [],
      expression: [],
      discipline: [],
      tech_esports: [],
      business: [],
    }
    for (const w of OPPORTUNITY_WINDOWS) {
      for (const t of w.talents) byTalent[t].push(w)
    }
    return {
      all: OPPORTUNITY_WINDOWS,
      byTalent,
      byId: new Map(OPPORTUNITY_WINDOWS.map((w) => [w.id, w])),
    }
  }, [])

  const visibleWindows = useMemo(() => {
    const byTalent = windowDb.all.filter((w) => {
      if (selectedTalents.length === 0) return false
      if (w.talentMode === 'all') {
        return w.talents.every((t) => selectedTalents.includes(t))
      }
      return w.talents.some((t) => selectedTalents.includes(t))
    })
    const byRegion = byTalent.filter(
      (w) => !w.regions || w.regions.includes(regionId)
    )
    const byFamilyBg = byRegion.filter((w) => {
      if (!w.familyBackgrounds || familyBg.length === 0) return true
      return w.familyBackgrounds.some((b) => familyBg.includes(b))
    })
    // 感情线 / 事业线 tab 过滤：track === 'both' 的窗口两边都展示。
    const byTrack = byFamilyBg.filter(
      (w) => w.track === trackTab || w.track === 'both'
    )
    // missed 窗口过滤规则：
    //  - showMissed = false (默认): 仅保留 age - ageEnd <= MISSED_LOOKBACK_YEARS 的“刚错过”窗口；
    //  - showMissed = true: 加载全部 missed (含 5 年外的远期回顾)。
    const withMissed = byTrack.filter((w) => {
      const status = classifyWindow(age, w)
      if (status !== 'missed') return true
      if (showMissed) return true
      return age - w.ageEnd <= MISSED_LOOKBACK_YEARS
    })
    // 未来10年过滤：upcoming 状态的窗口若起点超过 age + 10，则不以"即将到来"展示。
    // current / closing 已在窗口内（或将在 ≤3 年内结束），天然落在 10 年内，无需额外过滤。
    const withinHorizon = withMissed.filter((w) => {
      const status = classifyWindow(age, w)
      if (status === 'upcoming') {
        return w.ageStart - age <= FUTURE_HORIZON_YEARS
      }
      return true
    })
    const order: Record<OpportunityStatus, number> = {
      closing: 0,
      current: 1,
      upcoming: 2,
      missed: 3,
    }
    return [...withinHorizon].sort((a, b) => {
      const sa = order[classifyWindow(age, a)]
      const sb = order[classifyWindow(age, b)]
      if (sa !== sb) return sa - sb
      // missed 中同类按“错过越近越靠前”：age - ageEnd 升序（其他状态仍按 ageStart）。
      if (classifyWindow(age, a) === 'missed') {
        return (age - a.ageEnd) - (age - b.ageEnd)
      }
      return a.ageStart - b.ageStart
    })
  }, [age, selectedTalents, showMissed, trackTab, regionId, familyBg, windowDb])

  return (
    // lqs-sim-page: 标记 /sim 页根节点, 配合 globals.css 中
    // @media(min-width:1100px) .lqs-main:has(.lqs-sim-page) 让 /sim
    // 在 PC 上撑满 viewport, 不影响 / 首页 (layout.tsx 仍是 maxWidth:960).
    <section className="lqs-sim-page" style={{ display: 'grid', gap: 16 }}>
      <header style={{ display: 'grid', gap: 6 }}>
        <h1 className="lqs-sim-title" style={{ fontSize: 32, margin: 0 }}>人生模拟 Demo</h1>
        <p className="lqs-sim-lede" style={{ color: '#6b7280', margin: 0, lineHeight: 1.7 }}>
          0-100岁 全程时间轴 · 选择出生地域与出身家庭，拖动滑块查看不同年龄段的状态变化；demo 使用轻量 CSS 过渡 + WebGL (PixiJS) 小人走路 / 成长动画。
        </p>
      </header>

      <div
        className="lqs-sim-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 260px) 1fr',
          gap: 24,
        }}
      >
        {/* 左侧选择面板（小屏自动折到顶部） */}
        <aside
          className="lqs-sim-aside"
          style={{
            display: 'grid',
            gap: 16,
            padding: 16,
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            background: '#fafafa',
            alignSelf: 'start',
          }}
        >
          <div className="lqs-aside-section">
            <div style={{ fontWeight: 600, marginBottom: 8 }}>出生地域</div>
            <select
              value={regionId}
              onChange={(e) => setRegionId(e.target.value as RegionId)}
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 6,
                border: '1px solid #d1d5db',
                background: 'white',
              }}
              aria-label="出生地域"
            >
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <p
              style={{
                marginTop: 8,
                marginBottom: 0,
                color: '#6b7280',
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              {region.brief}
            </p>
          </div>

          <div className="lqs-aside-section">
            <div style={{ fontWeight: 600, marginBottom: 8 }}>教养氛围</div>
            <div
              role="group"
              aria-label="教养氛围过滤"
              style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
            >
              {FAMILY_BACKGROUNDS.map((b) => {
                const active = familyBg.includes(b.id)
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggleFamilyBg(b.id)}
                    aria-pressed={active}
                    title={b.brief}
                    className="lqs-chip"
                    style={{
                      fontSize: 12,
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: `1px solid ${active ? '#111827' : '#d1d5db'}`,
                      background: active ? '#111827' : 'white',
                      color: active ? 'white' : '#111827',
                      cursor: 'pointer',
                    }}
                  >
                    {b.name}
                  </button>
                )
              })}
            </div>
            <p
              style={{
                marginTop: 8,
                marginBottom: 0,
                color: '#6b7280',
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              教养氛围不仅会限定下方"出身家庭"候选，还会影响四维分值与窗口命中：
              学历 {bgEffect.education >= 0 ? '+' : ''}{bgEffect.education.toFixed(1)}、
              身份 {bgEffect.identity >= 0 ? '+' : ''}{bgEffect.identity.toFixed(1)}、
              身体 {bgEffect.body >= 0 ? '+' : ''}{bgEffect.body.toFixed(1)}、
              资产 {bgEffect.wealth >= 0 ? '+' : ''}{bgEffect.wealth.toFixed(1)}。
            </p>
          </div>

          <div className="lqs-aside-section">
            <div style={{ fontWeight: 600, marginBottom: 8 }}>出身家庭</div>
            <select
              value={effectiveFamilyId}
              onChange={(e) => setFamilyId(e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 6,
                border: '1px solid #d1d5db',
                background: 'white',
              }}
              aria-label="出身家庭"
            >
              {visibleFamilies.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <p
              style={{
                marginTop: 8,
                marginBottom: 0,
                color: '#6b7280',
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              {family.brief}
            </p>
          </div>
        </aside>

        {/* 主区 (alt-a: PC 1100px+ 切两列 — 左侧时间轴+状态, 右侧机会窗口直接进入首屏) */}
        <div className="lqs-sim-content">
          <div className="lqs-sim-col-left">
          {/* 当前状态卡：资产 / 身份 / 学历 / 身体机能，红/绿涨跌可视化 */}
          <div
            className="lqs-status-cards"
            aria-label="当前状态"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 8,
            }}
          >
            {statusCards.map((c) => {
              const isUp = c.trend === 'up'
              const isDown = c.trend === 'down'
              const arrow = isUp ? '↑' : isDown ? '↓' : '→'
              const color = isUp ? '#047857' : isDown ? '#b91c1c' : '#6b7280'
              const bg = isUp ? '#ecfdf5' : isDown ? '#fef2f2' : '#f9fafb'
              const border = isUp ? '#10b981' : isDown ? '#f87171' : '#d1d5db'
              // 数值变化展示：与上一时间步比较的 delta，带符号 + 单位。
              const sign = c.delta > 0 ? '+' : c.delta < 0 ? '−' : '±'
              const absDelta = Math.abs(c.delta).toFixed(c.deltaPrecision)
              const deltaText = `${sign}${absDelta} ${c.unit}`
              const scoreBand = scoreBandOf(c.score)
              return (
                <div
                  key={c.key}
                  className="lqs-status-card lqs-fade-in"
                  data-trend={c.trend}
                  data-score-band={scoreBand}
                  style={{
                    padding: 10,
                    border: `1px solid ${border}`,
                    background: bg,
                    borderRadius: 10,
                    display: 'grid',
                    gap: 6,
                    transition: 'background 200ms ease, border-color 200ms ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{c.label}</span>
                    <span
                      className="lqs-status-delta"
                      aria-label={`${c.trend === 'up' ? '上涨' : c.trend === 'down' ? '下跌' : '持平'} ${deltaText}`}
                      style={{ color, fontWeight: 700, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <span style={{ fontSize: 13 }}>{arrow}</span>
                      <span>{deltaText}</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <div className="lqs-status-value" title={c.value}>{c.value}</div>
                    <div
                      className="lqs-status-score"
                      title={`当前指标值: ${c.score} ${c.unit}（与上一时间步比较 ${deltaText}）`}
                    >
                      {c.score}
                      <span>{c.unit}</span>
                    </div>
                  </div>
                  <div className="lqs-status-hint" title={c.hint}>{c.hint}</div>
                </div>
              )
            })}
          </div>

          {/* 时间轴 */}
          <div
            className="lqs-timeline"
            style={{
              padding: 16,
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              background: 'white',
              display: 'grid',
              gap: 12,
            }}
          >
            {/* 人物成长 / 走路动画: 轻量 SVG + CSS, 不依赖表变 / 点击逻辑, 只读 stage 与 age。 */}
            <CharacterStage
              stageId={stage.id}
              age={displayAge}
              progress={(age - 1) / 99}
              stageName={stage.name}
              regionName={region.name}
              familyName={family.name}
              familyId={familyId}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div className="lqs-timeline-head-age" style={{ fontSize: 18, fontWeight: 600 }}>
                {displayAge} 岁 · {stage.name}
              </div>
              <div className="lqs-timeline-head-range" style={{ color: '#6b7280', fontSize: 13 }}>
                当前阶段范围 {stage.ageStart}-{stage.ageEnd} 岁
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              step={0.1}
              value={age}
              onChange={(e) => {
                setIsTimelinePlaying(false)
                setAge(Number(e.target.value))
              }}
              style={{ width: '100%' }}
              aria-label="年龄滑块"
            />
            <div className="lqs-playback-controls" aria-label="时间轴自动播放控制">
              <button type="button" onClick={isTimelinePlaying ? pauseTimeline : resumeTimeline}>
                {isTimelinePlaying ? '暂停' : '继续'}
              </button>
              <button type="button" onClick={resetTimeline}>重置</button>
              <span className="lqs-playback-label">5 秒/岁</span>
              <div className="lqs-playback-speeds" role="group" aria-label="播放倍速">
                {PLAYBACK_SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    className={timelineSpeed === speed ? 'is-active' : ''}
                    aria-pressed={timelineSpeed === speed}
                    onClick={() => setTimelineSpeed(speed)}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
            <div
              className="lqs-timeline-bar"
              style={{
                position: 'relative',
                height: 28,
                background: '#f3f4f6',
                borderRadius: 999,
                overflow: 'hidden',
              }}
              aria-hidden="true"
            >
              {STAGES.map((s, i) => {
                const widthPct = ((s.ageEnd - s.ageStart + 1) / 101) * 100
                const leftPct = (s.ageStart / 100) * 100
                return (
                  <div
                    key={s.id}
                    className="lqs-stage-label"
                    style={{
                      position: 'absolute',
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      top: 0,
                      bottom: 0,
                      background: STAGE_COLORS[i % STAGE_COLORS.length],
                      opacity: stage.id === s.id ? 1 : 0.45,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      color: '#111827',
                      borderRight:
                        i < STAGES.length - 1 ? '1px solid rgba(255,255,255,0.6)' : 'none',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                    title={`${s.name} ${s.ageStart}-${s.ageEnd}`}
                  >
                    {s.name}
                  </div>
                )
              })}
              <div
                style={{
                  position: 'absolute',
                  left: `${age}%`,
                  top: -4,
                  bottom: -4,
                  width: 2,
                  background: '#111827',
                  pointerEvents: 'none',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: '#6b7280',
              }}
              aria-hidden="true"
            >
              <span>0</span>
              <span>20</span>
              <span>40</span>
              <span>60</span>
              <span>80</span>
              <span>100</span>
            </div>
          </div>

          {/* 四象限：成长 / 教育 / 职业 / 心理变化 */}
          <div
            className="lqs-cards"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 12,
            }}
          >
            {[
              { title: '成长', value: stage.growth },
              { title: '教育', value: stage.education },
              { title: '职业', value: stage.career },
              { title: '心理变化', value: stage.psychology },
            ].map((card) => (
              <div
                key={card.title}
                className="lqs-card"
                style={{
                  padding: 14,
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  background: 'white',
                }}
              >
                <div className="lqs-card-title" style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
                  {card.title}
                </div>
                <div className="lqs-card-body" style={{ lineHeight: 1.7 }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* 关键人生事件：该阶段天然挤在这个年龄段的选择节点。 */}
          <div
            className="lqs-key-events"
            style={{
              padding: 14,
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              background: 'white',
            }}
          >
            <div
              className="lqs-card-title"
              style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}
            >
              关键人生事件
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                lineHeight: 1.8,
                color: '#111827',
                fontSize: 14,
              }}
            >
              {stage.keyEvents.map((ev) => (
                <li key={ev}>{ev}</li>
              ))}
            </ul>
            <p
              style={{
                marginTop: 8,
                marginBottom: 0,
                color: '#6b7280',
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              这些事件在{stage.name}阶段会高频出现；错过或提前都可能触发重大路径切换。
            </p>
          </div>

          {/* 情境提示 */}
          <div
            className="lqs-context-hint"
            style={{
              padding: 14,
              border: '1px dashed #d1d5db',
              borderRadius: 12,
              background: '#fffbeb',
              color: '#92400e',
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            场景假设：在 <strong>{region.name}</strong> 出生、来自 <strong>{family.name}</strong>，
            当前正处于 <strong>{stage.name}</strong> 阶段（{displayAge} 岁）。
            本页面展示阶段结构与 WebGL 小人成长 / 走路动画，尚未接入随机抽样引擎。
          </div>

          </div>
          {/* alt-a: PC 右列 */}
          <div className="lqs-sim-col-right">
          {/* 当前阶段即将错过的人生窗口 · 机会成本 */}
          <section
            aria-labelledby="opportunity-cost-heading"
            style={{
              display: 'grid',
              gap: 12,
              padding: 16,
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              background: 'white',
            }}
          >
            <div style={{ display: 'grid', gap: 4 }}>
              <h2
                id="opportunity-cost-heading"
                style={{ fontSize: 18, margin: 0 }}
              >
                当前阶段即将错过的人生窗口 · 机会成本 · 感情线 / 事业线
              </h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: 13, lineHeight: 1.7 }}>
                以当前年龄 <strong>{displayAge} 岁</strong> 为参考点，按"个人天赋"筛选<strong>未来10年</strong>内最该抓住的机会窗口：
                <span style={{ color: '#b91c1c', fontWeight: 600 }}> 即将错过</span>、
                <span style={{ color: '#047857' }}> 当前可选</span>、
                <span style={{ color: '#1d4ed8' }}> 即将到来</span>、
                <span style={{ color: '#6b7280' }}> 刚刚错过</span>。
                "即将到来"仅展示<strong>未来10年</strong>内可触达的窗口；更远的窗口不在当前关注列表。“刚刚错过”仅列出过去<strong>5 年</strong>内刚关闭的窗口，错过太久的默认隐藏；可在筛选区切换“显示全部已错过”查看长期机会成本回顾。
              </p>
            </div>

            {/* 感情线 / 事业线 tab 切换 */}
            <div
              role="tablist"
              aria-label="感情线 / 事业线"
              style={{
                display: 'inline-flex',
                border: '1px solid #d1d5db',
                borderRadius: 999,
                background: '#f9fafb',
                padding: 2,
                width: 'fit-content',
              }}
            >
              {(
                [
                  { id: 'career', label: '事业线' },
                  { id: 'love', label: '感情线' },
                ] as const
              ).map((t) => {
                const active = trackTab === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTrackTab(t.id)}
                    className="lqs-track-tab"
                    style={{
                      fontSize: 13,
                      padding: '6px 14px',
                      borderRadius: 999,
                      border: 'none',
                      cursor: 'pointer',
                      background: active ? '#111827' : 'transparent',
                      color: active ? 'white' : '#374151',
                      transition: 'background 200ms ease, color 200ms ease',
                    }}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>

            {/* 个人天赋筛选 */}
            <div
              role="group"
              aria-label="个人天赋筛选"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 12, color: '#6b7280', marginRight: 4 }}>
                个人天赋：
              </span>
              {TALENTS.map((t) => {
                const active = selectedTalents.includes(t.id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTalent(t.id)}
                    aria-pressed={active}
                    style={{
                      fontSize: 12,
                      padding: '4px 10px',
                      border: `1px solid ${active ? '#111827' : '#d1d5db'}`,
                      borderRadius: 999,
                      background: active ? '#111827' : 'white',
                      color: active ? 'white' : '#111827',
                      cursor: 'pointer',
                    }}
                  >
                    {t.name}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => setSelectedTalents(TALENTS.map((t) => t.id))}
                style={{
                  fontSize: 12,
                  padding: '4px 10px',
                  border: '1px dashed #9ca3af',
                  borderRadius: 999,
                  background: 'transparent',
                  color: '#6b7280',
                  cursor: 'pointer',
                  marginLeft: 4,
                }}
              >
                全选
              </button>
              <label
                style={{
                  fontSize: 12,
                  color: '#6b7280',
                  marginLeft: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <input
                  type="checkbox"
                  checked={showMissed}
                  onChange={(e) => setShowMissed(e.target.checked)}
                />
                显示全部已错过（含 5 年外）
              </label>
            </div>

            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gap: 10,
              }}
            >
              {visibleWindows.length === 0 && (
                <li style={{ color: '#6b7280', fontSize: 13, padding: 12 }}>
                  当前筛选（天赋 / 地域 / 教养氛围）下没有命中的窗口；尝试放宽筛选条件。
                </li>
              )}
              {visibleWindows.map((win) => {
                const status = classifyWindow(age, win)
                // 刚错过（阈值内）vs 错过太久：在 missed 详情里区分。
                const missedYears = status === 'missed' ? age - win.ageEnd : 0
                const isRecentlyMissed = status === 'missed' && missedYears <= MISSED_LOOKBACK_YEARS
                const palette =
                  status === 'closing'
                    ? { border: '#f87171', bg: '#fef2f2', tag: '#b91c1c', label: '即将错过' }
                    : status === 'current'
                    ? { border: '#10b981', bg: '#ecfdf5', tag: '#047857', label: '当前可选' }
                    : status === 'upcoming'
                    ? { border: '#93c5fd', bg: '#eff6ff', tag: '#1d4ed8', label: '即将到来' }
                    : isRecentlyMissed
                    ? { border: '#9ca3af', bg: '#f3f4f6', tag: '#4b5563', label: `刚错过 ${Math.round(missedYears)} 年` }
                    : { border: '#d1d5db', bg: '#f9fafb', tag: '#6b7280', label: '已错过很久' }
                const talentNames = win.talents
                  .map((t) => TALENTS.find((x) => x.id === t)?.name)
                  .filter(Boolean)
                  .join(' · ')
                const regionNames = (win.regions ?? [])
                  .map((id) => REGIONS.find((r) => r.id === id)?.name)
                  .filter(Boolean)
                  .join(' / ')
                const bgNames = (win.familyBackgrounds ?? [])
                  .map((id) => FAMILY_BACKGROUNDS.find((b) => b.id === id)?.name)
                  .filter(Boolean)
                  .join(' / ')
                return (
                  <li
                    key={win.id}
                    aria-disabled={status === 'missed' ? 'true' : undefined}
                    style={{
                      border: `1px ${status === 'missed' ? 'dashed' : 'solid'} ${palette.border}`,
                      background: palette.bg,
                      borderRadius: 10,
                      padding: 12,
                      display: 'grid',
                      gap: 8,
                      opacity: status === 'missed' ? 0.65 : 1,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'baseline',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'white',
                          background: palette.tag,
                          padding: '2px 8px',
                          borderRadius: 999,
                        }}
                      >
                        {palette.label}
                      </span>
                      <span style={{ fontWeight: 600 }}>{win.title}</span>
                      <span style={{ color: '#6b7280', fontSize: 12 }}>
                        窗口 {win.ageStart}-{win.ageEnd} 岁
                      </span>
                      <span style={{ color: '#6b7280', fontSize: 12 }}>
                        · 天赋：{talentNames}
                      </span>
                      {regionNames && (
                        <span style={{ color: '#6b7280', fontSize: 12 }}>
                          · 地域：{regionNames}
                        </span>
                      )}
                      {bgNames && (
                        <span style={{ color: '#6b7280', fontSize: 12 }}>
                          · 教养：{bgNames}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                      }}
                      aria-label="候选分岔"
                    >
                      {win.branches.map((b) => {
                        // 老式字符串分支 → 仍为不可点击 chip。
                        if (!isBranchObject(b)) {
                          return (
                            <span
                              key={b}
                              style={{
                                fontSize: 12,
                                padding: '3px 8px',
                                border: `1px solid ${palette.border}`,
                                borderRadius: 6,
                                background: 'white',
                                color: '#111827',
                              }}
                            >
                              {b}
                            </span>
                          )
                        }
                        const expanded = expandedBranches.has(`${win.id}::${b.id}`)
                        const hasNext = !!b.next && b.next.length > 0
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => hasNext && toggleBranch(win.id, b.id)}
                            aria-expanded={hasNext ? expanded : undefined}
                            aria-controls={hasNext ? `subbr-${win.id}-${b.id}` : undefined}
                            disabled={!hasNext}
                            style={{
                              fontSize: 12,
                              padding: '3px 8px',
                              border: `1px solid ${palette.border}`,
                              borderRadius: 6,
                              background: expanded ? palette.bg : 'white',
                              color: '#111827',
                              cursor: hasNext ? 'pointer' : 'default',
                              fontFamily: 'inherit',
                              fontWeight: hasNext ? 600 : 400,
                            }}
                          >
                            {hasNext ? (expanded ? '▾ ' : '▸ ') : ''}{b.label}
                          </button>
                        )
                      })}
                    </div>
                    {/* 子分支展开区: 在父分叉 chip 行下方, 仅在点击展开后渲染。 */}
                    {win.branches.some(
                      (b) => isBranchObject(b) && expandedBranches.has(`${win.id}::${b.id}`),
                    ) && (
                      <div style={{ display: 'grid', gap: 6 }}>
                        {win.branches.map((b) =>
                          isBranchObject(b) &&
                          expandedBranches.has(`${win.id}::${b.id}`) &&
                          b.next &&
                          b.next.length > 0 ? (
                            <div
                              key={`expand-${b.id}`}
                              id={`subbr-${win.id}-${b.id}`}
                              role="region"
                              aria-label={`子分支: ${b.label}`}
                              style={{
                                border: `1px dashed ${palette.border}`,
                                background: 'white',
                                borderRadius: 8,
                                padding: '8px 10px',
                                display: 'grid',
                                gap: 6,
                              }}
                            >
                              <div style={{ fontSize: 12, color: palette.tag, fontWeight: 600 }}>
                                下一层分支 · {b.label}
                              </div>
                              <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>
                                {b.next.map((sub, idx) => {
                                  const domainTag = sub.domain
                                    ? ({
                                        education: { name: '教育', color: '#1d4ed8' },
                                        migration: { name: '迁移', color: '#0d9488' },
                                        career: { name: '职业', color: '#b45309' },
                                        asset: { name: '资产', color: '#9333ea' },
                                        health: { name: '健康', color: '#16a34a' },
                                        family: { name: '家庭', color: '#db2777' },
                                      } as const)[sub.domain]
                                    : null
                                  return (
                                    <li key={idx} style={{ fontSize: 12, lineHeight: 1.6 }}>
                                      {domainTag && (
                                        <span
                                          style={{
                                            display: 'inline-block',
                                            fontSize: 10,
                                            color: 'white',
                                            background: domainTag.color,
                                            padding: '1px 6px',
                                            borderRadius: 999,
                                            marginRight: 6,
                                            verticalAlign: 'middle',
                                          }}
                                        >
                                          {domainTag.name}
                                        </span>
                                      )}
                                      <strong>{sub.label}</strong>
                                      {sub.longTermLoss && (
                                        <span style={{ color: '#374151' }}>
                                          {' — '}{sub.longTermLoss}
                                        </span>
                                      )}
                                    </li>
                                  )
                                })}
                              </ul>
                            </div>
                          ) : null,
                        )}
                      </div>
                    )}
                    {(status === 'closing' || status === 'missed') && (
                      <div
                        style={{
                          fontSize: 12,
                          lineHeight: 1.6,
                          color: status === 'closing' ? '#7f1d1d' : '#374151',
                        }}
                      >
                        {status === 'closing' && (
                          <strong style={{ marginRight: 4 }}>
                            剩约 {Math.max(0, Math.round(win.ageEnd - age))} 年：
                          </strong>
                        )}
                        {win.longTermLoss}
                      </div>
                    )}
                    {status === 'upcoming' && (
                      <div
                        style={{
                          fontSize: 12,
                          lineHeight: 1.6,
                          color: '#1e3a8a',
                        }}
                      >
                        距开启还有约 {Math.round(win.ageStart - age)} 年，可提前为该分岔做准备。
                      </div>
                    )}
                    {status === 'current' && (
                      <div
                        style={{
                          fontSize: 12,
                          lineHeight: 1.6,
                          color: '#065f46',
                        }}
                      >
                        正处于窗口中段；选择不同分支会显著改变后续 LifeOutcome 维度上的差值向量。
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
          </div>
        </div>
      </div>
    </section>
  )
}
