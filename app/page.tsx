"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export default function HomePage() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setStatus("Email requerido")
      return
    }
    if (!email.includes("@")) {
      setStatus("Email inválido")
      return
    }
    setStatus("¡Registrado! Te avisamos cuando esté listo.")
    setEmail("")
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-mono">
      <div className="text-center">
        <h1 className="text-6xl md:text-8xl font-bold mb-4 text-emerald-400">hack0.dev</h1>

        <p className="text-xl md:text-2xl mb-8 text-gray-300">Hackathons para builders. Cero relleno, puro shipping.</p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-4">
          <Input
            type="email"
            placeholder="tu@email.dev"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-gray-900 border-gray-700 text-white placeholder-gray-500 font-mono focus:border-emerald-400"
          />
          <Button type="submit" className="bg-emerald-400 hover:bg-emerald-500 text-black font-mono font-bold">
            Submit
          </Button>
        </form>

        {status && (
          <p className={`text-sm mb-8 ${status.includes("Registrado") ? "text-emerald-400" : "text-red-400"}`}>
            {status}
          </p>
        )}
      </div>

      <div className="absolute bottom-8 text-center">
        <p className="text-sm text-gray-500">#1 coming soon · sin spam</p>
      </div>
    </div>
  )
}
