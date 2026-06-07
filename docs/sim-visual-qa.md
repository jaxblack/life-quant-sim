# `/sim` 视觉验收清单（Visual Regression Checklist）

> 用途：每次 `web/app/sim/page.tsx` 或相关样式 / 动画 / 数据
> （`web/data/lifeStages.zh.json` 等）发生改动后，按本清单逐项肉眼复核，
> 通过后再合入 main / 发布。本文档为**只读 QA 清单 + 截图建议**，
> 不是自动化测试，不替代单测 / 类型检查 / build。

- 适用页面：`/sim`
- 主要文件：`web/app/sim/page.tsx`
- 辅助样式：`web/app/globals.css`
- 适用人员：开发者自检 / leader review / 视觉走查

---

## 0. 前置：构建 & 本地预览

```bash
cd web
npm install                       # 仅首次或依赖变化
npm run dev                       # 本地开发：http://localhost:3000/sim
# 或预览静态导出（用于走查 GitHub Pages 行为一致性）
npm run build && npx serve out    # http://localhost:3000/sim
```

启动前先确认：

- [ ] `npm run build` 退出码 = 0，输出含 `Compiled successfully` 与 `/sim` 路由 size
- [ ] `npx tsc --noEmit`（在 `web/` 下）零 error
- [ ] 浏览器 DevTools Console 在 `/sim` 页面无 React warning / hydration error

---

## 1. 截图分辨率矩阵（建议 viewport）

每次走查至少覆盖 PC 主流分辨率 + 一档移动端。**截全页**（含
opportunity 窗口区域），不要只截首屏。

| 形态     | 截图尺寸（W × H） | 用途                                     |
| -------- | ----------------- | ---------------------------------------- |
| PC 标准  | 1440 × 900        | MacBook 14" / 多数办公显示器主流尺寸     |
| PC 大屏  | 1920 × 1080       | 24"+ 桌面外接、演示场景                  |
| PC 紧凑  | 1280 × 800        | 旧款 13" / 投屏侧栏，验证布局不被压垮    |
| 移动端   | 390 × 844         | iPhone 14/15 标准；验证 ≤640px 响应式    |
| 平板可选 | 768 × 1024        | iPad 竖屏，验证 grid 折行行为            |

记录方式：每个尺寸保存 1 张全页截图 + 1 张首屏截图（仅滚动条原始位置），
命名建议 `sim-1440x900-full.png` / `sim-1440x900-fold.png` 等。

---

## 2. 首屏可见区域（Above-the-fold）

在 1440×900 / 1920×1080 / 390×844 三档 viewport 下打开 `/sim`，
**不滚动**，肉眼检查：

- [ ] 标题 `人生模拟 Demo` 在首屏内可见，字号未被截断或换行成 3 行
- [ ] 副标题 / 简介段在首屏完整呈现（不出现 `...` 截断）
- [ ] 左侧选择面板（出生地域 / 出身家庭 / 才能多选）首屏可见至少前两个分组
- [ ] 主区域（年龄滑块 / 当前阶段卡片 / 人物画面）首屏可见，**不需要滚动就能看到滑块**
- [ ] 没有大块空白（>200px 高度的纯白 / 灰区域）出现在首屏正中
- [ ] 没有水平滚动条（移动端尤其重要）

---

## 3. 人生窗口（Opportunity Windows）位置 & 状态

opportunity-cost section 含若干窗口卡片，每张有 status 标签
（`closing` / `current` / `upcoming` / `missed`），需逐项确认：

- [ ] 拖动年龄滑块到 18 / 25 / 35 / 45 岁，窗口卡片**位置不发生跳动重排**
      （除非窗口因年龄超限被过滤进出）
- [ ] 同一窗口在不同年龄下，状态标签颜色与内容一致：
      - `closing`：边框红 `#f87171`、底色 `#fef2f2`、标签字 `#b91c1c`
      - `current`：边框绿 `#10b981`、底色 `#ecfdf5`、标签字 `#047857`
      - `upcoming`：边框蓝 `#93c5fd`、底色 `#eff6ff`、标签字 `#1d4ed8`
      - `missed`：边框灰 `#d1d5db`、底色 `#f9fafb`、标签字 `#6b7280`
- [ ] 窗口标题、年龄区间（如 `18-30 岁`）、长期成本说明三行不串行不溢出
- [ ] 子分支按钮（带 `▸` / `▾` 三角）只对**含 children 的项**显示，
      不含 children 的纯文本 chip 不应显示三角
- [ ] 点击带三角的 chip 后展开子项，文案 / 排版不破坏卡片纵向高度逻辑
- [ ] 同时展开多个子分支，卡片不重叠、不超出父容器、不挤压相邻卡片

---

## 4. 动画专业度（Motion Quality）

人物 SVG 与阶段过渡动画走查标准：

- [ ] 拖动年龄滑块：人物 SVG 随阶段切换，**无明显闪烁**（无白闪 / 无尺寸跳变）
- [ ] 阶段切换的颜色/形状过渡 ≤ 400ms，无超长缓动
- [ ] 无连续 60s 后才发现的内存抖动（DevTools Performance 录 30s，
      帧率稳定在 ≥50fps，不出现长红条）
- [ ] 减少动画偏好（macOS *Reduce Motion* / Chrome
      `prefers-reduced-motion`）开启时，动画弱化或回退为静态图，
      仍可使用所有交互
- [ ] 走查 `0/5/12/18/25/35/50/65/80` 这 9 个年龄锚点的画面，
      不出现错位 / 错色 / 多余阴影 / 文字与图像重叠

---

## 5. 交互不遮挡（Interaction Hit-Testing）

- [ ] 年龄滑块在所有 viewport 下可点击范围 ≥ 24px 高（移动端尤其）
- [ ] 滑块 thumb 不被相邻文案 / chip 遮挡，可独立拖动
- [ ] 出身家庭、才能多选按钮 hover 态边框颜色变化可见（PC）
- [ ] 子分支展开按钮的点击热区与可视边框一致（不存在按钮可见但点击无效的区域）
- [ ] 浮层 / tooltip 不会盖住正在操作的滑块 thumb
- [ ] 键盘 Tab 顺序：从顶部表单 → 才能 → 滑块 → 窗口卡片，焦点可见
- [ ] 长文本（如长期成本说明）不挡住下方按钮 / 三角图标

---

## 6. 移动端回归（≤640px）

在 390 × 844 viewport（DevTools 设 iPhone 14）下：

- [ ] 左侧选择面板自动折到顶部，不与主区域并排
- [ ] 年龄滑块占据全宽，刻度数字不被截断
- [ ] 窗口卡片单列排列，子分支三角按钮可点击
- [ ] 没有横向滚动条（除非有意为之的图表内 scroll）
- [ ] 字号 ≥ 12px（不出现 < 11px 的密集小字段）
- [ ] 长按 / 触控展开子分支与 PC 行为一致

iPad 768 × 1024（可选）：

- [ ] grid 在中间断点不出现"半栏挤满"的过渡尴尬态

---

## 7. 数据 / 文案敏感校验

- [ ] 涉及亲密关系窗口仅描述长期关系经验与机会成本；
      不写性化未成年人内容；不写外貌物化或群体标签
- [ ] 所有 `longTermLoss` 字段以"错过这扇门：…"或同义起手，
      不出现"必然失败 / 一辈子完蛋"等极端绝对化语言
- [ ] 人物画面不出现真实人姓名、商标、可识别面孔

---

## 8. 构建命令（CI / 本地一键复核）

```bash
# TypeScript 类型检查（在 web/ 目录）
cd web && npx tsc --noEmit

# Next.js 生产构建
cd web && npm run build

# 静态导出 + 本地预览（与 GitHub Pages 部署等价）
cd web && npm run build && npx serve out

# Web 域 lint（仓库目前未集成 ESLint CLI；如未来加入再补）
# cd web && npm run lint
```

期望：

- [ ] `tsc --noEmit` 0 error
- [ ] `npm run build` exit 0，输出 `Compiled successfully` 与 `/sim` 路由
- [ ] `npx serve out` 启动后访问 `/sim/` 与 dev server 视觉一致

---

## 9. 走查记录模板

每次发布前在 PR 描述粘贴一份，供 reviewer 对照：

```
- viewport: 1440x900   → fold ✅ / full ✅ / motion ✅ / hit-test ✅
- viewport: 1920x1080  → fold ✅ / full ✅ / motion ✅
- viewport: 1280x800   → fold ✅ / full ✅
- viewport: 390x844    → fold ✅ / full ✅ / hit-test ✅
- viewport: 768x1024   → fold ✅ / full ✅
- build: tsc 0e / next build PASS / next /sim size: <KB>
- screenshots: <path or PR comment id>
- regressions found: <none / 列出>
```

---

## 10. 备注

- 本清单覆盖**视觉与交互回归**；不替代功能 / 单元 / E2E 测试。
- 如果发现清单本身遗漏（例如新增的某个 section / 新增的状态颜色），
  在 PR 中补一项到本文件而不是只口头同步。
- 屏幕截图存放约定：仓库不入库截图（避免膨胀），可挂在 PR comment 或
  团队内部图床；PR 描述里附路径 / 链接即可。
