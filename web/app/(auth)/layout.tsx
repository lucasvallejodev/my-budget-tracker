import Logo from '@/components/logo'
import { ReactNode } from 'react'

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center">
      <Logo />
      <div className="m-12">
        {children}
      </div>
    </div>
  )
}

export default Layout