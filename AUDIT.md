# life-quant-sim 源码审计报告

## 0. 技术栈与入口

- 仓库根目录没有 `package.json`；前端包在 `web/package.json`，项目名 `life-quant-sim-web`，依赖 `next@14.2.5`、`react@18.3.1`、`pixi.js@^8.19.0`，是 **Next.js App Router + React + TypeScript + PixiJS** 项目。
- GitHub Pages 构建入口：`.github/workflows/deploy.yml:20-57 / build job` 在 `web/` 下 `npm ci`、`npm run build`，上传 `web/out`。
- 静态导出配置：`web/next.config.js:1-10`，`output: 'export'`，`NEXT_PUBLIC_BASE_PATH` 注入仓库名作为 GitHub Pages basePath。
- 当前源码中没有 `web/app/sim/page.tsx`；`find web/app` 只有 `web/app/page.tsx`、`layout.tsx`、`globals.css`、`character.ts`。因此当前模拟页源头是 `web/app/page.tsx:1126 / SimPage`，线上 `/sim/` 若仍可访问，应是历史部署或 Pages 路由/旧产物问题，源码层面未见独立 `/sim` 路由。

## 1. 五个改造点定位

### a. 年龄动画循环、当前年龄字段、终止条件

- 当前年龄字段：`web/app/page.tsx:1127 / SimPage`，`const [age, setAge] = useState<number>(18)`。
- 当前年龄显示字段：`web/app/page.tsx:1161-1162 / SimPage`，`stageOfAge(age)` 与 `displayAge = Math.round(age)`。
- 阶段判定：`web/app/page.tsx:207-217 / stageOfAge(age)`，按 `ageStart` 找当前人生阶段。
- 自动年龄动画循环：`web/app/page.tsx:1177-1207 / useEffect([isTimelinePlaying, timelineSpeed])`，用 `requestAnimationFrame(tick)` 驱动。
- 年龄推进公式：`web/app/page.tsx:1191-1195 / tick -> setAge`，`next = prev + (elapsed / BASE_MS_PER_YEAR) * timelineSpeed`。
- 当前终止/回绕条件：`web/app/page.tsx:1193 / tick`，`if (next > 100) return 1 + ((next - 1) % 100)`；也就是说现在 **不会停在 100 岁**，会从 100+ 回绕到 1+。
- 100 岁坟墓改造点：应优先改 `web/app/page.tsx:1191-1195 / tick` 的终止策略，并同步 `web/app/page.tsx:1821-1830 / CharacterStage` 或 `web/components/PixiCharacter.tsx` 渲染终点状态。
- 80+ 安乐死窗口改造点：`web/app/page.tsx:121-137 / STAGES.old_age` 是 80-100 高龄阶段定义；机会窗口数据在 `web/app/page.tsx:340+ / OPPORTUNITY_WINDOWS`，应新增或调整 80+ 窗口，而不是改动画循环本身。

### b. auto-play 状态机/定时器，以及“身份/学历”字段 auto-play 时不更新原因

- auto-play 默认状态：`web/app/page.tsx:1128 / SimPage`，`isTimelinePlaying` 初始为 `true`。
- 倍速状态：`web/app/page.tsx:1129 / SimPage`，`timelineSpeed` 初始为 `1`；可选速度在 `web/app/page.tsx:1122 / PLAYBACK_SPEEDS`。
- 定时器/状态机核心：`web/app/page.tsx:1177-1207 / useEffect`。当 `isTimelinePlaying=false` 时取消 `requestAnimationFrame`；为 `true` 时每帧推进年龄并继续注册下一帧。
- 控制按钮：`web/app/page.tsx:1209-1215 / pauseTimeline/resumeTimeline/resetTimeline`，UI 在 `web/app/page.tsx:1860-1879 / lqs-playback-controls`。
- 手动拖动会暂停：`web/app/page.tsx:1847-1856 / input[type=range].onChange` 先 `setIsTimelinePlaying(false)` 再 `setAge(...)`。
- “身份/学历”不是完全不更新：数值分由 `age` 派生，`identityScore` 在 `web/app/page.tsx:1320-1333 / identityScore`，`educationScore` 在 `web/app/page.tsx:1335-1349 / educationScore`，`statusCards` 的依赖也包含 `age/identityScore/educationScore`（`web/app/page.tsx:1382-1511 / statusCards useMemo`）。
- 如果现象是 auto-play 时“身份/学历文字看起来不更新”，原因更可能是 **value 文案分段很粗**：`educationStage` 只在 `<7/<13/<16/<19/<23/<28/<60` 等阈值变（`web/app/page.tsx:1382-1399`）；`identityRole` 只在 `<7/<19/<23/<35/<60` 等阈值变（`web/app/page.tsx:1428-1440`）。auto-play 每帧更新的是分数/差值，但大段年龄范围内 label 不变。
- 另一个可疑点：delta 基准用 `prevScoresRef` 在 render 后更新（`web/app/page.tsx:1363-1378 / prevScoresRef + useEffect`），若需要更稳定的 auto-play 差值，可把前一帧年龄/分数的采样策略单独封装，但这不影响身份/学历的主值计算。

### c. 左侧/右侧面板布局、个人天赋位置、性别字段预留位置

- 顶层模拟页组件：`web/app/page.tsx:1126 / SimPage`。
- 外层两栏布局：`web/app/page.tsx:1609-1616 / lqs-sim-grid`，`gridTemplateColumns: 'minmax(220px, 260px) 1fr'`，左侧是筛选侧栏，右侧是主内容。
- 左侧面板：`web/app/page.tsx:1617-1744 / aside.lqs-sim-aside`，目前包含 `出生地域`、`教养氛围`、`出身家庭`。
- 主内容左右两栏：`web/app/page.tsx:1746-1748 / div.lqs-sim-content + lqs-sim-col-left` 和 `web/app/page.tsx:2046-2048 / lqs-sim-col-right`。
- PC 主内容两栏 CSS：`web/app/globals.css:675-711 / .lqs-sim-content`，在 `min-width:1100px` 时切成 `minmax(0,1.05fr) minmax(0,1fr)`。
- “个人天赋”当前所在组件：`web/app/page.tsx:2122-2191 / 个人天赋筛选`，位于右列 `lqs-sim-col-right` 的“当前阶段即将错过的人生窗口”section 内。
- 天赋数据定义：`web/app/page.tsx:219-240 / Talent + TALENTS`；状态字段是 `web/app/page.tsx:1134-1136 / selectedTalents`。
- 性别字段建议预留位置：最少冲突方案是在左侧 `aside.lqs-sim-aside` 里新增一段，与 `出生地域`（`web/app/page.tsx:1630-1661`）和 `教养氛围`（`web/app/page.tsx:1663-1710`）同级；如需影响人物外观，则同时扩展 `web/app/character.ts:19-45 / CharacterAppearance` 或 `appearanceForStageId` 的参数（`web/app/character.ts:222-227`）。

### d. auto-play 是否默认开启的开关位置

- 默认开启开关：`web/app/page.tsx:1128 / SimPage`，`useState<boolean>(true)`。
- 改为默认关闭：把该行改为 `useState<boolean>(false)` 即可。
- 重置行为也会关闭播放：`web/app/page.tsx:1211-1215 / resetTimeline`，`setIsTimelinePlaying(false)`。

### e. 小人移动轨迹绘制位置，以及现有数值字段

- 人物舞台容器：`web/app/page.tsx:145-166 / CharacterStage`，CSS 背景/地面由 `lqs-character-stage` 与 `lqs-character-ground` 提供，WebGL 小人由 `PixiCharacter` 绘制。
- 小人组件入口：`web/components/PixiCharacter.tsx:27 / PixiCharacter`。
- WebGL/Pixi 初始化：`web/components/PixiCharacter.tsx:64-89` 动态 `import('pixi.js')` 并创建 `PIXI.Application`。
- 图层结构：`web/components/PixiCharacter.tsx:90-104`，包括 `dust`、`shadow`、`walker`、`footDust`、`figure`。
- 人生进度到横向位置映射：`web/components/PixiCharacter.tsx:459-489 / layout + applyProgress`，核心是 `walker.x = leftX + p * span`（`web/components/PixiCharacter.tsx:466-472`）。
- 每帧轨迹/步态：`web/components/PixiCharacter.tsx:506-560 / tick`，其中 `applyProgress()` 跟随年龄进度，肢体摆动/扬尘在同一函数中。
- 软投影与尘埃：`web/components/PixiCharacter.tsx:561-580 / tick`。
- 旧 SVG/CSS 走路样式仍残留在 CSS：`web/app/globals.css:345-366`、`web/app/globals.css:517-647`，但当前渲染注释说明已改为 PixiJS（`web/app/page.tsx:141-145`、`web/components/PixiCharacter.tsx:3-11`）。
- 现有数值字段：当前只有四个状态分，定义在 `StatusCard`：`web/app/page.tsx:1267-1281`。具体计算：`wealthScore` 资产（`web/app/page.tsx:1290-1318`）、`identityScore` 身份（`web/app/page.tsx:1320-1333`）、`educationScore` 学历（`web/app/page.tsx:1335-1349`）、`bodyScore` 身体机能（`web/app/page.tsx:1351-1361`）。
- 状态卡渲染位置：`web/app/page.tsx:1749-1807 / lqs-status-cards`，显示 label、score、delta、unit、hint。
- “快乐”字段：源码中未见独立 `happiness/happy/快乐` 状态分；若 round 2 要加“快乐”，建议新增到 `StatusCard` 计算链路（`web/app/page.tsx:1267-1511`）并在状态卡渲染处自然扩展。

## 2. Round 2 fan-out 建议

1. **年龄终点与 80+ 窗口任务**：只改 `web/app/page.tsx`。范围：`tick` 终止逻辑（`1177-1207`）、`STAGES.old_age`/`OPPORTUNITY_WINDOWS` 相关 80+ 数据、必要时 `CharacterStage` 传终点状态。目标：100 岁不回绕、可显示坟墓/终点态、80+ 安乐死窗口进入机会列表。
2. **auto-play 默认与状态文案任务**：只改 `web/app/page.tsx`。范围：`isTimelinePlaying` 默认值（`1128`）、播放控件文案（`1860-1879`）、身份/学历 label 粒度（`1382-1440`）。避免碰 Pixi 与布局。
3. **左侧筛选区与性别字段任务**：主要改 `web/app/page.tsx`，如影响外观再改 `web/app/character.ts`。范围：`aside.lqs-sim-aside`（`1617-1744`）新增性别字段；不要动右侧机会卡。
4. **个人天赋迁移/布局任务**：主要改 `web/app/page.tsx` 与 `web/app/globals.css`。范围：把 `个人天赋筛选` 从右列 section（`2122-2191`）移动到左侧或独立筛选区，并调整 `.lqs-sim-grid/.lqs-sim-content` CSS。避免改状态分与 Pixi。
5. **小人轨迹与数值字段任务**：小人轨迹只改 `web/components/PixiCharacter.tsx`；新增“快乐”等数值只改 `web/app/page.tsx` 的 `StatusCard` 计算/渲染。若要减少冲突，可拆成两个子任务：Pixi 轨迹视觉、状态字段扩展。
