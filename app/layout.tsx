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
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
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