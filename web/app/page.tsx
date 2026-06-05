import Link from 'next/link'

export default function HomePage() {
  return (
    <section style={{ display: 'grid', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 48, marginBottom: 12 }}>量化人生模拟器</h1>
        <p style={{ fontSize: 20, color: '#4b5563' }}>模拟从 0 到 100 岁,看清人生这条长坡道</p>
      </div>
      <div style={{ lineHeight: 1.8, color: '#374151' }}>
        <p>把人生拆成可观察的阶段,用模型理解教育、职业、健康与财富的长期影响。</p>
        <p>它不是命运预测器,而是一面帮助你看清变量与路径的镜子。</p>
        <p>从出生背景到关键选择,每一次模拟都呈现不同的人生曲线。</p>
        <p>未来会接入真实 engine,让策略、随机性与长期反馈都可被量化比较。</p>
      </div>
      <div>
        <Link href="/sim" style={{ display: 'inline-block', padding: '12px 18px', borderRadius: 8, background: '#111827', color: 'white', textDecoration: 'none' }}>
          开始模拟
        </Link>
      </div>
    </section>
  )
}
