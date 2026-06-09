import './globals.css'

export const metadata = {
  metadataBase: new URL('https://jaxblack.github.io/life-quant-sim/'),
  title: '量化人生模拟器 | 0-100岁人生时间轴模拟',
  description:
    '量化人生模拟器：在 0-100 岁的全程时间轴上,用模型量化教育、职业、健康与财富的长期影响。WebGL 小人沿人生时间轴行走,直观呈现出生地域与出身家庭如何塑造不同的人生曲线与机会成本。',
  keywords: [
    '量化人生',
    '人生模拟器',
    '人生时间轴',
    '人生规划',
    '机会成本',
    '人生选择模拟',
    '财富积累模型',
    '职业发展',
    '健康曲线',
    '原生家庭影响',
    '出身地域',
    '人生窗口',
    'life simulator',
    'life quant',
    'life timeline',
    'life planning',
  ],
  authors: [{ name: 'bestcoder', url: 'https://bestcoder.cn' }],
  creator: 'bestcoder.cn',
  alternates: {
    canonical: 'https://jaxblack.github.io/life-quant-sim/',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://jaxblack.github.io/life-quant-sim/',
    siteName: '量化人生模拟器',
    title: '量化人生模拟器 | 0-100岁人生时间轴模拟',
    description:
      '在 0-100 岁的全程时间轴上量化教育、职业、健康与财富的长期影响,看清每一次人生选择的机会成本。',
  },
  twitter: {
    card: 'summary',
    title: '量化人生模拟器 | 0-100岁人生时间轴模拟',
    description:
      '在 0-100 岁的全程时间轴上量化教育、职业、健康与财富的长期影响,看清每一次人生选择的机会成本。',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header
          className="lqs-header"
          style={{ borderBottom: '1px solid #e5e7eb', padding: '16px 24px' }}
        >
          <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <strong>量化人生模拟器</strong>
            <a
              href="https://bestcoder.cn"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#6b7280', fontSize: 14, textDecoration: 'none' }}
            >
              作者 · bestcoder.cn
            </a>
          </nav>
        </header>
        <main
          className="lqs-main"
          style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px' }}
        >
          {children}
        </main>
        <footer
          className="lqs-footer"
          style={{ borderTop: '1px solid #e5e7eb', padding: '20px 24px', textAlign: 'center', color: '#6b7280', fontSize: 13 }}
        >
          © 量化人生模拟器 · 作者{' '}
          <a
            href="https://bestcoder.cn"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#374151' }}
          >
            bestcoder.cn
          </a>
        </footer>
      </body>
    </html>
  )
}
