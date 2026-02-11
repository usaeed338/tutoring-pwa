'use client'

import { Menu } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm md:hidden">
      <div className="px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary-600">TutorPro</h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-gray-600"
        >
          <Menu size={24} />
        </button>
      </div>
    </header>
  )
}
