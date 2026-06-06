# 初始条件（Initial Conditions）

本文档定义 life-quant-sim 在「角色出生」时一次性采样的 **初始条件向量**。 这些维度在仿真开始前就被固定（或大部分固定），后续阶段的事件命中率、能力上限、 反应曲线、价值打分都会以它们为基底进行调制。

> 设计原则：**少而真**。每个维度都必须能在现实世界找到 anchor（统计学样本、
> 量表、人口学指标），不引入「玄学」字段；不能 anchor 的部分统一塞进
> `luck_seed`，以承载未建模随机性，但**不允许**把任何一个维度退化成
> 「神秘加成」。

---

## 维度索引

| # | 维度 key                  | 中文名         | 主要现实 anchor                          |
| - | ------------------------- | -------------- | ---------------------------------------- |
| 1 | `family_ses`              | 家庭社经地位   | 收入分位、父母教育、Hollingshead         |
| 2 | `birth_region`            | 出生地与文化   | 国家统计局城市分级、户籍                 |
| 3 | `genetic_temperament`     | 遗传与气质     | 身高分布、Cattell g、Kagan 气质类型      |
| 4 | `big_five`                | Big Five 人格  | NEO-PI-R / BFI-2 量表                    |
| 5 | `health_baseline`         | 健康基线       | WHO 出生健康指标、慢病登记               |
| 6 | `attachment_style`        | 依恋类型       | Bowlby / Ainsworth 陌生情境分类          |
| 7 | `generational_dividend`   | 历史时代红利   | 出生队列（cohort）与宏观经济曲线         |
| 8 | `luck_seed`               | 运气种子       | 整数 PRNG 种子，承载未建模随机性         |

下文给每个维度列出：**子参数 / 取值范围 / 现实 anchor / 对人生价值的影响通道**。

---

## 1. 家庭社经地位 family_ses

家庭在社会经济阶梯上的相对位置。**最强的单维度预测变量**之一 —— 决定教育路径、 婚配池、早期医疗、风险耐受度。

**子参数**

- `income_percentile` —— 家庭收入分位，0.0 ~ 1.0（按出生年所在国家分布归一）
- `parent_edu_max` —— 父母最高学历，枚举：`primary` / `junior` / `senior` /
`vocational` / `bachelor` / `master_plus`
- `parent_occupation_prestige` —— 父母职业声望分位，0.0 ~ 1.0
（参照 Treiman 国际职业声望量表的本土改写）
- `hukou_tier` —— 户籍/出生登记所属城市等级，枚举：
`tier1` / `new_tier1` / `tier2` / `tier3_4` / `county` / `rural`
- `wealth_buffer_months` —— 家庭可支撑无收入生活的月数，0 ~ 60+（截断）

**现实 anchor**

- 国家统计局家庭可支配收入分位（按年份）
- 第七次全国人口普查的父母学历分布
- Hollingshead Four Factor Index 的简化版

**对人生价值的影响通道**

family_ses 几乎参与所有阶段的事件权重计算：童年期影响营养、玩具、课外活动命中率； 少年期影响升学路径与城市迁徙概率；青年期通过婚配市场与首次工作的起薪阶梯 进入「资本积累 vs 工资劳动」分叉；中年期决定能否承担一次重大失败（创业失败、 重病、离婚）而不进入「降阶级」轨道。低 SES 角色的「向上跃迁」事件命中率显著低于 高 SES，但**跃迁成功带来的价值增量**反而更高（边际效用递减的反面）。

---

## 2. 出生地与文化 birth_region

出生地决定了角色在仿真初期所处的**机会密度**与**文化脚本**。

**子参数**

- `region_tier` —— 区域等级，枚举：`tier1` / `new_tier1` / `tier3_4` /
`county` / `rural`（与 hukou_tier 可能不同 —— 出生地 ≠ 户籍）
- `culture_script` —— 文化脚本，枚举：`east_asian_collective` /
`southern_clan` / `northern_industrial` / `coastal_open` / `inland_agrarian`
- `lang_native` —— 母语/方言，枚举：`mandarin` / `cantonese` / `wu` /
`min` / `other`
- `religion_exposure` —— 童年期宗教/民间信仰浸润强度，0.0 ~ 1.0
- `migration_at_birth` —— 出生后 0 ~ 6 岁是否随父母迁徙，bool

**现实 anchor**

- 国家统计局城市分级与常住/户籍人口对照
- WVS（World Values Survey）中国大陆样本的文化维度
- 中国语言地图集的方言分区

**对人生价值的影响通道**

birth_region 主要通过「**机会密度**」与「**默认人生脚本**」两条通道生效： 一线城市的事件库更厚（更高的求学、求职、社交事件命中率），但同时压力事件 （房价、内卷）权重更高；县域与乡村的「稳定家庭事件」命中率高，但「跃迁事件」 命中率低。culture_script 影响 Big Five × 情境的反应曲线 —— 例如东亚集体主义脚本 下，高 N（神经质）+ 强孝道压力会显著提高「中年自我怀疑」事件的负向价值贡献。

---

## 3. 遗传与气质 genetic_temperament

出生即被「写死」的生物学基线。模型不模拟分子机制，只取**少量可观测的人口学 近似**作为代理变量。

**子参数**

- `height_percentile` —— 成年身高分位，0.0 ~ 1.0（按性别 × 出生年）
- `appearance_percentile` —— 外貌吸引力分位，0.0 ~ 1.0
（参照 attractiveness rating 的群体均值；**承认这是社会建构而非客观值**）
- `g_factor` —— 一般智力因子分位，0.0 ~ 1.0（参照 Cattell-Horn-Carroll 的 g）
- `attention_temperament` —— Kagan 气质类型，枚举：`high_reactive` /
`low_reactive` / `mixed`
- `extraversion_seed` —— 外向性先天基线（与 Big Five.E 解耦，作为先天底色），
  0.0 ~ 1.0

**现实 anchor**

- 中国成年男女身高/体重分布（疾控中心 2020）
- Hamermesh 的 "Beauty Pays" 研究中的颜值分位回归
- Cattell-Horn-Carroll 智力模型
- Kagan 高/低反应型婴儿的纵向追踪

**对人生价值的影响通道**

genetic_temperament 主要参与「**人际事件命中率调制**」与「**学业天花板**」： 高 appearance 提升恋爱/招聘事件的命中率与价值；高 g_factor 抬高学业事件的成功率 与 ceiling；attention_temperament 决定童年期的事件**反应强度**（high_reactive 对负面事件的损伤更大，但同样的正向事件带来更高的快乐峰值）。**重要约束**： 此维度不影响道德/亲密深度类事件的价值打分 —— 我们不让仿真退化成「颜值/智商决定 一切」的反乌托邦。

---

## 4. Big Five 人格 big_five

工业心理学黄金标准，作为**全周期事件反应曲线**的核心调制器。

**子参数**

- `openness` —— 开放性，0.0 ~ 1.0
- `conscientiousness` —— 尽责性，0.0 ~ 1.0
- `extraversion` —— 外向性，0.0 ~ 1.0
- `agreeableness` —— 宜人性，0.0 ~ 1.0
- `neuroticism` —— 神经质，0.0 ~ 1.0

**现实 anchor**

- NEO-PI-R（240 项）/ BFI-2（60 项）量表
- 中国大学生 BFI 常模（彭凯平等 2008 修订版）
- McCrae & Costa 的跨文化稳定性研究

**对人生价值的影响通道**

Big Five 的每个维度都对接到具体的事件类与价值通道：
- **O** 高 → 探索类事件（迁徙、转行、艺术、创业）命中率与价值收益↑；常规化事件
价值贡献↓。
- **C** 高 → 长期目标事件（学业、升职、储蓄）成功率↑；冲动消费/上瘾事件命中率↓。
- **E** 高 → 社交事件命中率↑，独处类负面事件抗性↑。
- **A** 高 → 亲密深度事件价值↑，但谈判/对抗类事件价值↓（被剥削概率↑）。
- **N** 高 → 所有负面事件的损伤系数↑（×1.2 ~ ×1.8 区间），正面事件的快乐峰值↓。

**约束**：Big Five 在 18 岁后基本稳定（McCrae 跨文化纵向研究），仿真中允许
±0.05/decade 的漂移，不允许大幅突变。

---

## 5. 健康基线 health_baseline

出生时的健康资本与终生健康事件的先验。

**子参数**

- `birth_health_score` —— 综合健康基线，0.0 ~ 1.0
（Apgar + 早产 + 出生体重的合成分）
- `congenital_chronic` —— 先天慢病列表，枚举集合：`none` / `asthma` /
`diabetes_t1` / `cardiac` / `genetic_other`
- `parent_age_at_birth` —— 母亲生育年龄，整数 15 ~ 50+
（高龄产妇带来的染色体异常先验）
- `vaccination_complete` —— 0~6 岁疫苗完成率，0.0 ~ 1.0
- `early_nutrition_index` —— 0~3 岁营养指数，0.0 ~ 1.0（影响成年身高与认知上限）

**现实 anchor**

- WHO 新生儿健康评估指南
- 中国出生缺陷监测年报
- DOHaD（Developmental Origins of Health and Disease）假说

**对人生价值的影响通道**

health_baseline 像「**永久消耗品**」：高基线在 0~50 岁阶段几乎不被感知（事件库 里健康负向事件命中率低），50 岁后开始显著拉开差距，决定**老年期价值贡献的尾端 质量**。congenital_chronic 会**永久**调高对应器官系统的事件命中率（asthma 例： 呼吸道急症 ×3，户外运动事件命中率 ×0.7）。这是仿真中**少数从出生就开始计息的 负向资产**。

---

## 6. 依恋类型 attachment_style

Bowlby/Ainsworth 模型给出的早期亲子互动留下的**关系工作模型**。 影响一生的亲密关系反应曲线。

**子参数**

- `style` —— 依恋类型枚举：`secure` / `anxious` / `avoidant` / `disorganized`
- `caregiver_consistency` —— 主要照护者一致性，0.0 ~ 1.0
（是否频繁更换主要养育者）
- `caregiver_responsiveness` —— 主要照护者对婴儿信号的回应及时性，0.0 ~ 1.0
- `early_separation_events` —— 0~3 岁分离事件计数，整数 0 ~ 5+
- `peer_attachment_buffer` —— 童年期同伴/老师等次级依恋对象的补偿强度，0.0 ~ 1.0
（Bowlby 模型允许的"替代安全基地"）

**现实 anchor**

- Ainsworth Strange Situation 分类
- Bowlby Attachment and Loss（1969 ~ 1980）三部曲
- Mary Main 成人依恋访谈（AAI）

**对人生价值的影响通道**

attachment_style 是**全生命周期亲密关系事件**的反应曲线调制器：
- `secure` → 恋爱、婚姻、生育事件的价值收益基准；冲突事件抗性高，恢复快。
- `anxious` → 恋爱命中率正常，但冲突事件的损伤系数 ×1.5，分手事件的恢复时长 ×2。
- `avoidant` → 恋爱命中率 ×0.7，但单身/独处事件价值不显著下降，
反而中年「亲密缺位」事件的延迟损伤明显。
- `disorganized` → 几乎所有亲密事件波动率显著放大，
最容易触发「关系混乱级联」事件链。

**约束**：依恋类型在童年期定型，但允许 5~10% 的角色通过强治疗/重大正向关系事件
**部分**重写（earned secure），不允许完全任意切换。

---

## 7. 历史时代红利 generational_dividend

出生年代决定了角色所**搭上**的宏观浪潮 —— 这是个体努力之外的**结构性红利或税**。

**子参数**

- `birth_cohort` —— 出生十年队列，枚举：`50s` / `60s` / `70s` / `80s` /
`90s` / `00s` / `10s` / `20s`
- `macro_dividend_vector` —— 每个生命阶段对应的宏观红利系数列表，长度 ~ 8，
每项 -0.5 ~ +1.0（负值代表「时代税」）
- `tech_wave_alignment` —— 技术浪潮对齐度，0.0 ~ 1.0
（e.g. 80 后 × 互联网兴起 ≈ 0.9；00 后 × 大模型 ≈ 0.85）
- `policy_shock_exposure` —— 政策冲击暴露度，0.0 ~ 1.0
（计划生育、教改、双减、房地产周期等）
- `war_or_famine_exposure` —— 战乱/饥荒暴露，0.0 ~ 1.0（仿真支持历史回放模式）

**现实 anchor**

- 中国 GDP/人均可支配收入历年曲线
- 一线城市房价/工资比的年度变化
- Richard Easterlin 的「相对队列规模」假说
- 各代际"红利窗口"事件清单（80 后互联网、95 后移动互联网、00 后 AI）

**对人生价值的影响通道**

generational_dividend 在每个生命阶段乘到事件价值上 —— 不是改变事件命中率，而是改变**事件成功时的价值放大系数**。 典型例子：相同的「在 22 岁加入一家初创公司」事件，80 后赶上 PC 互联网红利 得到 ×2.0 价值放大；20 后同样的事件在 AI 浪潮下也可能得到 ×1.8； 但在「时代税」阶段（如某次大型政策收缩）则可能跌到 ×0.4。 该维度是仿真中**最大的单次价值乘子来源**， 是个体「努力 vs 时代」张力的主要载体。

---

## 8. 运气种子 luck_seed

仿真中**所有未显式建模随机性**的统一入口。

**子参数**

- `seed` —— 64-bit 整数，PRNG 种子
- `event_jitter_std` —— 事件命中率的随机抖动标准差，0.0 ~ 0.2
（所有事件命中率 ~ 真实概率 ± 抖动）
- `black_swan_rate` —— 黑天鹅事件（彩票、意外暴富、突发灾难）年化概率，
  0.0 ~ 0.01
- `serendipity_bias` —— 关键人物相遇的正向偏置，-0.3 ~ +0.3
（承担「贵人/小人遇见」这种难以量化的现实）
- `karma_smoothing` —— 是否对长期价值进行均值回归，bool
（关闭则保留极端尾部，开启则更接近"善有善报"的叙事）

**现实 anchor**

- 无 —— 这正是 luck_seed 存在的意义：**承担一切无法 anchor 的部分**

**对人生价值的影响通道**

luck_seed 的作用是**保证仿真不退化为决定论**。 其他 7 个维度构成了角色的"先验骨架"，luck_seed 在每一步骰子上引入受控抖动， 让两个**初始条件几乎一致**的角色在 80 年仿真后仍可能走出截然不同的人生轨迹。
**重要约束**：luck_seed 只能调节**已建模事件**的命中/价值抖动，不允许
luck_seed 单独凭空产生事件 —— 任何具体事件的发生仍必须有对应的事件库条目和 触发条件。`karma_smoothing` 是个有争议的开关：开启时仿真更"宜居"， 关闭时更贴近真实世界的厚尾分布，**默认关闭**。

---

## 采样顺序与依赖

为了让初始条件之间保持现实相关（而不是 8 个维度完全独立采样）， 按下列**有向依赖**顺序采样：

```
birth_cohort ────────┐ │ birth_region ─────────┼──► family_ses │ │ │ ▼ │ parent_age_at_birth │ │ ▼ ▼ health_baseline ◄──┘ │ ▼ attachment_style ◄── caregiver_responsiveness × family_ses │ ▼ genetic_temperament（与 SES 部分相关：营养 → 身高/g） │ ▼ big_five（基线 ~ genetic + 童年依恋微调） │ ▼ luck_seed（独立采样，不依赖其他维度）
```

例如：低 SES + 农村 + 60s 出生队列 + 高 caregiver_responsiveness 的组合是允许的 （"穷但有爱"），但 SES 与 hukou_tier 之间的联合分布要符合该出生年代的真实 人口学结构，不能随机笛卡尔积。

---

## 待补 (R6+)

- 各维度的**默认采样分布参数表**（mean / std / 联合相关系数矩阵）
- 与 `events.yaml` 中事件的**显式映射规则**
（某事件命中率/价值如何函数式地依赖 big_five.O 等）
- 跨代际"代际传递"机制（父母初始条件 → 子女初始条件的相关性）
- 中国 vs 海外队列的 anchor 切换开关