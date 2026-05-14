'use client'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, LayoutDashboard, UtensilsCrossed, Dumbbell, TrendingUp, Menu } from 'lucide-react'
import { useState } from 'react'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat', label: 'AI Coach', icon: MessageCircle },
  { href: '/food-log', label: 'Food Log', icon: UtensilsCrossed },
  { href: '/workout', label: 'Workout', icon: Dumbbell },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
]

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-primary">
          FitMind AI
        </Link>

        {session && (
          <>
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>

            {/* User menu */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage src={session.user?.image || ''} />
                    <AvatarFallback>{session.user?.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-sm text-muted-foreground">
                    {session.user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </>
        )}

        {!session && (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => router.push('/login')}>Login</Button>
            <Button onClick={() => router.push('/login')}>Get Started</Button>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {session && mobileOpen && (
        <div className="md:hidden border-t bg-background px-4 py-2">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                pathname === href ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
