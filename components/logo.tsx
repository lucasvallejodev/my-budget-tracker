import { Flower } from 'lucide-react'
import React from 'react'

function Logo() {
  return (
    <a href="/" className="flex flex-row gap-1 items-center h-14" aria-label="Home">
      <Flower className="text-blue-800" />
      <span className="text-primary font-bold text-xl">CoinKeeper</span>
    </a>
  )
}

export default Logo