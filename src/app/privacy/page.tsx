import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy — FitMind AI',
  description: 'How FitMind AI collects, uses, and protects your personal data.',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: May 2025</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-foreground">

        <section>
          <h2 className="text-lg font-semibold mb-3">1. Who We Are</h2>
          <p className="text-muted-foreground leading-relaxed">
            FitMind AI is an AI-powered fitness and nutrition coaching app. We help users track food, workouts, mood, and body metrics using AI-generated plans and insights. References to "we", "us", or "our" refer to FitMind AI.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">2. Data We Collect</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p><strong className="text-foreground">Account data:</strong> Your email address, used to log you in via OTP. We do not store passwords.</p>
            <p><strong className="text-foreground">Profile data:</strong> Age, height, weight, gender, fitness goal, food preferences, sleep hours, work schedule, equipment access, and optional medical notes you choose to share.</p>
            <p><strong className="text-foreground">Activity data:</strong> Food logs, workout logs, body measurements, water intake, mood and energy scores, fasting logs, and custom routines.</p>
            <p><strong className="text-foreground">Chat data:</strong> Messages you send to the AI coach. These are stored to provide conversation context and improve coaching quality.</p>
            <p><strong className="text-foreground">Usage data:</strong> Basic app usage events (pages visited, features used). We do not use third-party tracking SDKs.</p>
            <p><strong className="text-foreground">Payment data:</strong> Processed entirely by Razorpay. We store only your subscription status — not card details.</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">3. How We Use Your Data</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed">
            <li>Personalise your AI coaching, workout suggestions, and meal plans</li>
            <li>Calculate your calorie targets and macro goals using your profile</li>
            <li>Track your progress and generate insights over time</li>
            <li>Send email reminders and weekly summaries (only if you opt in)</li>
            <li>Detect unsafe patterns (extreme restriction, injury signals) to keep you safe</li>
            <li>Process your subscription via Razorpay</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-3">
            We do not sell your data. We do not use your data for advertising.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">4. AI and Your Data</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your messages to the AI coach and your profile data are sent to AI model providers (via OpenRouter) to generate responses. This includes providers such as DeepSeek, Meta (Llama), Google (Gemma), and Mistral. These providers process your data to generate responses and are bound by their own privacy policies.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">
            We minimise the data sent — only what is necessary for a useful, personalised response. We do not send your email address or payment information to AI providers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">5. Data Storage and Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your data is stored in a PostgreSQL database hosted on Neon (a managed cloud database provider). Data is encrypted in transit (TLS) and at rest. We take reasonable technical measures to protect your data, but no system is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">6. Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed">
            We retain your data for as long as your account is active. If you delete your account, all your personal data is permanently deleted within 30 days. You can request deletion at any time by emailing us.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">7. Your Rights</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed">
            <li><strong className="text-foreground">Access:</strong> Request a copy of all data we hold about you</li>
            <li><strong className="text-foreground">Correction:</strong> Update your profile at any time from the Profile page</li>
            <li><strong className="text-foreground">Export:</strong> Download your data as CSV from the Export page</li>
            <li><strong className="text-foreground">Deletion:</strong> Request full account and data deletion</li>
            <li><strong className="text-foreground">Opt-out:</strong> Disable email reminders at any time in Settings</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-3">
            To exercise any of these rights, email us at the address in Section 10.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">8. Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use a single session cookie to keep you logged in (via NextAuth). We do not use advertising cookies, analytics cookies, or third-party tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">9. Children</h2>
          <p className="text-muted-foreground leading-relaxed">
            FitMind AI is not intended for users under 16 years of age. We do not knowingly collect data from children.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">10. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For any privacy questions, data requests, or concerns, contact us at:<br />
            <strong className="text-foreground">aifitness034@gmail.com</strong>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">11. Changes to This Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this policy from time to time. Material changes will be communicated via email or an in-app notice. Continued use of FitMind AI after changes constitutes acceptance.
          </p>
        </section>

      </div>

      <div className="mt-12 pt-8 border-t text-sm text-muted-foreground flex gap-6">
        <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
        <Link href="/" className="hover:text-foreground">Back to Home</Link>
      </div>
    </div>
  )
}
