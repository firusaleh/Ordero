"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function TestLogin() {
  const [email, setEmail] = useState("admin@ordero.de")
  const [password, setPassword] = useState("admin123")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      setResult(res)
      
      if (!res?.error) {
        // Erfolgreiche Anmeldung
        setTimeout(() => {
          router.push("/api/auth/debug")
        }, 1000)
      }
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  const checkSession = async () => {
    const res = await fetch("/api/auth/debug")
    const data = await res.json()
    setResult(data)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Test</h1>
      
      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="space-x-4">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Test Login"}
          </button>
          
          <button
            onClick={checkSession}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Check Session
          </button>
        </div>
      </div>
      
      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-8 text-sm text-gray-600">
        <p>Test accounts:</p>
        <ul>
          <li>admin@ordero.de / admin123 (SUPER_ADMIN)</li>
          <li>demo@ordero.de / demo123 (RESTAURANT_OWNER)</li>
        </ul>
      </div>
    </div>
  )
}