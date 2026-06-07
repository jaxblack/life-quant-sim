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

// 人生窗口的领域线：用于"感情线 / 事业线"切换
// 'love' = 感情线（婚恋 / 亲密关系），'career' = 事业线（学业 / 职业 / 移民 / 资产）
// 'both' = 两条线都要展示的窗口（如生育/家庭，事业与亲密关系都受影响）
type Track = 'love' | 'career' | 'both'

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
  track: Track // 感情线 / 事业线 / 两者都涉及
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
    talents: ['tech_esports', 'sports'],
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
    track: 'career',
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
    branches: ['Express Entry 独立申请', 'PNP 省提名项目', '进学 + 毕业工签转 PR', '放弃加拿大路径'],
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
    branches: ['一本护照上身份变革', '多本护照多身份组合', '只走长期居留', '完全不出境'],
    longTermLoss:
      '错过这扇门：护照升级与投资身份项目资金门槛随全球政策随年上调，中文跨境资产配置与子女教育路径的可选项同步收窄。',
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
  // 新增：家庭背景过滤（多选）与感情线 / 事业线 tab。
  const [familyBg, setFamilyBg] = useState<FamilyBackground[]>(
    FAMILY_BACKGROUNDS.map((b) => b.id)
  )
  const [trackTab, setTrackTab] = useState<'love' | 'career'>('career')

  const region = REGIONS.find((r) => r.id === regionId) ?? REGIONS[0]
  const family = FAMILIES.find((f) => f.id === familyId) ?? FAMILIES[0]
  const stage = useMemo(() => stageOfAge(age), [age])

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

  // 根据“家庭背景”多选过滤出“出身家庭”可选项。未选任何背景时，退回全部。
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

  // 当前状态卡：资产 / 身份 / 学历 / 身体机能。
  // 仅以 (age, region, family) 派生出“趋势”字符，不是真实模拟输出，用于 demo 中红/绿涨跌可视化。
  type StatTrend = 'up' | 'down' | 'flat'
  type StatusCard = { key: string; label: string; value: string; trend: StatTrend; hint: string }
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
    const educationTrend: StatTrend = age < 25 ? 'up' : age < 60 ? 'flat' : 'down'

    // 资产趋势：与出身家庭与年龄双向相关。同一家庭起点，青年-中年为上升期，高龄为衰退期。
    const wealthBaseline =
      familyId === 'wealthy'
        ? '高位 / 代际资本丰厚'
        : familyId === 'middle'
        ? '中位 / 双职工资本'
        : familyId === 'working'
        ? '起点偏低 / 主要靠工资'
        : '起点低 / 代际可调动资金有限'
    const wealthTrend: StatTrend =
      age < 22 ? 'flat' : age < 55 ? 'up' : age < 70 ? 'flat' : 'down'

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
    const bodyTrend: StatTrend = age < 25 ? 'up' : age < 40 ? 'flat' : 'down'

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
    const identityHint =
      regionId === 'overseas'
        ? '海外身份 / 可能需额外签证'
        : regionId === 'tier1'
        ? '一线城市身份 / 高资源密度'
        : regionId === 'tier2'
        ? '新一线身份 / 资源中上'
        : regionId === 'tier34'
        ? '三四线身份 / 资源中等'
        : regionId === 'county'
        ? '县城身份 / 依赖熟人网络'
        : '农村身份 / 跨阶层需要离开'
    const identityTrend: StatTrend = age < 35 ? 'up' : age < 60 ? 'flat' : 'down'

    return [
      {
        key: 'wealth',
        label: '资产',
        value: wealthBaseline,
        trend: wealthTrend,
        hint:
          age < 22
            ? '仍主要以家庭资本为主，未进入主动积累阶段。'
            : age < 55
            ? '主动积累期，资产增长与职业选择强相关。'
            : age < 70
            ? '退休过渡期；资产以保值为主。'
            : '主要依赖存量与社会保障，增长趣近于零。',
      },
      {
        key: 'identity',
        label: '身份',
        value: identityRole,
        trend: identityTrend,
        hint: identityHint,
      },
      {
        key: 'education',
        label: '学历',
        value: educationStage,
        trend: educationTrend,
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
        hint:
          age < 30
            ? '体能 / 反应 / 恢复均处于峰值期。'
            : age < 50
            ? '进入保育期；运动习惯决定后期斜率。'
            : '慢病管理期；医疗与生活质量成本上升。',
      },
    ]
  }, [age, familyId, regionId])

  // 未来10年关注窗：只展示当前年龄起未来最多 10 年内可触达的窗口。
  // 超过 10 年的"即将到来"窗口被视为非当前关注，在主列表中隐藏。
  const FUTURE_HORIZON_YEARS = 10
  const visibleWindows = useMemo(() => {
    const byTalent = OPPORTUNITY_WINDOWS.filter((w) =>
      w.talents.some((t) => selectedTalents.includes(t))
    )
    // 感情线 / 事业线 tab 过滤：track === 'both' 的窗口两边都展示。
    const byTrack = byTalent.filter(
      (w) => w.track === trackTab || w.track === 'both'
    )
    const withMissed = showMissed
      ? byTrack
      : byTrack.filter((w) => classifyWindow(age, w) !== 'missed')
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
      return a.ageStart - b.ageStart
    })
  }, [age, selectedTalents, showMissed, trackTab])

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <header style={{ display: 'grid', gap: 6 }}>
        <h1 className="lqs-sim-title" style={{ fontSize: 32, margin: 0 }}>人生模拟 Demo</h1>
        <p className="lqs-sim-lede" style={{ color: '#6b7280', margin: 0, lineHeight: 1.7 }}>
          0-100岁 全程时间轴 · 选择出生地域与出身家庭，拖动滑块查看不同年龄段的状态变化；demo 仅使用轻量 CSS 过渡动画，不做人物成长动画。
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
              勾选教养氛围会限定下方"出身家庭"下拉中最常与之共现的家庭类型；不是严格一对一。
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

        {/* 主区 */}
        <div style={{ display: 'grid', gap: 16, minWidth: 0 }}>
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
              return (
                <div
                  key={c.key}
                  className="lqs-status-card lqs-fade-in"
                  data-trend={c.trend}
                  style={{
                    padding: 10,
                    border: `1px solid ${border}`,
                    background: bg,
                    borderRadius: 10,
                    display: 'grid',
                    gap: 4,
                    transition: 'background 200ms ease, border-color 200ms ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{c.label}</span>
                    <span
                      aria-label={c.trend === 'up' ? '上涨' : c.trend === 'down' ? '下跌' : '持平'}
                      style={{ color, fontWeight: 700, fontSize: 13 }}
                    >
                      {arrow}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{c.value}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>{c.hint}</div>
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
                当前阶段即将错过的人生窗口 · 机会成本 · 感情线 / 事业线
              </h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: 13, lineHeight: 1.7 }}>
                以当前年龄 <strong>{age} 岁</strong> 为参考点，按"个人天赋"筛选<strong>未来10年</strong>内最该抓住的机会窗口：
                <span style={{ color: '#b91c1c', fontWeight: 600 }}> 即将错过</span>、
                <span style={{ color: '#047857' }}> 当前可选</span>、
                <span style={{ color: '#1d4ed8' }}> 即将到来</span>、
                <span style={{ color: '#6b7280' }}> 已关闭</span>。
                "即将到来"仅展示<strong>未来10年</strong>内可触达的窗口；更远的窗口不在当前关注列表。"已关闭"窗口默认隐藏，可在筛选区切换查看长期机会成本回顾。
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
