# 仓库实现审计 (life-quant-sim)

> 范围：仅做仓库现状审计与实现建议；不改动 UI / 代码 / 数据。
> 审计时间：2026-06-06。Repo head：`9f52fa5`（main）。

## tech_stack

- **前端** (`web/`)
  - Framework: Next.js **14.2.5**（App Router；`web/next.config.js` 设 `output: 'export'`，静态导出）
  - Runtime: React **18.3.1** + react-dom **18.3.1**
  - 语言: TypeScript **^5**（`web/tsconfig.json`：`strict: true`，`moduleResolution: bundler`，`jsx: preserve`）
  - 包管理: npm（`web/package-lock.json` 存在）
  - 样式: 纯 inline style + `web/app/globals.css`；**无** Tailwind / CSS-in-JS 框架
  - 状态/数据: 当前**零依赖**，没有接 engine

- **引擎** (`engine/`)
  - 语言: Python **3.9+**（README 明示，不用 `X | None`）
  - 标准库为主：`dataclasses` + `unittest`
  - 可选三方依赖: `pyyaml>=6.0`（仅用于加载 `data/events.yaml`，`engine/requirements.txt`）
  - 入口数据结构: `InitialConditions` / `LifeState` / `LifeOutcome` + `LifeSimulator` 状态机
  - 评分: `engine/scoring.py` 输出 0–100 quality-of-life 分（默认权重 money 0.25 / social 0.25 / meaning 0.30 / lifespan 0.20）

- **数据** (`data/`)
  - 单文件 `data/events.yaml`（1273 行）——事件分类法 + 概率/调制配置

- **文档** (`docs/`)
  - 设计稿：roadmap / 心理学骨架 / 事件 schema / 初始条件 / 生命产出 / Phase 3-4 占位

- **CI/CD**
  - `.github/workflows/deploy.yml`（GitHub Actions → GitHub Pages 部署）
  - **无** engine 测试 CI workflow

## entry_files

- 前端入口
  - `web/app/layout.tsx` —— 根 layout（header + nav + main 容器）
  - `web/app/page.tsx` —— 首页（“开始模拟”CTA → `/sim`）
  - `web/app/sim/page.tsx` —— `/sim` 占位页（表单：出生年份/家庭社经分位/运气种子；按钮目前是 `alert(...)` 占位）
  - `web/app/globals.css` —— 全局样式
  - `web/next.config.js` —— `output: 'export'` + `basePath` 由 `NEXT_PUBLIC_BASE_PATH` 注入
  - `web/package.json` —— 仅 3 个脚本：`dev` / `build` / `start`

- 引擎入口
  - `engine/life_sim.py`（172 行）—— `LifeSimulator` 状态机 + 三大 dataclass
  - `engine/scoring.py`（73 行）—— `score_outcome(outcome, weights=None) -> float`
  - `engine/test_life_sim.py`（113 行）—— stdlib `unittest` 套件
  - `engine/__init__.py` —— 包标识

- CI
  - `.github/workflows/deploy.yml`（68 行）—— Setup Pages → npm ci → npm run build → upload artifact → deploy-pages@v4

## build_command

- 前端 dev：
  - `cd web && npm install && npm run dev`（http://localhost:3000）
- 前端静态产物（GitHub Pages 模拟）：
  - `cd web && NEXT_PUBLIC_BASE_PATH=/life-quant-sim npm run build`
  - 产物路径：`web/out/`
- 引擎测试（仓库根）：
  - `python3 -m unittest engine.test_life_sim -v`
- 引擎可选依赖（仅加载 YAML 时）：
  - `pip install -r engine/requirements.txt`（或用 uv venv）

## pages_demo_plan

### 当前可用性：❌ NOT LIVE

- 站点 URL：`https://jaxblack.github.io/life-quant-sim/` → **HTTP 404**（实测 `curl -sI -L`，2026-06-06）
- GitHub API：`gh api repos/jaxblack/life-quant-sim` 返回 `{has_pages: false, visibility: private, default_branch: main}`
- `deploy.yml` workflow 最近 3 次运行全部 **failure**（commits `1db93bf` / `9f52fa5` / `d3bcd79`），统一卡在 `Setup Pages` step：
  - `enablement: true` 版本：`Create Pages site failed. Resource not accessible by integration`
  - `enablement: false` 版本（最新 b77d3fd 回退）：`Get Pages site failed. ... 404 Not Found`
- **根因**：仓库目前是 **private**，且 Pages 从未在 Settings → Pages 手动启用。GitHub Pages 在私有库上需要付费计划（Pro/Team/Enterprise）；公共库则免费。`actions/configure-pages@v5` 在权限不足时无法自动创建 Pages site。

### 建议落地路径（按推荐顺序）

1. **最简：把仓库改为 public**
   - Settings → General → Danger Zone → Change visibility → Public
   - 然后 Settings → Pages → Source 选 `GitHub Actions`
   - 之后任何 push 到 `main` 会触发现有 `deploy.yml`，应该一次通过
2. 若必须保持 private：升级到支持 private Pages 的计划，然后同样 Settings → Pages 手动启用
3. 启用后无需改 workflow —— 当前 `deploy.yml` 写得是对的（`output: 'export'` + `basePath=/life-quant-sim` + `.nojekyll` + `actions/deploy-pages@v4`）

### Demo 内容层面（当前 `/sim` 只是 alert 占位，没有真的模拟）

要让 Pages demo 真正“可玩”，需要让引擎在浏览器内可执行（Pages 是纯静态环境，跑不了 Python 后端）。三条候选路径：

- **A. 预生成 + 客户端查表（最低成本，推荐 Phase 2 早期）**
  - 用 `engine/` 在本地批量跑 N 组初始条件，dump 成 `web/public/sim-samples.json`
  - `web/app/sim/page.tsx` 表单提交时按参数最近邻匹配，画时间轴
- **B. 引擎逻辑 port 到 TypeScript**（中等成本，长期最干净）
  - 在 `web/lib/engine/` 重写 `LifeSimulator` + 评分；与 Python 版用同一份 `data/events.yaml`（编译期 import 或预转 JSON）
- **C. 浏览器内跑 Python（Pyodide / pyscript）**（高成本，bundle 数 MB）
  - 复用现有 `engine/` 源码；但加载慢、SEO 差、移动端体验差

### 建议改动文件清单（do-not-implement-here，留给后续 subtask）

- 仓库设置（非代码）：把 `jaxblack/life-quant-sim` 改 public，并在 Settings → Pages 启用 Source=GitHub Actions
- `web/app/sim/page.tsx` —— 移除 `alert()`，按上面 A/B/C 选一条路径接真实逻辑；表单加结果展示区
- `web/public/sim-samples.json`（新增，路径 A）—— 预跑结果
- `web/lib/engine/*.ts`（新增，路径 B）—— TS 版引擎
- `web/app/page.tsx` & `web/app/layout.tsx` —— 加 favicon、`<meta>` Open Graph、移动端 viewport 检查
- `.github/workflows/engine-test.yml`（新增）—— 现在只有 Pages 部署 CI，引擎测试无 CI 覆盖；建议加 `python3 -m unittest engine.test_life_sim -v` 的 PR check
- `web/README.md` —— Pages 启用流程当前只描述了“Settings 改 Source 即可”，遗漏了 private repo 需先升级/转 public 的前置条件，建议补一段
- `engine/README.md` —— 标注与 `data/events.yaml` 的约定 schema 版本，便于 TS port 对齐

---

附：仓库当前文件清单（25 个 tracked file，未含 `node_modules`）
- root: `README.md`, `LICENSE`, `.gitignore`
- `engine/`: `__init__.py`, `life_sim.py`, `scoring.py`, `test_life_sim.py`, `requirements.txt`, `README.md`
- `web/`: `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.js`, `README.md`, `app/{layout,page,globals.css}`, `app/sim/page.tsx`
- `data/`: `events.yaml`
- `docs/`: `roadmap.md`, `dev-psych-taxonomy.md`, `event-schema.md`, `initial-conditions.md`, `life-outcome.md`, `phase3-opportunity-cost.md`, `phase4-end-states.md`
- `.github/workflows/`: `deploy.yml`
