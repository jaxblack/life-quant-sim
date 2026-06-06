# Phase 4：终局形态（end-states）

> **Phase 4 = 后续 stub，Phase 1-3 完成后再实现。**
>
> 本文件仅立框架，不开工。绝大多数 trajectory 会收敛到常态分布的同一条长坡道（凡化）；只有极少数样本通过结构性跃迁脱离 rank 阶梯，落入下面三种「非凡终局」之一。

## 1. 模型框架

老年阶段（>= 80 岁）每一个 tick 计算一次 **顿悟概率**：

```
P(insight | meaning, lifespan, social, cognition)
   = sigmoid( w_m * meaning
            + w_l * lifespan_adj      # 寿命越长，留给沉淀的窗口越大
            + w_s * social_residual   # 影响力 / 关系网的剩余强度
            + w_c * cognition         # 认知未塌缩
            - bias )
```

- `meaning`：来自 `LifeOutcome` 中的 meaning 维度（Phase 1 schema 已定义）。
- `lifespan_adj`：实际存活年限对预期年限的偏移；早逝直接锁死为凡化。
- `social_residual`：到 80+ 时仍保有的关系网络与影响力（被引用 / 被照护 / 被纪念）。
- `cognition`：认知功能未崩塌（无重度 dementia tag）。

只有当 `P(insight)` 越过阈值，才进入终局形态投票；否则默认凡化。

## 2. 四种终局形态

### 2.1 神化（theos）

利他持续 + 强精神信仰 + 影响力跨越本人寿命延续（被纪念、被引用、被奉为某领域奠基者）。

- 判定指标：
  1. `altruism_streak_years >= 30`（持续利他不少于 30 年）
  2. `belief_intensity >= 0.7`（精神 / 信仰强度高，可以是宗教、科学、艺术）
  3. `posthumous_citation_count > 0`（死后仍被引用 / 纪念）
  4. `meaning >= 0.85`
  5. `material_legacy` 不必高，但 `symbolic_legacy` 必须高
- 触发条件：`P(insight) > 阈值` 且上述指标至少命中 4 条。

### 2.2 佛化（buddha）

去欲望 + 接纳 + 放下，内在平静度高。不追求外部影响力，向内收束。

- 判定指标：
  1. `desire_decay_rate` 在 60+ 后单调下降
  2. `acceptance_score >= 0.8`（对衰老 / 失去 / 死亡的接纳）
  3. `inner_peace >= 0.8`
  4. 关键事件 tag 含 `letting_go` / `forgiveness` / `solitude_chosen`
  5. `material_legacy` 与 `symbolic_legacy` 都不强求
- 触发条件：`P(insight) > 阈值` 且 desire 曲线单调衰减 + 接纳指标达标。

### 2.3 帝化（imperial）

掌权 + 控制欲 + 历史定位 + 物质遗产庞大。外向收束：把世界拽向自己。

- 判定指标：
  1. `power_peak >= 0.85`（生涯曾握有显著决策权）
  2. `control_drive >= 0.7`（控制欲 / 支配倾向高）
  3. `material_legacy >= 0.8`（庞大物质遗产 / 组织 / 王朝）
  4. `historical_position_secured == true`（自我塑造的历史叙事被外部确认）
  5. 关键事件 tag 含 `succession_designed` / `monument_built` / `dynasty_founded`
- 触发条件：上述任 4 项命中即可，对 `meaning` 与 `inner_peace` 不做硬要求。

### 2.4 凡化（mortal，默认）

平淡终老，不顿悟。这是绝大多数样本的默认归宿，**不是失败**，只是「同一条长坡道」的自然终点。

- 判定指标：上述三类的硬指标均未达标。
- 触发条件：默认兜底；`P(insight)` 未越阈值或越阈值后投票未集中。

## 3. 伪算法

```python
def classify_end_state(life_outcome, life_history):
    """
    life_outcome: dict(meaning, lifespan, social, cognition, material)
    life_history: list[Event(year, tag, ...)]
    return: 'theos' | 'buddha' | 'imperial' | 'mortal'
    """
    p = sigmoid_insight(life_outcome)
    if p < INSIGHT_THRESHOLD:
        return 'mortal'

    # 5 维度 + history tag 投票
    votes = {'theos': 0, 'buddha': 0, 'imperial': 0}
    votes['theos']    += score_theos(life_outcome, life_history)
    votes['buddha']   += score_buddha(life_outcome, life_history)
    votes['imperial'] += score_imperial(life_outcome, life_history)

    winner, top = max(votes.items(), key=lambda kv: kv[1])
    # 票数不集中 → 回落凡化（避免噪声分类）
    if top < VOTE_MIN or (top - second(votes)) < MARGIN:
        return 'mortal'
    return winner
```

各 `score_*` 子函数读取 `life_outcome` 的 5 维度（meaning / lifespan / social / cognition / material）并扫描 `life_history` 的关键事件 tag，加权出票。

## 4. Out-of-scope 声明

- 本文件是 **草案 / stub**，不在 Phase 1-3 任务范围内。
- 阈值（`INSIGHT_THRESHOLD` / `VOTE_MIN` / `MARGIN`）与权重（`w_m` / `w_l` / `w_s` / `w_c`）需要 Phase 1-3 沉淀出真实分布后再标定。
- 关键事件 tag 集合（如 `letting_go` / `dynasty_founded`）依赖 Phase 2 事件库填充完成。
- 任何与本框架不一致的实现请等待 Phase 4 正式开工后再讨论；目前不接受 PR 把本文件「升级」为可运行代码。
