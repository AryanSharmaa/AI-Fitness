export default function FoodLogLoading() {
  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-28 bg-muted rounded" />
        <div className="h-9 w-24 bg-muted rounded-lg" />
      </div>
      <div className="h-28 bg-muted rounded-xl" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-20 bg-muted rounded-xl" />
      ))}
    </div>
  )
}
