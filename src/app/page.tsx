import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const FEATURES = [
  {
    emoji: '🧠',
    title: 'Behavior Engine',
    desc: 'Tracks your patterns. Knows when you\'re burning out before you do. Adjusts tone — strict when you need a push, gentle when you\'re struggling.',
  },
  {
    emoji: '🍱',
    title: 'Indian Food First',
    desc: 'Built for roti, rice, dal, sabzi. No grams, no weighing — just bowls, rotis, and ladles. Handles festivals, eating out, and travel days.',
  },
  {
    emoji: '💪',
    title: 'Adaptive Workouts',
    desc: 'Slept 5 hrs? Shorter workout. Night shift? Adjusted plan. Injured? Modified routine. Your life shapes your plan — not the other way.',
  },
  {
    emoji: '🛡️',
    title: 'Safety First',
    desc: 'Hard limits built in. Never suggests extreme restriction. Flags health symptoms. Medical disclaimer injected when needed.',
  },
  {
    emoji: '📊',
    title: 'Pattern Memory',
    desc: '"Last 3 times you skipped after night shift — switching to 15-min routine." Your coach remembers what you forget.',
  },
  {
    emoji: '🔄',
    title: 'Reset Button',
    desc: 'Binge happened? Missed a week? Hit "I messed up" and get back on track without a lecture. No guilt. Just a plan.',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Deep Onboarding',
    desc: 'Not just age and weight. Your schedule, cooking skill, sleep, equipment, and goals. The more context, the smarter the coach.',
  },
  {
    step: '02',
    title: 'AI Coach Chat',
    desc: 'Ask anything. Log meals. Tell it you\'re tired. The AI routes through Planner, Critic, and Behavior agents to give you the right response.',
  },
  {
    step: '03',
    title: 'Adaptive Planning',
    desc: 'Your plan updates daily based on what actually happened — not a static 12-week program nobody follows.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 to-background dark:from-emerald-950/20">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <Badge className="mb-4 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 hover:bg-emerald-100">
            🇮🇳 Built for Indian lifestyles
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            An AI coach that understands<br />
            <span className="text-emerald-600">a tired, imperfect human.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Not a rigid program. Not guilt trips. FitMind AI adapts to your night shifts,
            festival weeks, binge episodes, and missed workouts — and still gets you to your goal.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild className="text-base px-8">
              <Link href="/login">Start Free →</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8">
              <Link href="/chat">Try AI Demo</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">No credit card · No app download</p>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="border-y bg-muted/40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          {['Indian food database', 'No weighing food', 'Night shift support', 'Festival mode', '4 AI agents working together'].map(item => (
            <span key={item} className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Built differently.</h2>
          <p className="text-muted-foreground">Most apps assume you're consistent. This one assumes you're not.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <Card key={f.title} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <span className="text-3xl">{f.emoji}</span>
                <h3 className="font-semibold mt-3 mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/40 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">How it works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(step => (
              <div key={step.step} className="text-center">
                <div className="text-5xl font-bold text-emerald-200 dark:text-emerald-800 mb-3">{step.step}</div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI agents showcase */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">4 agents. One coach.</h2>
          <p className="text-muted-foreground">Every message goes through a multi-agent pipeline before you see the response.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Planner', emoji: '📋', desc: 'Creates your personalized plan' },
            { name: 'Critic', emoji: '🔍', desc: 'Checks feasibility & safety' },
            { name: 'Behavior', emoji: '🧠', desc: 'Adapts tone to your patterns' },
            { name: 'Safety', emoji: '🛡️', desc: 'Hard limits, always enforced' },
          ].map(agent => (
            <Card key={agent.name} className="text-center">
              <CardContent className="pt-5">
                <div className="text-3xl mb-2">{agent.emoji}</div>
                <h3 className="font-semibold text-sm">{agent.name} Agent</h3>
                <p className="text-xs text-muted-foreground mt-1">{agent.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Edge case examples */}
      <section className="bg-muted/40 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Built for real life scenarios</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {[
              { trigger: 'Skipped 3 workouts this week', response: 'Switching to 15-min routine — maintaining streak is more important than intensity right now.' },
              { trigger: 'Had a big birthday dinner', response: 'Enjoy it fully. Tomorrow: lighter breakfast, extra protein at lunch, 20-min walk.' },
              { trigger: 'Night shift ending at 8am', response: 'Sleep first. Workout window is 3-5pm when your cortisol recovers. Adjusted accordingly.' },
              { trigger: 'Feeling dizzy after workout', response: '⚠️ Stop immediately. Sit down, eat something, hydrate. If it persists — please see a doctor.' },
            ].map(({ trigger, response }) => (
              <div key={trigger} className="bg-background rounded-xl border p-4">
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <span className="text-muted-foreground">You:</span> {trigger}
                </div>
                <div className="text-sm text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
                  <span className="text-muted-foreground shrink-0">AI:</span> {response}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-4 py-20" id="pricing">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Simple pricing</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-bold text-lg">Free</h3>
              <p className="text-3xl font-bold mt-2 mb-4">₹0</p>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                {['AI chat (limited)', 'Basic food logging', '1 workout plan/week', 'Core safety features'].map(f => (
                  <li key={f} className="flex items-center gap-2"><span className="text-emerald-500">✓</span>{f}</li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/login">Get Started</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-emerald-500 border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Pro</h3>
                <Badge className="bg-emerald-500">Popular</Badge>
              </div>
              <p className="text-3xl font-bold mt-2">₹499<span className="text-base font-normal text-muted-foreground">/mo</span></p>
              <p className="text-xs text-muted-foreground mb-4">~₹16/day</p>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                {[
                  'Unlimited AI chat',
                  'Full behavior memory',
                  'Multi-agent planning',
                  'Progress analytics',
                  'Festival & travel modes',
                  'Priority support',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2"><span className="text-emerald-500">✓</span>{f}</li>
                ))}
              </ul>
              <Button className="w-full" asChild>
                <Link href="/login">Start Free Trial</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-600 text-white py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to start for real this time?</h2>
          <p className="text-emerald-100 mb-8">Your AI coach doesn't care about your past failures. It cares about your next decision.</p>
          <Button size="lg" variant="secondary" asChild className="text-base px-8">
            <Link href="/login">Start Free →</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2025 FitMind AI</p>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <span>Privacy</span>
            <span>Terms</span>
          </div>
          <p className="text-xs">⚠️ FitMind AI is not a medical system. Always consult a doctor for medical decisions.</p>
        </div>
      </footer>
    </div>
  )
}
