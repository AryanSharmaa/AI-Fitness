import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const FREE_FEATURES = [
  'AI coach chat (20 messages/day)',
  'Basic food logging',
  '1 workout suggestion/day',
  'Core safety guardrails',
  'Streak tracking',
]

const PRO_FEATURES = [
  'Unlimited AI chat',
  'Full behavior memory & pattern analysis',
  'Multi-agent planning (Planner + Critic)',
  'Behavior Engine — tone adaptation',
  'Progress charts (30-day history)',
  'Festival & travel modes',
  'Night shift schedule support',
  'Advanced nutrition adjustments',
  'Priority response time',
]

export default function PricingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">Simple, honest pricing</h1>
        <p className="text-muted-foreground text-lg">
          Less than a gym protein shake per day.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-8 pb-8">
            <h3 className="font-bold text-xl mb-1">Free</h3>
            <p className="text-muted-foreground text-sm mb-4">Get started, no card needed</p>
            <p className="text-4xl font-bold mb-6">₹0</p>
            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">Get Started Free</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-emerald-500 border-2 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-emerald-500 px-4">Most Popular</Badge>
          </div>
          <CardContent className="pt-8 pb-8">
            <h3 className="font-bold text-xl mb-1">Pro</h3>
            <p className="text-muted-foreground text-sm mb-4">Full AI coaching experience</p>
            <div className="mb-6">
              <p className="text-4xl font-bold">₹499<span className="text-base font-normal text-muted-foreground">/mo</span></p>
              <p className="text-sm text-muted-foreground">~₹16/day · Cancel anytime</p>
            </div>
            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Button className="w-full" asChild>
              <Link href="/upgrade">Upgrade to Pro →</Link>
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">7-day free trial. No card required.</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">FAQ</h2>
        <div className="max-w-2xl mx-auto space-y-6 text-left">
          {[
            {
              q: 'Is FitMind AI a substitute for a doctor or dietitian?',
              a: 'No. FitMind AI is a general wellness tool, not a medical device. Always consult a qualified healthcare professional for medical decisions.',
            },
            {
              q: 'Does it work for vegetarians?',
              a: 'Absolutely. The nutrition engine is built around Indian vegetarian food — dal, paneer, curd, fruits, and more. Non-veg and egg options are also fully supported.',
            },
            {
              q: 'Can I cancel anytime?',
              a: 'Yes. Cancel from your profile settings. You keep access until the end of your billing period.',
            },
            {
              q: 'Does the AI remember my history?',
              a: 'On the Pro plan, your AI coach has full memory of your behavior patterns, past workouts, and food habits. It references this to give personalized, context-aware advice.',
            },
          ].map(({ q, a }) => (
            <div key={q}>
              <p className="font-semibold text-sm">{q}</p>
              <p className="text-muted-foreground text-sm mt-1">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
