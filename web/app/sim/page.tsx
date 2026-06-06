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

// 人生分岔 / 机会成本数据
// 来源：docs/phase3-opportunity-cost.md 中的 8 个 v0 决策节点。
// 真实职业 / 决策数据文件（如 web/data/careers.zh.json）暂不存在，这里使用最小 fallback。
type OpportunityWindow = {
  id: string
  title: string
  ageStart: number
  ageEnd: number
  branches: string[] // 候选分岔（≥3）
  longTermLoss: string // 错过窗口后的长期成本提示
}

const OPPORTUNITY_WINDOWS: OpportunityWindow[] = [
  {
    id: 'gaokao',
    title: '高考志愿（地理 / 专业）',
    ageStart: 17,
    ageEnd: 20,
    branches: ['一线名校冷门专业', '本地中游学校热门专业', 'gap 一年再战', '直接就业 / 职校'],
    longTermLoss: '错过这扇门：地理圈层 + 头 10 年职业斜率几乎一锤定音，后续要靠跳槽 / 读研追平。',
  },
  {
    id: 'first_love_marriage',
    title: '初恋是否进入婚姻',
    ageStart: 22,
    ageEnd: 30,
    branches: ['结婚', '分手另寻', '长期不结但同居', '丁克协议'],
    longTermLoss: '错过这扇门：高质量长期亲密关系窗口收窄；意义感与自由度的权衡只能靠后置补偿。',
  },
  {
    id: 'career_start',
    title: '初次职业起步（行业 / 城市）',
    ageStart: 22,
    ageEnd: 27,
    branches: ['进大厂打底', '加入早期 startup', '考公 / 体制内', '出国就业'],
    longTermLoss: '错过这扇门：起步行业的红利期不会等人，转行成本会随年龄指数上升。',
  },
  {
    id: 'mid_career_pivot',
    title: '35 岁要不要跳出舒适区',
    ageStart: 33,
    ageEnd: 38,
    branches: ['留在大厂熬资历', '转行新赛道', '读个学位', 'gap 一年'],
    longTermLoss: '错过这扇门：剩余职业窗口缩短，转型机会成本急剧放大；意义感缺口可能延续到退休。',
  },
  {
    id: 'second_child',
    title: '生不生二胎',
    ageStart: 30,
    ageEnd: 40,
    branches: ['只生一胎', '生二胎', '不生育', '领养'],
    longTermLoss: '错过这扇门：生育窗口随年龄关闭；老年期家庭拓扑结构无法再调整。',
  },
  {
    id: 'startup_vs_bigco',
    title: '创业 vs 大厂',
    ageStart: 28,
    ageEnd: 42,
    branches: ['大厂打工', '独立创业', '加入早期 startup', '自由职业 / freelance'],
    longTermLoss: '错过这扇门：长尾收益的厚右尾几乎无法在中年后复制；窄峰路径继续走下去。',
  },
  {
    id: 'mortgage_vs_rent',
    title: '房贷 vs 租房',
    ageStart: 28,
    ageEnd: 45,
    branches: ['一线买房高杠杆', '二三线买房低杠杆', '长期租房 + 投资', '买地 / 自建'],
    longTermLoss: '错过这扇门：杠杆放大期错过；地理与资产绑定结构很难在 50 岁后重塑。',
  },
  {
    id: 'study_abroad',
    title: '出国深造 vs 在地工作',
    ageStart: 21,
    ageEnd: 32,
    branches: ['出国读研 + 留下', '出国读研 + 回国', '在地读研', '直接工作'],
    longTermLoss: '错过这扇门：身份 / 语言 / 国际网络的重置期关闭，反事实 B 几乎不可达。',
  },
]

type OpportunityStatus = 'upcoming' | 'current' | 'missed'

function classifyWindow(age: number, win: OpportunityWindow): OpportunityStatus {
  if (age < win.ageStart) return 'upcoming'
  if (age > win.ageEnd) return 'missed'
  return 'current'
}

export default function SimPage() {
  const [age, setAge] = useState<number>(18)
  const [regionId, setRegionId] = useState<string>(REGIONS[1].id)
  const [familyId, setFamilyId] = useState<string>(FAMILIES[1].id)

  const region = REGIONS.find((r) => r.id === regionId) ?? REGIONS[0]
  const family = FAMILIES.find((f) => f.id === familyId) ?? FAMILIES[0]
  const stage = useMemo(() => stageOfAge(age), [age])

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
          {/* 人生分岔 / 长期机会成本 */}
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
                人生分岔 · 长期机会成本
              </h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: 13, lineHeight: 1.7 }}>
                以当前年龄 <strong>{age} 岁</strong> 为参考点，列出 v0 内置的 8 类机会窗口：
                <span style={{ color: '#1d4ed8' }}> 即将到来</span>、
                <span style={{ color: '#047857' }}> 当前可选分岔</span>、
                <span style={{ color: '#b91c1c' }}> 已错过窗口</span>。
                每个窗口给出 3-4 条候选分支与错过后的长期机会成本提示。
              </p>
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
              {OPPORTUNITY_WINDOWS.map((win) => {
                const status = classifyWindow(age, win)
                const palette =
                  status === 'current'
                    ? { border: '#10b981', bg: '#ecfdf5', tag: '#047857', label: '当前可选分岔' }
                    : status === 'upcoming'
                    ? { border: '#93c5fd', bg: '#eff6ff', tag: '#1d4ed8', label: '即将到来' }
                    : { border: '#fca5a5', bg: '#fef2f2', tag: '#b91c1c', label: '已错过窗口' }
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
                    {status === 'missed' && (
                      <div
                        style={{
                          fontSize: 12,
                          lineHeight: 1.6,
                          color: '#7f1d1d',
                        }}
                      >
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
                        正处于该窗口期；选择不同分支会显著改变后续 LifeOutcome 维度上的差值向量。
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
