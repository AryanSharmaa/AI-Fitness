import { Resend } from 'resend'

const FROM = 'FitMind AI <noreply@fitmindai.in>'
const BASE = process.env.NEXTAUTH_URL || 'https://fitmindai.in'

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set')
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendWorkoutReminder(to: string, name: string, streak: number, goal: string) {
  const resend = getResend()
  const streakMsg = streak > 0
    ? `You're on a ${streak}-day streak 🔥 Don't break it!`
    : 'Start your streak today 💪'
  const subject = streak > 0
    ? `Day ${streak + 1} — Keep your streak alive 🔥`
    : 'Your daily workout reminder 💪'

  await resend.emails.send({
    from: FROM, to, subject,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <h2 style="color:#10b981;margin-bottom:4px;">FitMind AI</h2>
      <p>Hey ${name || 'there'},</p>
      <p>${streakMsg}</p>
      <p>Your goal: <strong>${goal || 'stay consistent'}</strong></p>
      <a href="${BASE}/workout" style="display:inline-block;background:#10b981;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Log Today's Workout</a>
      <p style="color:#888;font-size:12px;margin-top:24px;">To unsubscribe, go to Settings in FitMind AI.</p>
    </div>`,
  })
}

export async function sendStreakRiskAlert(to: string, name: string, streak: number) {
  const resend = getResend()
  await resend.emails.send({
    from: FROM, to,
    subject: `⚠️ Your ${streak}-day streak is at risk`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <h2 style="color:#10b981;margin-bottom:4px;">FitMind AI</h2>
      <p>Hey ${name || 'there'},</p>
      <p>You haven't logged a workout today and your <strong>${streak}-day streak</strong> is at risk of breaking.</p>
      <p>Even a 10-minute walk counts. Don't break the chain.</p>
      <a href="${BASE}/workout" style="display:inline-block;background:#f59e0b;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Save My Streak</a>
      <p style="color:#888;font-size:12px;margin-top:24px;">To unsubscribe, go to Settings in FitMind AI.</p>
    </div>`,
  })
}
