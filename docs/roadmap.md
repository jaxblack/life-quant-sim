# 路线图

本仓库分四个阶段推进。本 plan 范围 = Phase 1。

## Phase 1（当前 plan，本轮交付）

仓库骨架 + 发展心理学事件分类 schema + 简易评分原型的设计稿。

- [x] 目录骨架（engine/ web/ data/ docs/）
- [x] 文档骨架（README / roadmap / dev-psych-taxonomy / event-schema）
- [ ] 简易评分原型（设计稿在 docs/event-schema.md 的 LifeOutcome 章节）

## Phase 2

事件库填充（数千到数万条）+ 状态机引擎 + 前端可视化。

- 事件库：按 Phase 1 schema 录入；分阶段（childhood…old_age）× 分品类（love / career / family / health / finance / social / cognition / emotion / crisis / opportunity）。
- 引擎：状态机驱动，每一个 tick = 一年；按 prob_base × 初始条件调制 × 触发链 抽样事件。
- 前端：Next.js，时间轴 + 多人轨迹叠加 + rank 分布可视化。

## Phase 3（占位，out-of-scope）

机会成本模拟器：在关键节点选 A 时，反事实推演若选 B/C 的收益曲线，量化「未走之路」的代价与收益。

## Phase 4（占位，out-of-scope）

终局形态：神化 / 佛化 / 帝化 —— 顿悟模型。绝大多数轨迹收敛到常态分布的「同一条长坡道」；极少数样本通过结构性跃迁脱离 rank 阶梯。本阶段仅留 stub，不实现。
