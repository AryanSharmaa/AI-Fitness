import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function PlanLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="h-7 w-36 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
      </div>
      <Card>
        <CardHeader>
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-9 flex-1 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
          <div className="h-48 rounded-xl bg-muted animate-pulse" />
        </CardContent>
      </Card>
    </div>
  )
}
