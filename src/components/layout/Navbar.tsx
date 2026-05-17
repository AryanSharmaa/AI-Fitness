'use client'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, LayoutDashboard, UtensilsCrossed, Dumbbell, TrendingUp, Scale, Menu, X, CalendarDays, Timer } from 'lucide-react'
import { useState } from 'react'
import ThemeToggle from './ThemeToggle'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat', label: 'AI Coach', icon: MessageCircle },
  { href: '/food-log', label: 'Food Log', icon: UtensilsCrossed },
  { href: '/workout', label: 'Workout', icon: Dumbbell },
  { href: '/body', label: 'Body', icon: Scale },
  { href: '/plan', label: 'Plan', icon: CalendarDays },
  { href: '/fasting', label: 'Fasting', icon: Timer },
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
        <Link href="/" className="font-bold text-xl text-primary" onClick={() => setMobileOpen(false)}>
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

            {/* User menu + mobile toggle */}
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage src={session.user?.image || ''} />
                    <AvatarFallback>{session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-sm text-muted-foreground cursor-default" disabled>
                    {session.user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/settings')}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })} variant="destructive">
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile hamburger */}
              <button
                className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
                onClick={() => setMobileOpen(v => !v)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </>
        )}

        {!session && (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Get Started</Link>
            </Button>
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
