'use client'

export default function HomePage() {
  return (
    <iframe 
      src="/oriido-website/index.html" 
      style={{ 
        width: '100vw', 
        height: '100vh', 
        border: 'none', 
        position: 'fixed', 
        top: 0, 
        left: 0 
      }}
    />
  )
}