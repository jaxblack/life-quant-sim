import Link from 'next/link'
import './globals.css'

export const metadata = {
  title: '量化人生模拟器',
  description: '模拟从 0 到 100 岁，看清人生这条长坡道',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header style={{ borderBottom: '1px solid #e5e7eb', padding: '16px 24px' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <strong style={{ marginRight: 16 }}>量化人生模拟器</strong>
            <Link href="/">首页</Link>
            <Link href="/sim">模拟</Link>
          </nav>
        </header>
        <main style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px' }}>{children}</main>
      </body>
    </html>
  )
}
