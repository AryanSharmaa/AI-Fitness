'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

const TOTAL_STEPS = 4

interface FormData {
  age: string
  height: string
  weight: string
  gender: string
  goal: string
  workSchedule: string
  sleepHours: string
  foodPreference: string
  medicalNotes: string
  equipmentAccess: string
  cookingSkill: string
}

export default function OnboardingForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormData>({
    age: '', height: '', weight: '', gender: '',
    goal: '', workSchedule: '', sleepHours: '',
    foodPreference: '', medicalNotes: '',
    equipmentAccess: '', cookingSkill: '',
  })

  function update(key: keyof FormData, val: string) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function submit() {
    setLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: parseInt(form.age) || null,
          height: parseFloat(form.height) || null,
          weight: parseFloat(form.weight) || null,
          sleepHours: parseFloat(form.sleepHours) || null,
          onboardingDone: true,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Profile saved! Let's build your plan.")
      router.push('/chat')
    } catch {
      toast.error('Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="mb-8">
        <Progress value={(step / TOTAL_STEPS) * 100} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2">Step {step} of {TOTAL_STEPS}</p>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Let's start with the basics so your AI coach knows who it's working with.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Age</Label>
                <Input type="number" placeholder="25" value={form.age} onChange={e => update('age', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={v => v && update('gender', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input type="number" placeholder="170" value={form.height} onChange={e => update('height', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" placeholder="70" value={form.weight} onChange={e => update('weight', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Primary Goal</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'fat_loss', label: '🔥 Fat Loss' },
                  { value: 'muscle', label: '💪 Build Muscle' },
                  { value: 'discipline', label: '🎯 Build Discipline' },
                  { value: 'maintenance', label: '⚖️ Maintenance' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => update('goal', value)}
                    className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      form.goal === value ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Lifestyle & Schedule</CardTitle>
            <CardDescription>Your schedule shapes your plan. Night shift workers get a completely different approach.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Work Schedule</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'day', label: '☀️ Day Shift' },
                  { value: 'night', label: '🌙 Night Shift' },
                  { value: 'rotating', label: '🔄 Rotating' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => update('workSchedule', value)}
                    className={`px-3 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      form.workSchedule === value ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Average Sleep (hours)</Label>
              <Input
                type="number"
                min="3" max="12" step="0.5"
                placeholder="7"
                value={form.sleepHours}
                onChange={e => update('sleepHours', e.target.value)}
              />
              {parseFloat(form.sleepHours) < 6 && (
                <p className="text-xs text-orange-500">⚠️ Sleep under 6 hrs — your coach will factor this in for lower intensity days.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Equipment Access</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'none', label: '🏠 No Equipment' },
                  { value: 'home', label: '🔩 Home Gym' },
                  { value: 'gym', label: '🏋️ Full Gym' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => update('equipmentAccess', value)}
                    className={`px-3 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      form.equipmentAccess === value ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Food Preferences</CardTitle>
            <CardDescription>All plans are built around Indian food. No weighing, no grams — just rotis, bowls, and ladles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Food Preference</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'veg', label: '🥦 Vegetarian' },
                  { value: 'eggs', label: '🥚 Eggs OK' },
                  { value: 'non_veg', label: '🍗 Non-Veg' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => update('foodPreference', value)}
                    className={`px-3 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      form.foodPreference === value ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cooking Skill</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'basic', label: '👌 Basic' },
                  { value: 'intermediate', label: '👨‍🍳 Intermediate' },
                  { value: 'advanced', label: '⭐ Advanced' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => update('cookingSkill', value)}
                    className={`px-3 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      form.cookingSkill === value ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Health & Medical (Optional)</CardTitle>
            <CardDescription>This is optional and only used to keep recommendations safe. Not shared with anyone.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Any medical conditions or injuries? (optional)</Label>
              <Textarea
                placeholder="e.g., knee pain, diabetes, PCOS, hypertension..."
                value={form.medicalNotes}
                onChange={e => update('medicalNotes', e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                ⚠️ FitMind AI is not a medical system. Always consult your doctor for medical decisions.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
            Back
          </Button>
        )}
        {step < TOTAL_STEPS ? (
          <Button onClick={() => setStep(s => s + 1)} className="flex-1">
            Continue
          </Button>
        ) : (
          <Button onClick={submit} disabled={loading} className="flex-1">
            {loading ? 'Saving...' : "Build My Plan →"}
          </Button>
        )}
      </div>
    </div>
  )
}
