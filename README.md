# life-quant-sim

> 量化人生模拟器 —— 0-100岁时间轴上的人生模拟

## 在线 Demo

🔗 **GitHub Pages**: https://jaxblack.github.io/life-quant-sim/

> 首次部署需要在仓库 `Settings → Pages → Build and deployment → Source` 中将来源切换为 **GitHub Actions**，
> 之后每次推送到 `main` 都会通过 `.github/workflows/deploy.yml` 自动构建并发布。

## 愿景

模拟人从 0 岁到 100 岁的全过程：阶段（童年/少年/青年/中年/老年）、关键事件（求学、恋爱、职场、家庭、健康、危机/机遇）、情绪与认知的演化轨迹。

输入「初始条件」（家庭社经地位、出生地、Big Five 人格、健康基线、运气种子），输出「人生价值」（金钱、社会、自我意义、健康寿命、关系网密度）。

核心立意：在足够大的复杂条件下，**绝大多数人生的结构是高度相似的** —— 同一条长坡道、同一组阶梯、同一份 rank 分布。极少数轨迹通过「顿悟 / 神化 / 佛化 / 帝化」跳出常态分布 —— 这部分作为 **Phase 4 后续工作**，本期不展开。

## 项目状态

🚧 **早期 scaffold（Phase 1）** —— 仅包含目录骨架、路线图与 schema 草案，前端为占位页面。引擎与真实模拟将在 R2 起逐步填充。

## Quickstart

### 在线访问

直接打开 [GitHub Pages demo](https://jaxblack.github.io/life-quant-sim/) 即可，无需本地安装。

### 本地预览

```bash
cd web
npm install
npm run dev          # 开发模式，http://localhost:3000
# 或预览静态导出（与 GitHub Pages 实际构建一致）
npm run build && npx serve out
```

## 目录说明

- `engine/` —— 模拟引擎（状态机 + 事件抽样 + 评分），R2 开始填充
- `web/`    —— 前端可视化（Next.js App Router，静态导出至 GitHub Pages），R2 开始填充
- `data/`   —— 事件库 / 初始条件分布 / 校准数据，R2 开始填充
- `docs/`   —— 设计文档（路线图、心理学骨架、事件 schema）
- `.github/workflows/deploy.yml` —— GitHub Pages 自动部署 workflow

## 下一步

见 `docs/roadmap.md`。
