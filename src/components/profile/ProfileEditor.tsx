'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2 } from 'lucide-react'

interface ProfileData {
  age: number | null
  height: number | null
  weight: number | null
  gender: string | null
  goal: string | null
  workSchedule: string | null
  sleepHours: number | null
  foodPreference: string | null
  medicalNotes: string | null
  equipmentAccess: string | null
  cookingSkill: string | null
}

interface ProfileEditorProps {
  initialProfile: ProfileData | null
  userEmail: string
  userName: string | null
}

interface FormState {
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

function toFormState(profile: ProfileData | null): FormState {
  return {
    age: profile?.age != null ? String(profile.age) : '',
    height: profile?.height != null ? String(profile.height) : '',
    weight: profile?.weight != null ? String(profile.weight) : '',
    gender: profile?.gender ?? '',
    goal: profile?.goal ?? '',
    workSchedule: profile?.workSchedule ?? '',
    sleepHours: profile?.sleepHours != null ? String(profile.sleepHours) : '',
    foodPreference: profile?.foodPreference ?? '',
    medicalNotes: profile?.medicalNotes ?? '',
    equipmentAccess: profile?.equipmentAccess ?? '',
    cookingSkill: profile?.cookingSkill ?? '',
  }
}

export default function ProfileEditor({ initialProfile, userEmail, userName }: ProfileEditorProps) {
  const [form, setForm] = useState<FormState>(toFormState(initialProfile))
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  function update(key: keyof FormState, val: string) {
    setForm(prev => ({ ...prev, [key]: val }))
    setSaved(false)
  }

  async function handleSave() {
    setLoading(true)
    setSaved(false)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: form.age ? parseInt(form.age) : null,
          height: form.height ? parseFloat(form.height) : null,
          weight: form.weight ? parseFloat(form.weight) : null,
          gender: form.gender || null,
          goal: form.goal || null,
          workSchedule: form.workSchedule || null,
          sleepHours: form.sleepHours ? parseFloat(form.sleepHours) : null,
          foodPreference: form.foodPreference || null,
          medicalNotes: form.medicalNotes || null,
          equipmentAccess: form.equipmentAccess || null,
          cookingSkill: form.cookingSkill || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(true)
      toast.success('Profile updated successfully.')
    } catch {
      toast.error('Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Account info — read-only */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Name</Label>
            <p className="text-sm font-medium">{userName || '—'}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Email</Label>
            <p className="text-sm font-medium">{userEmail}</p>
          </div>
        </CardContent>
      </Card>

      {/* Body metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Body & Demographics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              placeholder="25"
              value={form.age}
              onChange={e => update('age', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gender">Gender</Label>
            <Select value={form.gender} onValueChange={v => v && update('gender', v)}>
              <SelectTrigger id="gender"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              placeholder="170"
              value={form.height}
              onChange={e => update('height', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="70"
              value={form.weight}
              onChange={e => update('weight', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Goals & lifestyle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Goals & Lifestyle</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="goal">Goal</Label>
            <Select value={form.goal} onValueChange={v => v && update('goal', v)}>
              <SelectTrigger id="goal"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weight_loss">Weight Loss</SelectItem>
                <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="endurance">Endurance</SelectItem>
                <SelectItem value="discipline">Discipline</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="workSchedule">Work Schedule</Label>
            <Select value={form.workSchedule} onValueChange={v => v && update('workSchedule', v)}>
              <SelectTrigger id="workSchedule"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="night">Night</SelectItem>
                <SelectItem value="rotating">Rotating</SelectItem>
                <SelectItem value="flexible">Flexible</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sleepHours">Sleep Hours</Label>
            <Input
              id="sleepHours"
              type="number"
              min={3}
              max={12}
              step={0.5}
              placeholder="7"
              value={form.sleepHours}
              onChange={e => update('sleepHours', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="equipmentAccess">Equipment Access</Label>
            <Select value={form.equipmentAccess} onValueChange={v => v && update('equipmentAccess', v)}>
              <SelectTrigger id="equipmentAccess"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="home">Home Gym</SelectItem>
                <SelectItem value="gym">Full Gym</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Food */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Food & Cooking</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="foodPreference">Food Preference</Label>
            <Select value={form.foodPreference} onValueChange={v => v && update('foodPreference', v)}>
              <SelectTrigger id="foodPreference"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="vegetarian">Vegetarian</SelectItem>
                <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                <SelectItem value="vegan">Vegan</SelectItem>
                <SelectItem value="eggetarian">Eggetarian</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cookingSkill">Cooking Skill</Label>
            <Select value={form.cookingSkill} onValueChange={v => v && update('cookingSkill', v)}>
              <SelectTrigger id="cookingSkill"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Medical notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Medical Notes <span className="text-muted-foreground font-normal text-sm">(optional)</span></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor="medicalNotes">Any conditions, injuries, or notes for your AI coach</Label>
            <Textarea
              id="medicalNotes"
              placeholder="e.g., knee pain, diabetes, PCOS..."
              rows={3}
              value={form.medicalNotes}
              onChange={e => update('medicalNotes', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">FitMind AI is not a medical system. Always consult your doctor for medical decisions.</p>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={loading} className="min-w-32">
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Saved
          </span>
        )}
      </div>
    </div>
  )
}
