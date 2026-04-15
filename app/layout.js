import './globals.css'

export const metadata = {
  title: 'KET 英语口语练习',
  description: '剑桥KET英语口语练习与智能评分系统',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="theme-color" content="#3b82f6" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  )
}
