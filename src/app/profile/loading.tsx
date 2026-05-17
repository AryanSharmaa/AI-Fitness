export default function ProfileLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-pulse">
      <div className="h-5 w-16 bg-muted rounded" />
      <div className="space-y-1">
        <div className="h-8 w-32 bg-muted rounded" />
        <div className="h-4 w-64 bg-muted rounded" />
      </div>
      {/* Account card */}
      <div className="h-28 bg-muted rounded-xl" />
      {/* Body card */}
      <div className="h-44 bg-muted rounded-xl" />
      {/* Goals card */}
      <div className="h-44 bg-muted rounded-xl" />
      {/* Food card */}
      <div className="h-36 bg-muted rounded-xl" />
      {/* Medical card */}
      <div className="h-36 bg-muted rounded-xl" />
      {/* Save button */}
      <div className="h-10 w-32 bg-muted rounded-lg" />
    </div>
  )
}
