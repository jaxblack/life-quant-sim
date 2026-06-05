# 发展心理学骨架

本文档列出 Phase 1 采用的理论骨架。**只标题 + 一行说明**，不展开具体事件 —— 事件颗粒属于 Phase 2。

## 采用的理论模型

### Erikson — 8 阶段心理社会冲突
从「信任 vs 不信任」到「自我完整 vs 绝望」，提供整个生命周期的核心心理冲突轴。

### Levinson — 成人发展四季论
将成人生命划分为四个 ~20 年的「季」，捕捉中年转型与晚年整合等过渡期。

### Piaget — 认知阶段
感觉运动 / 前运算 / 具体运算 / 形式运算 —— 提供儿童与青少年期的认知能力上限。

### Kohlberg — 道德发展 6 阶段
从「避罚服从」到「普遍伦理原则」，作为决策模块的道德推理深度参数。

### Big Five — 人格五因素（O/C/E/A/N）
开放性 / 尽责性 / 外向性 / 宜人性 / 神经质 —— 作为「初始条件」的核心人格维度，影响事件命中率与反应曲线。

### Maslow — 需求层次
生理 → 安全 → 归属 → 尊重 → 自我实现 —— 作为驱力维度，决定在每个阶段角色「想要什么」。

### Levinson + 中国本土阶段映射
童年 / 少年 / 青年 / 中年 / 老年 —— 作为顶层 stage label，对应 schema 的 `stage` 枚举。

## 模型如何组合

- **stage label**（顶层）：用本土五阶段做事件归档与展示。
- **冲突轴**（中层）：Erikson + Levinson 给每个阶段一个核心张力。
- **能力上限**（认知/道德）：Piaget + Kohlberg 限定主体能做出的决策复杂度。
- **个体差异**（初始条件）：Big Five + Maslow 驱力序列。

## 待补 (R2)

事件颗粒分类清单 —— 在 Phase 2 展开：
恋爱、分手、求婚、结婚、生育、离婚、丧亲、迁徙、升学、毕业、求职、晋升、失业、创业、破产、疾病、伤残、康复、突发幸运、意外灾祸、师友、背叛、和解、出走、归乡、皈依……


## 事件分类索引 (R2)

R2 阶段在 `data/events.yaml` 落地了首批事件颗粒（146 条），按 schema 的 10 个 category 分类。下面给出每个 category 的中文名、一行解释，以及 1-2 个 events.yaml 中的代表性 id 示例。

| Category   | 中文 / 一行解释 | 代表 events.yaml id |
| ---------- | --------------- | ------------------- |
| love       | 亲密关系 —— 从童年依恋到老年相伴的恋爱、伴侣、婚姻线 | `love.first_crush`, `love.marriage` |
| career     | 职业 —— 兴趣萌芽、求职、晋升、转型、退休前后的工作角色 | `career.first_job`, `career.peak_achievement` |
| family     | 原生与核心家庭 —— 父母、兄弟姐妹、生育、隔代抚养、临终照护 | `family.become_parent`, `family.grandchild_born` |
| health     | 身心健康 —— 体检、慢病、急症、康复、衰老相关事件 | `health.chronic_illness_dx`, `health.longevity_blessing` |
| finance    | 财富 —— 收入、负债、置业、投资、退休保障与遗产规划 | `finance.first_salary`, `finance.retirement_adequate` |
| social     | 社会网络 —— 朋友、社群、声望、孤立与社会支持的形成与衰减 | `social.best_friend_made`, `social.elder_respected` |
| cognition  | 认知能力变化 —— 学习、专长、智慧成熟、记忆与失智 | `cognition.passion_subject`, `cognition.late_wisdom_contrib` |
| emotion    | 情绪事件 —— 身份觉醒、意义寻找、危机、整合与绝望 | `emotion.identity_awakening`, `emotion.ego_integrity` |
| crisis     | 负向突发 —— 事故、灾难、丧亲、破产等冲击性事件 | `crisis.parent_death_teen`, `crisis.spouse_death_late` |
| opportunity| 正向突发 —— 名校录取、爆款、遗产、重大突破等机遇 | `opportunity.top_school_admit`, `opportunity.business_breakthrough` |

stage 维度依旧沿用顶层六阶段（childhood / adolescence / early_adult / mid_adult / late_adult / old_age），每个 (stage × category) cell 至少 2 条事件，价向（valence）整体按负:正 接近 4:6 配比，与现实生活中正向体验稍多但负向冲击更重的主观印象一致。

## 引用文献

以下文献是 Phase 1 理论骨架与 R2 事件分类的主要来源：

- Erikson, E. H. (1950). *Childhood and Society*. New York: W. W. Norton.
- Levinson, D. J. (1986). *The Seasons of a Man's Life*. New York: Ballantine Books.
- Piaget, J. (1972). *Intellectual Evolution from Adolescence to Adulthood*. Human Development, 15(1), 1-12.
- Costa, P. T., & McCrae, R. R. (1992). *Revised NEO Personality Inventory (NEO-PI-R) and NEO Five-Factor Inventory (NEO-FFI) Professional Manual*. Odessa, FL: Psychological Assessment Resources.
- Bowlby, J. (1969). *Attachment and Loss, Vol. 1: Attachment*. New York: Basic Books.
- Maslow, A. H. (1943). *A Theory of Human Motivation*. Psychological Review, 50(4), 370-396.
