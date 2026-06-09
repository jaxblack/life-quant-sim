'use client'

// PixiCharacter —— 用 PixiJS (WebGL) 重写的人物走路 / 成长动画，替代原先的 SVG/CSS 小人。
// 设计目标（比 SVG 版更"高级"的渲染）：
//   - WebGL 抗锯齿矢量绘制 + devicePixelRatio 高清；
//   - 分层光影：基础色 + 高光罩 + 暗面罩，营造体积感，而非纯平涂；
//   - 软投影：独立的模糊椭圆地面阴影，随步频脉动；
//   - 骨骼式行走：髋/膝、肩/肘两段关节摆动 + 躯干呼吸 + 头部点动；
//   - 漂浮尘埃粒子 + 落脚扬尘，增加场景纵深；
//   - 尊重 prefers-reduced-motion：静态定格、不启动 ticker。
// 仅在客户端运行（动态 import('pixi.js') 规避 SSR）。

import { useEffect, useRef } from 'react'
import type { CharacterAppearance } from '../app/character'

type Props = {
  a: CharacterAppearance
  /** 0..1 的人生进度：0 = 出生(最左)，1 = 人生终点(最右)。小人沿时间轴行走到此处。 */
  progress: number
  /** 无障碍描述，挂在容器上。 */
  ariaLabel?: string
}

// 把 0..1 的明暗叠加到一个 Graphics 上的小工具：用低透明度白/黑罩出高光与暗面。
// （Pixi v8 也有 FillGradient，但分层平涂更可控、跨版本更稳。）

export default function PixiCharacter({ a, progress, ariaLabel }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  // Pixi 运行期对象（动态加载，统一用 any 规避命名空间类型摩擦）。
  const appRef = useRef<any>(null)
  const layersRef = useRef<any>(null)
  const appearanceRef = useRef<CharacterAppearance>(a)
  const progressRef = useRef(progress)
  const animRef = useRef({ t: 0, dir: 1, x: 0 })
  const reducedRef = useRef(false)
  const destroyedRef = useRef(false)

  // 颜色叠加：在已绘制路径上再覆盖一层半透明色块（高光/暗面）。
  // 接收一个绘制函数把同一形状再画一遍，用于 fill 高光/暗面。

  useEffect(() => {
    appearanceRef.current = a
  }, [a])

  useEffect(() => {
    progressRef.current = progress
    const layers = layersRef.current
    if (layers && typeof layers.applyProgress === 'function') layers.applyProgress()
  }, [progress])

  useEffect(() => {
    let cancelled = false
    destroyedRef.current = false
    const host = hostRef.current
    if (!host) return

    reducedRef.current =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let cleanup = () => {}

    ;(async () => {
      const PIXI = await import('pixi.js')
      if (cancelled || !hostRef.current) return

      const app = new PIXI.Application()
      const initW = host.clientWidth || 320
      const initH = host.clientHeight || 110
      await app.init({
        width: initW,
        height: initH,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2),
        autoDensity: true,
      })
      if (cancelled) {
        app.destroy(true)
        return
      }
      appRef.current = app
      host.appendChild(app.canvas)
      app.canvas.style.position = 'absolute'
      app.canvas.style.inset = '0'
      app.canvas.style.width = '100%'
      app.canvas.style.height = '100%'

      // ---- 图层结构 ----
      const stage = app.stage
      const dust = new PIXI.Container() // 背景漂浮尘埃
      const shadow = new PIXI.Graphics() // 地面软投影
      shadow.filters = [new PIXI.BlurFilter({ strength: 4, quality: 3 })]
      const walker = new PIXI.Container() // 横向移动 + 翻面
      const footDust = new PIXI.Container() // 落脚扬尘（世界坐标，不随 walker 翻面）
      const figure = new PIXI.Container() // 人物本体（站在 walker 原点 = 脚底）
      walker.addChild(figure)
      stage.addChild(dust)
      stage.addChild(shadow)
      stage.addChild(footDust)
      stage.addChild(walker)

      layersRef.current = { dust, shadow, walker, footDust, figure, PIXI }

      // 漂浮尘埃初始化。
      const motes: any[] = []
      const seedMotes = (w: number, h: number) => {
        for (const m of motes) dust.removeChild(m.g)
        motes.length = 0
        const n = 14
        for (let i = 0; i < n; i++) {
          const g = new PIXI.Graphics()
          const r = 0.6 + Math.random() * 1.4
          g.circle(0, 0, r).fill({ color: '#94a3b8', alpha: 0.18 + Math.random() * 0.18 })
          g.x = Math.random() * w
          g.y = Math.random() * (h * 0.8)
          dust.addChild(g)
          motes.push({ g, vx: (Math.random() - 0.5) * 4, vy: -2 - Math.random() * 4, ph: Math.random() * Math.PI * 2 })
        }
      }

      const footPuffs: any[] = []

      // ---- 人物构建 ----
      const limbs: any = {}
      const buildFigure = () => {
        const ap = appearanceRef.current
        figure.removeChildren()
        for (const k of Object.keys(limbs)) delete limbs[k]

        const h = ap.heightScale
        const headRBase = 6
        const headR = headRBase * (1 + (1 - h) * 0.55)
        const figureH = 72 * h
        const torsoTop = headR * 2
        const torsoH = figureH * 0.42
        const legTop = torsoTop + torsoH * (ap.paunch ? 0.96 : 1.0)
        const legH = figureH * 0.34
        const limbW = 1.8
        const armH = torsoH * 0.92
        const upperArmH = armH * 0.52
        const foreArmH = armH * 0.5
        const thighH = legH * 0.52
        const shinH = legH * 0.5
        const shoulderY = torsoTop + 0.6
        const hipY = legTop
        const totalH = legTop + legH + 1.6

        // body：以脚底为原点(0,0)，内部用"y 向下、0 在头顶"的坐标，整体上移 totalH。
        const body = new PIXI.Container()
        body.y = -totalH
        figure.addChild(body)

        // 单段肢体工厂：容器原点 = 关节点，肢体向下绘制；旋转即绕关节。
        const makeSegment = (jx: number, jy: number) => {
          const seg = new PIXI.Container()
          seg.position.set(jx, jy)
          return seg
        }
        const limbColor = ap.legFill
        const sleeveColor = ap.outfitStroke

        const paintLimb = (g: any, w: number, len: number, base: string) => {
          g.roundRect(-w / 2, 0, w, len, w * 0.5).fill(base)
          // 受光侧高光 + 暗侧
          g.rect(-w / 2, 0, w * 0.42, len).fill({ color: '#ffffff', alpha: 0.16 })
          g.rect(w * 0.08, 0, w * 0.42, len).fill({ color: '#000000', alpha: 0.18 })
        }

        const drawShoe = (g: any, w: number) => {
          g.roundRect(-w / 2 - 0.6, -0.2, w + 1.4, 1.7, 0.8).fill('#0f172a')
          g.rect(-w / 2 - 0.4, -0.2, w + 0.8, 0.4).fill({ color: '#ffffff', alpha: 0.22 })
        }

        // ----- 后腿 -----
        const backLegX = headR * 0.3
        const backLeg = makeSegment(backLegX, hipY)
        const backThigh = new PIXI.Graphics()
        paintLimb(backThigh, limbW, thighH, limbColor)
        backLeg.addChild(backThigh)
        const backShin = makeSegment(0, thighH)
        const backShinG = new PIXI.Graphics()
        paintLimb(backShinG, limbW, shinH, limbColor)
        const backShoe = new PIXI.Graphics()
        backShoe.y = shinH
        drawShoe(backShoe, limbW)
        backShin.addChild(backShinG)
        backShin.addChild(backShoe)
        backLeg.addChild(backShin)
        body.addChild(backLeg)

        // ----- 后臂 -----
        const backArmX = headR * 0.92
        const backArm = makeSegment(backArmX, shoulderY)
        const backUpper = new PIXI.Graphics()
        paintLimb(backUpper, limbW * 0.95, upperArmH, sleeveColor)
        backArm.addChild(backUpper)
        const backFore = makeSegment(0, upperArmH)
        const backForeG = new PIXI.Graphics()
        paintLimb(backForeG, limbW * 0.95, foreArmH, sleeveColor)
        const backHand = new PIXI.Graphics()
        backHand.circle(0, foreArmH + 0.4, 0.95).fill(ap.skinFill).stroke({ width: 0.2, color: ap.skinShade })
        backFore.addChild(backForeG)
        backFore.addChild(backHand)
        backArm.addChild(backFore)
        body.addChild(backArm)

        // ----- 躯干（含呼吸容器）-----
        const torso = new PIXI.Container()
        const torsoG = new PIXI.Graphics()
        if (ap.paunch) {
          torsoG
            .moveTo(-headR * 0.95, torsoTop)
            .lineTo(headR * 0.95, torsoTop)
            .quadraticCurveTo(headR * 1.4, torsoTop + torsoH * 0.5, headR * 0.85, torsoTop + torsoH)
            .lineTo(-headR * 0.85, torsoTop + torsoH)
            .quadraticCurveTo(-headR * 1.4, torsoTop + torsoH * 0.5, -headR * 0.95, torsoTop)
            .fill(ap.outfitFill)
            .stroke({ width: 0.6, color: ap.outfitStroke })
        } else {
          torsoG
            .poly([
              -headR * 0.95, torsoTop,
              headR * 0.95, torsoTop,
              headR * 0.78, torsoTop + torsoH,
              -headR * 0.78, torsoTop + torsoH,
            ])
            .fill(ap.outfitFill)
            .stroke({ width: 0.6, color: ap.outfitStroke })
        }
        // 服装体积：上亮下暗 + 中轴高光。
        torsoG.poly([
          -headR * 0.95, torsoTop,
          headR * 0.95, torsoTop,
          headR * 0.86, torsoTop + torsoH * 0.5,
          -headR * 0.86, torsoTop + torsoH * 0.5,
        ]).fill({ color: '#ffffff', alpha: 0.12 })
        torsoG.poly([
          -headR * 0.9, torsoTop + torsoH * 0.5,
          headR * 0.9, torsoTop + torsoH * 0.5,
          headR * 0.78, torsoTop + torsoH,
          -headR * 0.78, torsoTop + torsoH,
        ]).fill({ color: '#000000', alpha: 0.16 })
        // 领口 V 领暗块
        torsoG.poly([
          -headR * 0.62, torsoTop,
          headR * 0.62, torsoTop,
          0, torsoTop + torsoH * 0.28,
        ]).fill({ color: ap.outfitFillDark, alpha: 0.85 })
        // 中轴受光带
        torsoG.moveTo(0, torsoTop + 1).lineTo(0, torsoTop + torsoH - 1).stroke({ width: 0.5, color: '#ffffff', alpha: 0.35 })
        // 衬衫领（领带/西装时露白）
        if (ap.accessory === 'tie' || ap.accessory === 'briefcase') {
          torsoG.poly([-0.9, torsoTop + 0.3, 0.9, torsoTop + 0.3, 0, torsoTop + torsoH * 0.45])
            .fill('#f8fafc').stroke({ width: 0.3, color: '#cbd5e1' })
        }
        if (ap.accessory === 'school_tie') {
          torsoG.rect(-headR * 0.95, torsoTop, headR * 1.9, 1.2).fill('#facc15')
        }
        torso.addChild(torsoG)
        body.addChild(torso)
        limbs.torso = torso

        // ----- 前腿 -----
        const frontLegX = -headR * 0.3
        const frontLeg = makeSegment(frontLegX, hipY)
        const frontThigh = new PIXI.Graphics()
        paintLimb(frontThigh, limbW, thighH, limbColor)
        frontLeg.addChild(frontThigh)
        const frontShin = makeSegment(0, thighH)
        const frontShinG = new PIXI.Graphics()
        paintLimb(frontShinG, limbW, shinH, limbColor)
        const frontShoe = new PIXI.Graphics()
        frontShoe.y = shinH
        drawShoe(frontShoe, limbW)
        frontShin.addChild(frontShinG)
        frontShin.addChild(frontShoe)
        frontLeg.addChild(frontShin)
        body.addChild(frontLeg)

        // ----- 配饰：公文包 / 拐杖 / 书包 / 领带（躯干层之上）-----
        if (ap.accessory === 'briefcase') {
          const bc = new PIXI.Graphics()
          bc.roundRect(headR * 0.95, torsoTop + armH * 0.95, 3.4, 2.6, 0.5).fill('#1f2937').stroke({ width: 0.4, color: '#0f172a' })
          bc.moveTo(headR * 0.95 + 0.4, torsoTop + armH * 0.95).lineTo(headR * 0.95 + 0.4, torsoTop + armH * 0.85).stroke({ width: 0.5, color: '#1f2937' })
          bc.moveTo(headR * 0.95 + 3.0, torsoTop + armH * 0.95).lineTo(headR * 0.95 + 3.0, torsoTop + armH * 0.85).stroke({ width: 0.5, color: '#1f2937' })
          body.addChild(bc)
        }
        if (ap.accessory === 'cane' || ap.accessory === 'cane_glasses') {
          const cane = new PIXI.Graphics()
          cane.moveTo(headR * 1.15, torsoTop + armH * 0.55).lineTo(headR * 1.7, legTop + legH + 0.4).stroke({ width: 1.1, color: '#7c2d12', cap: 'round' })
          cane.moveTo(headR * 1.05, torsoTop + armH * 0.55).quadraticCurveTo(headR * 1.05 - 0.3, torsoTop + armH * 0.55 - 1.1, headR * 1.05 + 0.6, torsoTop + armH * 0.55 - 1.4).stroke({ width: 1.0, color: '#7c2d12', cap: 'round' })
          body.addChild(cane)
        }
        if (ap.accessory === 'school' || ap.accessory === 'school_tie') {
          const bag = new PIXI.Graphics()
          bag.roundRect(-headR * 1.35, torsoTop + 0.4, 2.0, armH * 0.85, 0.6).fill('#dc2626')
          body.addChild(bag)
        }
        if (ap.accessory === 'tie') {
          const tie = new PIXI.Graphics()
          tie.poly([
            -0.9, torsoTop + 0.5,
            0.9, torsoTop + 0.5,
            0.5, torsoTop + 1.5,
            1.1, torsoTop + torsoH * 0.7,
            -1.1, torsoTop + torsoH * 0.7,
            -0.5, torsoTop + 1.5,
          ]).fill('#dc2626').stroke({ width: 0.3, color: '#7f1d1d' })
          body.addChild(tie)
        }

        // ----- 前臂 -----
        const frontArmX = -headR * 0.92
        const frontArm = makeSegment(frontArmX, shoulderY)
        const frontUpper = new PIXI.Graphics()
        paintLimb(frontUpper, limbW * 0.95, upperArmH, sleeveColor)
        frontArm.addChild(frontUpper)
        const frontFore = makeSegment(0, upperArmH)
        const frontForeG = new PIXI.Graphics()
        paintLimb(frontForeG, limbW * 0.95, foreArmH, sleeveColor)
        const frontHand = new PIXI.Graphics()
        frontHand.circle(0, foreArmH + 0.4, 0.95).fill(ap.skinFill).stroke({ width: 0.2, color: ap.skinShade })
        frontFore.addChild(frontForeG)
        frontFore.addChild(frontHand)
        frontArm.addChild(frontFore)
        body.addChild(frontArm)

        // ----- 头部（点动容器，pivot = 颈根）-----
        const head = new PIXI.Container()
        const neckY = headR * 1.85
        head.position.set(0, neckY)
        const hg = new PIXI.Graphics()
        const o = (x: number, y: number): [number, number] => [x, y - neckY] // body 坐标 → head 局部
        // 颈
        hg.rect(...mk(o(-headR * 0.35, headR * 1.85)), headR * 0.7, headR * 0.4).fill(ap.skinFill)
        // 头
        const [hcx, hcy] = o(0, headR)
        hg.circle(hcx, hcy, headR).fill(ap.skinFill).stroke({ width: 0.4, color: ap.skinShade })
        // 脸颊暗面（右下）
        hg.circle(hcx + headR * 0.32, hcy + headR * 0.18, headR * 0.78).fill({ color: '#000000', alpha: 0.06 })
        // 腮红
        hg.ellipse(...mk(o(-headR * 0.55, headR * 1.25)), 1.1, 0.6).fill({ color: '#f472b6', alpha: 0.45 })
        hg.ellipse(...mk(o(headR * 0.55, headR * 1.25)), 1.1, 0.6).fill({ color: '#f472b6', alpha: 0.45 })
        // 眉
        hg.moveTo(...mk(o(-headR * 0.6, headR * 0.75))).lineTo(...mk(o(-headR * 0.18, headR * 0.7))).stroke({ width: 0.7, color: ap.hairFill, cap: 'round' })
        hg.moveTo(...mk(o(headR * 0.18, headR * 0.7))).lineTo(...mk(o(headR * 0.6, headR * 0.75))).stroke({ width: 0.7, color: ap.hairFill, cap: 'round' })
        // 眼
        const eye = (sx: number) => {
          const [ex, ey] = o(headR * sx, headR * 1.0)
          hg.circle(ex, ey, 1.1).fill('#ffffff').stroke({ width: 0.3, color: '#0f172a' })
          hg.circle(ex + (sx > 0 ? 0.03 : -0.03) * headR, ey + 0.05 * headR, 0.55).fill('#1f2937')
          hg.circle(ex + 0.03 * headR, ey - 0.05 * headR, 0.18).fill('#ffffff')
        }
        eye(-0.35)
        eye(0.35)
        // 嘴
        const [mx, my] = o(0, headR * 1.45)
        drawMouth(hg, ap.mouth, mx, my)
        // 眼镜
        if (ap.accessory === 'cane_glasses') {
          const gl = (sx: number) => {
            const [ex, ey] = o(headR * sx, headR * 1.0)
            hg.circle(ex, ey, 1.5).stroke({ width: 0.4, color: '#1f2937' })
            return [ex, ey] as [number, number]
          }
          const l = gl(-0.35)
          const r = gl(0.35)
          hg.moveTo(l[0] + 1.5, l[1]).lineTo(r[0] - 1.5, r[1]).stroke({ width: 0.4, color: '#1f2937' })
        }
        // 耳机：头顶弧带 + 两侧耳罩
        if (ap.accessory === 'headphones') {
          const [bl, blY] = o(-headR * 0.95, headR * 0.6)
          const [br] = o(headR * 0.95, headR * 0.6)
          const [, topY] = o(0, -headR * 0.05)
          hg.moveTo(bl, blY).quadraticCurveTo(0, topY, br, blY).stroke({ width: 0.7, color: '#0f172a', cap: 'round' })
          hg.ellipse(...mk(o(-headR * 0.95, headR * 0.95)), 0.9, 1.1).fill('#0f172a')
          hg.ellipse(...mk(o(headR * 0.95, headR * 0.95)), 0.9, 1.1).fill('#0f172a')
        }
        // 头发
        drawHair(hg, ap, headR, neckY)
        head.addChild(hg)
        body.addChild(head)
        limbs.head = head

        // 双马尾
        if (ap.hairStyle === 'pony-twin') {
          const pl = new PIXI.Graphics()
          pl.ellipse(...mk(o(-headR * 1.05, headR * 1.15)), 1.2, 2.1).fill(ap.hairFill)
          const pr = new PIXI.Graphics()
          pr.ellipse(...mk(o(headR * 1.05, headR * 1.15)), 1.2, 2.1).fill(ap.hairFill)
          head.addChild(pl)
          head.addChild(pr)
        }

        // 缓存关节引用供 ticker 驱动。
        limbs.backLeg = backLeg
        limbs.backShin = backShin
        limbs.backArm = backArm
        limbs.backFore = backFore
        limbs.frontLeg = frontLeg
        limbs.frontShin = frontShin
        limbs.frontArm = frontArm
        limbs.frontFore = frontFore

        // 姿态：前倾 / 驼背整体旋转。
        body.rotation = ap.posture === 'leaning-fwd' ? -0.035 : ap.posture === 'stooped' ? 0.05 : 0

        return { totalH, headR }
      }

      let geom = buildFigure()

      // ---- 尺寸自适应 ----
      let W = initW
      let H = initH
      let scale = 1
      let groundY = H - 18
      let leftX = 24
      let rightX = W - 24
      // 把人生进度(0..1)映射成横向位置：0=最左(出生)，1=最右(终点)。小人始终朝右行走。
      const applyProgress = () => {
        const p = Math.max(0, Math.min(1, progressRef.current))
        const span = Math.max(0, rightX - leftX)
        walker.x = leftX + p * span
        walker.scale.x = 1
        shadow.x = walker.x
      }
      const layout = () => {
        W = host.clientWidth || W
        H = host.clientHeight || H
        app.renderer.resize(W, H)
        const targetFullPx = H * 0.62
        scale = targetFullPx / 72
        figure.scale.set(scale)
        groundY = H - 16
        const halfW = (geom.headR * 1.6) * scale
        leftX = halfW + 6
        rightX = W - halfW - 6
        if (rightX < leftX) rightX = leftX
        figure.y = groundY
        seedMotes(W, H)
        applyProgress()
      }
      layout()
      const ro = new ResizeObserver(() => layout())
      ro.observe(host)
      ;(layersRef.current as any).applyProgress = applyProgress

      // ---- 动画 ----
      const reduced = reducedRef.current
      const spawnPuff = (x: number, y: number) => {
        const g = new PIXI.Graphics()
        g.circle(0, 0, 1.2 + Math.random() * 1.4).fill({ color: '#cbd5e1', alpha: 0.4 })
        g.x = x
        g.y = y
        footDust.addChild(g)
        footPuffs.push({ g, life: 1, vx: (Math.random() - 0.5) * 10, vy: -6 - Math.random() * 6 })
      }

      let lastStepSign = 0
      const tick = (ticker: any) => {
        if (destroyedRef.current) return
        const ap = appearanceRef.current
        const dt = ticker.deltaMS / 1000
        const an = animRef.current
        an.t += dt

        // 横向位置：跟随人生进度(0..1)沿时间轴前进，始终朝右，不再往返踱步。
        applyProgress()

        // 步态相位。
        const stepW = (Math.PI * 2) / Math.max(0.2, ap.bobSpeedSec)
        const ph = an.t * stepW
        const soft = ap.posture === 'stooped' ? 0.45 : 1
        const swing = Math.sin(ph) * 0.52 * soft
        const armSwing = Math.sin(ph) * 0.46 * soft

        if (limbs.backLeg) {
          limbs.backLeg.rotation = swing
          limbs.frontLeg.rotation = -swing
          // 膝：摆到前方的腿在触地期屈一点。
          limbs.backShin.rotation = Math.max(0, Math.sin(ph + Math.PI * 0.5)) * 0.4
          limbs.frontShin.rotation = Math.max(0, Math.sin(ph - Math.PI * 0.5)) * 0.4
          limbs.backArm.rotation = -armSwing
          limbs.frontArm.rotation = armSwing
          limbs.backFore.rotation = Math.max(0, Math.sin(ph)) * 0.3
          limbs.frontFore.rotation = Math.max(0, -Math.sin(ph)) * 0.3
        }

        // 躯干呼吸 + bob。
        const bob = -Math.abs(Math.sin(ph)) * ap.bobAmpPx * 0.5
        figure.y = groundY + bob
        if (limbs.torso) limbs.torso.scale.y = 1 + Math.sin(an.t * 2.0) * 0.012
        if (limbs.head) limbs.head.rotation = Math.sin(ph) * 0.04

        // 落脚扬尘：每次 sin 过零（踩地）生成。
        const sign = Math.sign(Math.sin(ph))
        if (sign !== lastStepSign && sign !== 0) {
          lastStepSign = sign
          spawnPuff(walker.x + (sign > 0 ? 4 : -4) * walker.scale.x, groundY)
        }
        for (let i = footPuffs.length - 1; i >= 0; i--) {
          const p = footPuffs[i]
          p.life -= dt * 1.8
          p.g.x += p.vx * dt
          p.g.y += p.vy * dt
          p.g.alpha = Math.max(0, p.life) * 0.4
          if (p.life <= 0) {
            footDust.removeChild(p.g)
            p.g.destroy()
            footPuffs.splice(i, 1)
          }
        }

        // 软投影：跟随 + 步频脉动。
        shadow.clear()
        const shW = geom.headR * 2.2 * scale
        const pulse = 1 - Math.abs(Math.sin(ph)) * 0.18
        shadow.ellipse(0, 0, shW * 0.5 * pulse, shW * 0.16 * pulse).fill({ color: '#0f172a', alpha: 0.34 })
        shadow.x = walker.x
        shadow.y = groundY + 2

        // 漂浮尘埃。
        for (const m of motes) {
          m.g.x += m.vx * dt
          m.g.y += m.vy * dt
          m.g.alpha = (0.16 + 0.12 * (0.5 + 0.5 * Math.sin(an.t * 1.5 + m.ph)))
          if (m.g.y < -4) {
            m.g.y = H * 0.85
            m.g.x = Math.random() * W
          }
          if (m.g.x < -4) m.g.x = W + 4
          if (m.g.x > W + 4) m.g.x = -4
        }
      }

      if (reduced) {
        // 静态定格：摆一个轻微迈步姿势，软投影画一次。
        if (limbs.backLeg) {
          limbs.backLeg.rotation = 0.28
          limbs.frontLeg.rotation = -0.28
          limbs.backArm.rotation = -0.24
          limbs.frontArm.rotation = 0.24
        }
        shadow.clear()
        const shW = geom.headR * 2.2 * scale
        shadow.ellipse(0, 0, shW * 0.5, shW * 0.16).fill({ color: '#0f172a', alpha: 0.34 })
        applyProgress()
        shadow.y = groundY + 2
        figure.y = groundY
      } else {
        animRef.current = { t: 0, dir: 1, x: 0 }
        app.ticker.add(tick)
      }

      // 外观变化时重建。
      const rebuild = () => {
        geom = buildFigure()
        layout()
      }
      ;(layersRef.current as any).rebuild = rebuild

      cleanup = () => {
        destroyedRef.current = true
        ro.disconnect()
        try {
          app.ticker.remove(tick)
        } catch {}
        app.destroy(true, { children: true })
        appRef.current = null
        layersRef.current = null
      }
    })()

    return () => {
      cancelled = true
      cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 外观切换：触发重建（appearanceRef 已在上面的 effect 同步）。
  useEffect(() => {
    appearanceRef.current = a
    const layers = layersRef.current as any
    if (layers && typeof layers.rebuild === 'function') {
      layers.rebuild()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a])

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={ariaLabel}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    />
  )
}

// ---- 纯绘制辅助（不依赖 React，接收 Pixi Graphics 实例）----

// 把 [x,y] 元组展开给 rect/ellipse 调用。
function mk(t: [number, number]): [number, number] {
  return t
}

function drawMouth(g: any, m: string, x: number, y: number) {
  g.moveTo(x - 1.5, y)
  switch (m) {
    case 'big-smile':
      g.quadraticCurveTo(x, y + 1.8, x + 1.6, y)
      break
    case 'smile':
      g.quadraticCurveTo(x, y + 1.0, x + 1.4, y)
      break
    case 'soft-down':
      g.quadraticCurveTo(x, y - 0.8, x + 1.4, y)
      break
    default: // calm / firm
      g.lineTo(x + 1.5, y)
      break
  }
  g.stroke({ width: 0.7, color: '#7f1d1d', cap: 'round' })
}

function drawHair(g: any, ap: CharacterAppearance, headR: number, neckY: number) {
  const o = (x: number, y: number): [number, number] => [x, y - neckY]
  const style = ap.hairStyle
  if (style === 'bald') return
  const fill = ap.hairFill
  if (style === 'bald-top') {
    // 两侧 + 后脑残发：用两个半月。
    g.ellipse(...mk(o(-headR * 0.85, headR * 1.05)), headR * 0.35, headR * 0.5).fill(fill)
    g.ellipse(...mk(o(headR * 0.85, headR * 1.05)), headR * 0.35, headR * 0.5).fill(fill)
    return
  }
  if (style === 'thinning') {
    const [cx, cy] = o(0, headR * 0.45)
    g.ellipse(cx, cy, headR * 0.95, headR * 0.6).fill(fill)
    return
  }
  if (style === 'medium' || style === 'pony-twin') {
    const [cx, cy] = o(0, headR * 0.35)
    g.ellipse(cx, cy, headR * 1.05, headR * 0.8).fill(fill)
    // 高光弧
    const [hx, hy] = o(-headR * 0.4, headR * 0.45)
    g.moveTo(hx, hy).quadraticCurveTo(hx + headR * 0.4, hy - headR * 0.3, hx + headR * 0.9, hy - headR * 0.05).stroke({ width: 0.5, color: ap.hairHighlight, alpha: 0.65, cap: 'round' })
    return
  }
  // short
  const [cx, cy] = o(0, headR * 0.45)
  g.ellipse(cx, cy, headR * 0.98, headR * 0.62).fill(fill)
  const [hx, hy] = o(-headR * 0.35, headR * 0.5)
  g.moveTo(hx, hy).quadraticCurveTo(hx + headR * 0.4, hy - headR * 0.25, hx + headR * 0.85, hy).stroke({ width: 0.5, color: ap.hairHighlight, alpha: 0.6, cap: 'round' })
}
