'use client'

import { useMemo, useState } from 'react'

type LifeStage = {
  id: string
  name: string
  ageStart: number
  ageEnd: number
  growth: string
  education: string
  career: string
  psychology: string
}

// 与 engine/_STAGES 对齐：6 个阶段覆盖 0-100 岁全程。
// 若后续 src/data/lifeStages.zh.json 落地，可替换为 JSON 加载。
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
  },
  {
    id: 'early_adult',
    name: '青年',
    ageStart: 20,
    ageEnd: 39,
    growth: '体能与认知巅峰；建立独立的生活方式。',
    education: '大学 → 研究生 / 入职培训；学习方式从被动转为自驱。',
    career: '职业起步、跳槽、首次晋升；积累人脉与专业资本。',
    psychology: '亲密关系、组建家庭；自我效能感与意义感成为核心议题。',
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
  },
]

const STAGE_COLORS = ['#fde68a', '#fca5a5', '#86efac', '#93c5fd', '#c4b5fd', '#f9a8d4']

type Region = { id: string; name: string; brief: string }
type Family = { id: string; name: string; brief: string }

const REGIONS: Region[] = [
  { id: 'tier1', name: '一线城市', brief: '资源密度最高，竞争与机会同时拉满。' },
  { id: 'tier2', name: '省会 / 新一线', brief: '机会丰富，生活成本相对一线更低，性价比之地。' },
  { id: 'tier34', name: '三四线城市', brief: '节奏稳定，发展机会与天花板均偏低。' },
  { id: 'county', name: '县城 / 乡镇', brief: '熟人社会，关系链强，但圈层流动通常需要离开。' },
  { id: 'rural', name: '农村', brief: '与土地紧密相连，教育与医疗资源相对稀缺。' },
  { id: 'overseas', name: '海外', brief: '异质文化环境，高语言成本带来潜在的跨界红利。' },
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
  return (
    STAGES.find((s) => age >= s.ageStart && age <= s.ageEnd) ??
    STAGES[STAGES.length - 1]
  )
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

// 当前阶段即将错过的人生窗口（OpportunityWindow）。
// 每条窗口标注关联的"个人天赋"，便于按天赋筛选当下最该抓住的机会成本。
// 文案约束：
//  - 涉及亲密关系（如初恋）仅描述长期关系经验与机会成本，不写性化未成年人内容。
//  - 涉及未成年人训练 / 表演路径，仅描述技能 / 选材窗口与代价，不做外貌物化或群体标签。
type OpportunityWindow = {
  id: string
  title: string
  ageStart: number
  ageEnd: number
  talents: Talent[]
  branches: string[] // 候选分岔（≥3）
  longTermLoss: string // 错过窗口后的长期机会成本提示
}

const OPPORTUNITY_WINDOWS: OpportunityWindow[] = [
  {
    id: 'art_child_training',
    title: '艺术专业训练（乐器 / 舞蹈 / 绘画）',
    ageStart: 4,
    ageEnd: 15,
    talents: ['arts'],
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
    branches: ['签约童星公司', '校园文艺骨干', '业余兴趣班', '保护性远离镜头'],
    longTermLoss:
      '错过这扇门：早期镜头经验与行业人脉无法在成年后补；但放弃的反面是更完整、不被消费的童年——这是一笔需要家长替孩子代算的机会成本。',
  },
  {
    id: 'esports_pro',
    title: '电竞职业选手窗口',
    ageStart: 13,
    ageEnd: 22,
    talents: ['tech_esports', 'sports'],
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
    branches: ['投入高强度训练打底', '维持中等运动量', '只做最低保养', '完全久坐'],
    longTermLoss:
      '错过这扇门：肌肉量与最大摄氧量的"利息复利"基底没攒下，40 岁后慢病与衰退斜率会更陡，长期医疗与生活质量成本被前置锁定。',
  },
  {
    id: 'first_love',
    title: '初恋 / 长期亲密关系起步',
    ageStart: 17,
    ageEnd: 24,
    talents: ['social', 'expression'],
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
    branches: ['头部公司校招 offer', '体制内 / 央国企校招岗', '出国 / 读研延迟使用', '直接放弃走社招'],
    longTermLoss:
      '错过这扇门：应届身份只用一次，许多大厂 / 央国企 / 选调 / 定向名额仅向应届开放，社招通道在岗位密度与起薪斜率上都不等价。',
  },
  {
    id: 'civil_servant_age',
    title: '公务员 / 选调生报考资格（年龄上限）',
    ageStart: 22,
    ageEnd: 35,
    talents: ['discipline', 'academic'],
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
    branches: ['一次定型深耕', '主动转一次行', '复合跨界（如技术 + 商业）', '自由职业起步'],
    longTermLoss:
      '错过这扇门：转行的"沉没成本 + 学习曲线 + 薪资断档"三件套随年龄指数上升，35 岁后职业选择权显著收紧。',
  },
  {
    id: 'study_abroad',
    title: '出国深造 / 留学窗口',
    ageStart: 20,
    ageEnd: 32,
    talents: ['academic'],
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
    branches: ['先成家再立业', '先立业后成家', '不婚但生育', '丁克 / 不育'],
    longTermLoss:
      '错过这扇门：生育力随年龄客观下降，二胎窗口随之收窄；老年期家庭拓扑结构无法再重置，照护与陪伴的资源结构被锁定。',
  },
  {
    id: 'mortgage_leverage',
    title: '房贷 / 信贷杠杆窗口',
    ageStart: 25,
    ageEnd: 45,
    talents: ['business'],
    branches: ['一线高杠杆买房', '二三线低杠杆买房', '长期租房 + 投资', '买地 / 自建'],
    longTermLoss:
      '错过这扇门：银行按揭年限随年龄递减（通常贷款期 + 年龄 ≤ 70），杠杆放大期一旦错过几乎不可重做，地理与资产绑定结构被冻结。',
  },
  {
    id: 'p_to_m',
    title: '技术 / 专业转管理岗（P→M）',
    ageStart: 28,
    ageEnd: 38,
    talents: ['business', 'social'],
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
    branches: ['一路读到 tenure', '读博后转工业界', '硕士止步 + 工业界研究岗', '完全离开学术'],
    longTermLoss:
      '错过这扇门：高校招聘普遍卡 35 / 40 岁与博士毕业年限；过窗后回学术界基本只能走兼职 / 客座 / 产业教授，独立 PI 路径关闭。',
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

export default function SimPage() {
  const [age, setAge] = useState<number>(18)
  const [regionId, setRegionId] = useState<string>(REGIONS[1].id)
  const [familyId, setFamilyId] = useState<string>(FAMILIES[1].id)
  const [selectedTalents, setSelectedTalents] = useState<Talent[]>(
    TALENTS.map((t) => t.id)
  )
  const [showMissed, setShowMissed] = useState<boolean>(false)

  const region = REGIONS.find((r) => r.id === regionId) ?? REGIONS[0]
  const family = FAMILIES.find((f) => f.id === familyId) ?? FAMILIES[0]
  const stage = useMemo(() => stageOfAge(age), [age])

  const toggleTalent = (id: Talent) => {
    setSelectedTalents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const visibleWindows = useMemo(() => {
    const byTalent = OPPORTUNITY_WINDOWS.filter((w) =>
      w.talents.some((t) => selectedTalents.includes(t))
    )
    const withMissed = showMissed
      ? byTalent
      : byTalent.filter((w) => classifyWindow(age, w) !== 'missed')
    const order: Record<OpportunityStatus, number> = {
      closing: 0,
      current: 1,
      upcoming: 2,
      missed: 3,
    }
    return [...withMissed].sort((a, b) => {
      const sa = order[classifyWindow(age, a)]
      const sb = order[classifyWindow(age, b)]
      if (sa !== sb) return sa - sb
      return a.ageStart - b.ageStart
    })
  }, [age, selectedTalents, showMissed])

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <header style={{ display: 'grid', gap: 6 }}>
        <h1 className="lqs-sim-title" style={{ fontSize: 32, margin: 0 }}>人生模拟 Demo</h1>
        <p className="lqs-sim-lede" style={{ color: '#6b7280', margin: 0, lineHeight: 1.7 }}>
          0-100岁 全程时间轴 · 选择出生地域与出身家庭，再拖动滑块查看不同年龄段的成长 / 教育 / 职业 / 心理变化（demo 不做人物成长动画）。
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
              onChange={(e) => setRegionId(e.target.value)}
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
            <div style={{ fontWeight: 600, marginBottom: 8 }}>出身家庭</div>
            <select
              value={familyId}
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
              {FAMILIES.map((f) => (
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

        {/* 主区 */}
        <div style={{ display: 'grid', gap: 16, minWidth: 0 }}>
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
                {age} 岁 · {stage.name}
              </div>
              <div className="lqs-timeline-head-range" style={{ color: '#6b7280', fontSize: 13 }}>
                当前阶段范围 {stage.ageStart}-{stage.ageEnd} 岁
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              style={{ width: '100%' }}
              aria-label="年龄滑块"
            />
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
            当前正处于 <strong>{stage.name}</strong> 阶段（{age} 岁）。
            本页面仅展示阶段结构，尚未接入随机抽样引擎，因此不会播放人物成长动画。
          </div>

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
                当前阶段即将错过的人生窗口 · 机会成本
              </h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: 13, lineHeight: 1.7 }}>
                以当前年龄 <strong>{age} 岁</strong> 为参考点，按"个人天赋"筛选当下最该抓住的机会窗口：
                <span style={{ color: '#b91c1c', fontWeight: 600 }}> 即将错过</span>、
                <span style={{ color: '#047857' }}> 当前可选</span>、
                <span style={{ color: '#1d4ed8' }}> 即将到来</span>、
                <span style={{ color: '#6b7280' }}> 已关闭</span>。
                "已关闭"窗口默认隐藏，可在筛选区切换查看长期机会成本回顾。
              </p>
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
                显示已关闭窗口
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
                  当前"个人天赋"筛选下没有命中的窗口；尝试多勾选几个天赋类别。
                </li>
              )}
              {visibleWindows.map((win) => {
                const status = classifyWindow(age, win)
                const palette =
                  status === 'closing'
                    ? { border: '#f87171', bg: '#fef2f2', tag: '#b91c1c', label: '即将错过' }
                    : status === 'current'
                    ? { border: '#10b981', bg: '#ecfdf5', tag: '#047857', label: '当前可选' }
                    : status === 'upcoming'
                    ? { border: '#93c5fd', bg: '#eff6ff', tag: '#1d4ed8', label: '即将到来' }
                    : { border: '#d1d5db', bg: '#f9fafb', tag: '#6b7280', label: '已关闭' }
                const talentNames = win.talents
                  .map((t) => TALENTS.find((x) => x.id === t)?.name)
                  .filter(Boolean)
                  .join(' · ')
                return (
                  <li
                    key={win.id}
                    style={{
                      border: `1px solid ${palette.border}`,
                      background: palette.bg,
                      borderRadius: 10,
                      padding: 12,
                      display: 'grid',
                      gap: 8,
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
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                      }}
                      aria-label="候选分岔"
                    >
                      {win.branches.map((b) => (
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
                      ))}
                    </div>
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
                            剩约 {Math.max(0, win.ageEnd - age)} 年：
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
                        距开启还有约 {win.ageStart - age} 年，可提前为该分岔做准备。
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
    </section>
  )
}
