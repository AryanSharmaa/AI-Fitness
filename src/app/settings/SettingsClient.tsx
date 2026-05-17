'use client'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import ReminderSettings from '@/components/settings/ReminderSettings'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { LogOut, Trash2, MessageSquareX, AlertTriangle } from 'lucide-react'

interface SettingsClientProps {
  userEmail: string
}

type ConfirmAction = 'clear_chat' | 'delete_all' | null

export default function SettingsClient({ userEmail }: SettingsClientProps) {
  const [confirm, setConfirm] = useState<ConfirmAction>(null)
  const [loading, setLoading] = useState(false)

  async function runAction(action: 'clear_chat' | 'delete_all') {
    setLoading(true)
    try {
      const res = await fetch(`/api/settings?action=${action}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      if (action === 'clear_chat') {
        toast.success('Chat history cleared.')
      } else {
        toast.success('All data deleted. Your account remains active.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
      setConfirm(null)
    }
  }

  return (
    <div className="space-y-6">
      <ReminderSettings />
      {/* Account section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Sign out</p>
              <p className="text-xs text-muted-foreground">Sign out of your account on this device.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="shrink-0 gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Clear chat history */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Clear chat history</p>
              <p className="text-xs text-muted-foreground">Deletes all messages with your AI coach. Cannot be undone.</p>
            </div>
            {confirm === 'clear_chat' ? (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">Sure?</span>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={loading}
                  onClick={() => runAction('clear_chat')}
                >
                  {loading ? 'Clearing...' : 'Yes, clear'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={loading}
                  onClick={() => setConfirm(null)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 text-destructive hover:text-destructive"
                onClick={() => setConfirm('clear_chat')}
              >
                <MessageSquareX className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>

          <Separator />

          {/* Delete all data */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Delete all my data</p>
              <p className="text-xs text-muted-foreground">
                Removes food logs, workouts, body logs, chat history, plans, streaks, and water logs.
                Your account stays active.
              </p>
            </div>
            {confirm === 'delete_all' ? (
              <div className="flex items-center gap-2 shrink-0">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={loading}
                  onClick={() => runAction('delete_all')}
                >
                  {loading ? 'Deleting...' : 'Yes, delete all'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={loading}
                  onClick={() => setConfirm(null)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 text-destructive hover:text-destructive"
                onClick={() => setConfirm('delete_all')}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
