# 事件 Schema 草案

本文档定义事件、初始条件、人生终态三类核心数据结构。**伪代码 + 中文注释**，Phase 1 不绑定具体语言/框架。

## Event

```
Event {
  id: str                       # 全局唯一，例如 "love_first_breakup_v1"
  stage: enum{                  # 事件归属的人生阶段（顶层 label）
    childhood,                  # 童年       (~0-12)
    adolescence,                # 少年       (~13-18)
    early_adult,                # 青年       (~19-35)
    mid_adult,                  # 中年       (~36-55)
    late_adult,                 # 中后期     (~56-70)
    old_age                     # 老年       (~71+)
  }
  category: enum{
    love,                       # 亲密关系
    career,                     # 职业
    family,                     # 原生 / 核心家庭
    health,                     # 身心健康
    finance,                    # 财富
    social,                     # 社会网络
    cognition,                  # 认知能力变化
    emotion,                    # 情绪事件
    crisis,                     # 负向突发
    opportunity                 # 正向突发
  }
  valence: int [-5, +5]         # 主观体验的好坏（不等于客观收益）
  prob_base: float [0, 1]       # 在所属 stage 内单年发生的基础概率
                                # 实际概率 = prob_base × f(InitialConditions, 历史事件)
  impact_dims: {                # 对终态各维度的瞬时增量（可正可负）
    money:   int,
    social:  int,
    meaning: int,
    energy:  int
  }
  triggers: [str]               # 引用其他 event_id —— 触发因果链
                                # 例如：失业 → 抑郁 → 离异
  tags: [str]                   # 自由标签（"first_time", "recurrent", "irreversible" 等）
}
```

## InitialConditions

```
InitialConditions {
  family_ses:      int [1, 10]   # 家庭社经地位
  birthplace:      str           # 城市 / 农村 / 海外 等
  big_five: {                    # Big Five，0-1 归一
    openness:           float,
    conscientiousness:  float,
    extraversion:       float,
    agreeableness:      float,
    neuroticism:        float
  }
  health_baseline: float [0, 1]  # 出生健康基线（含遗传）
  luck_seed:       int           # 随机种子，固定后整段人生可复现
}
```

## LifeOutcome

```
LifeOutcome {
  total_money_value:   float     # 一生累计经济价值（折现到出生时点）
  social_value:        float     # 社会贡献 / 影响力指数
  self_meaning:        float     # 自我意义感（来自 Erikson + Maslow 顶层）
  healthy_lifespan:    float     # 健康寿命（年）
  relationship_density: float    # 关系网密度（核心 + 弱连接，加权）
}
```

## 评分原型（Phase 1 设计稿）

终态各维度 = 一生事件 `impact_dims` 的加权累计（按年龄折现 + valence 调制），再用初始条件做归一化对照（同初始条件群体的 rank 而非绝对值）。
具体公式留待 Phase 2 引擎落地。
