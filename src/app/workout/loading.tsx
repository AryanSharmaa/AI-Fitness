export default function WorkoutLoading() {
  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-4 animate-pulse">
      <div className="h-8 w-44 bg-muted rounded" />
      <div className="h-64 bg-muted rounded-xl" />
      <div className="flex gap-3">
        <div className="h-10 flex-1 bg-muted rounded-lg" />
        <div className="h-10 w-20 bg-muted rounded-lg" />
      </div>
    </div>
  )
}
