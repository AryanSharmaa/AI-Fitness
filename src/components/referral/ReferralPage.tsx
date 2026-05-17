'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Gift, Users, Copy, Check, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ReferralData {
  code: string
  referralUrl: string
  usedCount: number
  rewardedCount: number
}

export default function ReferralPage() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [applyCode, setApplyCode] = useState('')
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    fetch('/api/referral')
      .then(r => r.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => {
        toast.error('Failed to load referral info')
        setLoading(false)
      })
  }, [])

  async function handleCopy() {
    if (!data) return
    try {
      await navigator.clipboard.writeText(data.referralUrl)
      setCopied(true)
      toast.success('Link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }

  async function handleShare() {
    if (!data) return
    try {
      await navigator.share({
        title: 'Join me on FitMind AI',
        text: 'Sign up with my referral link and we both get 7 days of Pro free!',
        url: data.referralUrl,
      })
    } catch {
      // User cancelled or API not available — silently ignore
    }
  }

  async function handleApply() {
    if (!applyCode.trim()) return
    setApplying(true)
    try {
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply', code: applyCode.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Something went wrong')
      } else {
        toast.success(json.message ?? '7 days Pro unlocked!')
        setApplyCode('')
      }
    } catch {
      toast.error('Network error, please try again')
    } finally {
      setApplying(false)
    }
  }

  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-white/20 p-3 shrink-0">
            <Gift className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Invite Friends, Get Pro Free</h1>
            <p className="mt-1 text-violet-100 text-sm leading-relaxed">
              You and your friend both get 7 days of Pro when they sign up with your link. No limits — share as much as you like.
            </p>
          </div>
        </div>
      </div>

      {/* Referral link card */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-violet-500" />
          <h2 className="font-semibold text-base">Your Referral Link</h2>
        </div>

        {loading ? (
          <div className="h-10 rounded-lg bg-muted animate-pulse" />
        ) : (
          <div className="flex gap-2">
            <Input
              readOnly
              value={data?.referralUrl ?? ''}
              className="font-mono text-sm"
              onClick={e => (e.target as HTMLInputElement).select()}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              aria-label="Copy link"
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            {canShare && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                aria-label="Share link"
                className="shrink-0"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={handleCopy}
            className="bg-violet-600 hover:bg-violet-700 text-white"
            disabled={loading}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>
          {canShare && (
            <Button variant="outline" onClick={handleShare} disabled={loading}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
        </div>

        {/* Stats row */}
        {!loading && data && (
          <div className="flex gap-3 flex-wrap pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 dark:bg-violet-900/40 px-3 py-1 text-sm font-medium text-violet-700 dark:text-violet-300">
              <Users className="h-3.5 w-3.5" />
              {data.usedCount} {data.usedCount === 1 ? 'friend' : 'friends'} invited
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 dark:bg-purple-900/40 px-3 py-1 text-sm font-medium text-purple-700 dark:text-purple-300">
              <Gift className="h-3.5 w-3.5" />
              {data.rewardedCount} {data.rewardedCount === 1 ? 'reward' : 'rewards'} earned
            </span>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-base">How it works</h2>
        <ol className="space-y-4">
          {[
            {
              step: '1',
              title: 'Share your link',
              desc: 'Send your unique referral link to friends via any channel.',
            },
            {
              step: '2',
              title: 'They sign up',
              desc: 'Your friend creates a FitMind AI account using your link.',
            },
            {
              step: '3',
              title: 'Both get 7 days Pro',
              desc: 'You both instantly receive 7 free days of Pro access — automatically.',
            },
          ].map(({ step, title, desc }) => (
            <li key={step} className="flex gap-4 items-start">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white text-sm font-bold">
                {step}
              </span>
              <div>
                <p className="font-medium text-sm">{title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Apply a code */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-base">Have a referral code?</h2>
        <p className="text-sm text-muted-foreground">
          If a friend gave you their code directly, enter it below to claim your 7 days of Pro.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. ABCD1234"
            value={applyCode}
            onChange={e => setApplyCode(e.target.value.toUpperCase())}
            maxLength={8}
            className="font-mono uppercase tracking-widest"
            onKeyDown={e => e.key === 'Enter' && handleApply()}
          />
          <Button
            onClick={handleApply}
            disabled={applying || !applyCode.trim()}
            className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white"
          >
            {applying ? 'Applying…' : 'Apply'}
          </Button>
        </div>
      </div>
    </div>
  )
}
