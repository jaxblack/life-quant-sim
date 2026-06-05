'use client'

export default function SimPage() {
  return (
    <section style={{ display: 'grid', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 40, marginBottom: 8 }}>模拟器</h1>
        {/* TODO Phase 2: 接入 engine API */}
        <p style={{ color: '#4b5563' }}>先占位参数表单,下一阶段接入模拟引擎。</p>
      </div>
      <form style={{ display: 'grid', gap: 16, maxWidth: 420 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          出生年份
          <input name="birthYear" type="number" placeholder="1995" style={{ padding: 10 }} />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          家庭社经分位
          <input name="familyPercentile" type="number" min="0" max="100" placeholder="50" style={{ padding: 10 }} />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          运气种子
          <input name="luckSeed" type="text" placeholder="seed-001" style={{ padding: 10 }} />
        </label>
        <button type="button" onClick={() => alert('Phase 2 接入 engine API 后开始模拟')} style={{ padding: '10px 14px' }}>
          开始
        </button>
      </form>
    </section>
  )
}
