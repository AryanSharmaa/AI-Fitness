export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-pulse">
      <div className="h-5 w-16 bg-muted rounded" />
      <div className="space-y-1">
        <div className="h-8 w-28 bg-muted rounded" />
        <div className="h-4 w-48 bg-muted rounded" />
      </div>
      {/* Account card */}
      <div className="h-36 bg-muted rounded-xl" />
      {/* Data card */}
      <div className="h-48 bg-muted rounded-xl" />
    </div>
  )
}
