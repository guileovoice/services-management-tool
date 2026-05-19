import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'The Studio | Premium Hair Salon in Williamsburg, Brooklyn',
  description: "Book appointments online at The Studio, Brooklyn's premier hair salon. Expert cuts, stunning colors, and beautiful nails.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%236C3CE1' rx='20' width='100' height='100'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='50' font-weight='bold' fill='white'>TS</text></svg>" />
      </head>
      <body className="min-h-screen bg-background">
        {children}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1A1A24',
              color: '#F1F1F3',
              border: '1px solid #2E2E3F',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  )
}