# Phase 3：机会成本模拟器（opportunity-cost simulator）

> **Phase 3 = 后续 stub，依赖 Phase 1-2 完成后再开工。**
>
> 本文件只立框架，不开工。Phase 1（事件 schema + LifeOutcome 维度）与 Phase 2（状态机 / 引擎 / 评分）落地之后，本模块才有可挂载的对象。

## 1. 模型直觉

量化人生模拟器（Phase 1-2）回答的是"**这一条人生跑下来分数如何**"。机会成本模拟器要在它之上回答另一个更扎心的问题：

> 如果当年选了 B / C / D，今天会怎样？

具体做法：在每个**人生节点**（择校 / 择偶 / 择业 / 创业 / 移民 / 生育 / 置业 / 求学 等）上，给出 3-5 个候选分支。用户实际选择 A 之后，模拟器用 **counterfactual（反事实）** 方式从该节点 fork 出 N 条平行轨迹，让 B / C / D 各自跑到终点，得到每个候选的 LifeOutcome 分布。把这些分布相对于实选 A 的差值聚合起来，就是该节点的 **机会成本曲面**。

注意：机会成本不是单个标量，而是 LifeOutcome 各维度（财富 / 关系 / 健康 / 意义 / 自由 / 影响力）上的**有方向的差值向量**。某个分支在财富维度更优、在关系维度更差，是常态。

## 2. 典型决策节点

下列 8 个节点是 v0 的内置 catalog，每个节点都给出候选 + 对 LifeOutcome 维度的影响方向（粗粒度，仅用于 stub 期对齐）。

### 2.1 高考志愿（地理 / 专业）

人生第一个高维分叉。地理决定后续社交圈层与产业接触面，专业决定头 10 年职业曲线的斜率。

- 候选：`一线名校冷门专业` / `本地中游学校热门专业` / `gap 一年再战` / `直接就业 / 职校`
- LifeOutcome 影响方向：财富（中-高方差）、关系（地理强相关）、自由（一线 > 小城）、影响力（名校 buff）

### 2.2 初恋是否进入婚姻

第一次把"亲密关系"和"长期合约"绑在一起的决策。错过的成本未必是关系本身，而是被它耽误 / 成全的其他维度。

- 候选：`结婚` / `分手另寻` / `长期不结但同居` / `丁克协议`
- LifeOutcome 影响方向：关系（直接）、意义（高方差）、自由（结婚 -，丁克 +）、健康（长期亲密关系 +）

### 2.3 35 岁要不要跳出舒适区

中年节点，转行 / 创业 / 学位 / 移民 都汇聚于此。沉没成本与剩余窗口期的拉锯战。

- 候选：`留在大厂熬资历` / `转行新赛道` / `读个学位` / `gap 一年`
- LifeOutcome 影响方向：财富（短期 -，长期高方差）、自由（+）、意义（+）、健康（短期 -）

### 2.4 生不生二胎

资源约束下的分叉。一胎 vs 二胎不是 2 倍关系，而是结构性切换：从"集中投入"切到"分散投入 + 兄弟姐妹拓扑"。

- 候选：`只生一胎` / `生二胎` / `不生育` / `领养`
- LifeOutcome 影响方向：财富（二胎 -）、关系（二胎 +，老年期尤明显）、自由（生育 -）、意义（生育 +）

### 2.5 创业 vs 大厂

风险溢价节点。期望值未必更高，但分布形状完全不同：大厂是窄峰，创业是长尾 + 厚左尾。

- 候选：`大厂打工` / `独立创业` / `加入早期 startup` / `自由职业 / freelance`
- LifeOutcome 影响方向：财富（高方差）、自由（创业 +）、健康（创业 -）、影响力（成功创业 ++）

### 2.6 父母移居 vs 留守

代际 + 地理的双重决策。表面是养老安排，本质是把父母的余下时间从一种社会网络迁移到另一种。

- 候选：`父母随迁` / `父母留守原籍` / `父母两地轮换` / `送入养老社区`
- LifeOutcome 影响方向：关系（迁移成本 -，团聚 +）、健康（父母端，环境变化 -）、意义（陪伴 +）、财富（- 中等）

### 2.7 房贷 vs 租房

把未来 30 年现金流锁死换一个地理 + 资产的决策。也是杠杆引入点，会显著放大其他节点的方差。

- 候选：`一线买房高杠杆` / `二三线买房低杠杆` / `长期租房 + 投资` / `买地 / 自建`
- LifeOutcome 影响方向：财富（高方差，杠杆放大）、自由（房贷 -）、关系（地理稳定 +）、健康（通勤 / 居住质量）

### 2.8 出国深造 vs 在地工作

身份 / 语言 / 社会网络的重置节点。机会成本最难估，因为反事实的 B 分支几乎是另一个人。

- 候选：`出国读研 + 留下` / `出国读研 + 回国` / `在地读研` / `直接工作`
- LifeOutcome 影响方向：影响力（国际化 +）、关系（重置）、自由（身份 +）、意义（高方差）

## 3. 伪算法

```python
def simulate_counterfactual(
    picked_branch: str,
    alternatives: list[str],
    n_runs: int = 1000,
) -> dict[str, OutcomeDistribution]:
    """
    在某个 decision_node 上，对 picked_branch 之外的每个候选分支
    各跑 n_runs 条反事实轨迹，返回 {alt_id: outcome_distribution}。

    依赖 Phase 1 的 LifeOutcome schema 和 Phase 2 的引擎。
    """
    state_at_node = engine.snapshot_until(decision_node)   # Phase 2 提供
    distributions: dict[str, OutcomeDistribution] = {}

    for alt in alternatives:
        if alt == picked_branch:
            continue
        outcomes = []
        for _ in range(n_runs):
            forked = state_at_node.fork()
            forked.apply_branch(alt)
            outcome = engine.run_to_end(forked)            # LifeOutcome 向量
            outcomes.append(outcome)
        distributions[alt] = OutcomeDistribution(outcomes)

    return distributions  # leader 调用方再算 mean / quantiles / 维度差
```

返回的 `OutcomeDistribution` 之间相互做差，得到该节点的**机会成本曲面**：每个候选相对实选的 6 维差向量 + 置信区间。这一层 UI / 报表实现留给 Phase 3 后期。

## 4. 与 Phase 1-2 的依赖

- **必须**：Phase 1 的 LifeOutcome 维度定义稳定（不能跑到一半改 schema）。
- **必须**：Phase 2 的引擎支持 `snapshot_until(node)` 与 `state.fork()`，否则 counterfactual 没法实现。
- **可选**：Phase 4 终局形态判定可以接到本模块的输出之上，但不是 Phase 3 的硬依赖。
