export default function ChatLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-pulse">
      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        <div className="flex gap-3 justify-end">
          <div className="h-10 w-48 bg-muted rounded-2xl" />
          <div className="h-8 w-8 bg-muted rounded-full shrink-0" />
        </div>
        <div className="flex gap-3">
          <div className="h-8 w-8 bg-muted rounded-full shrink-0" />
          <div className="h-16 w-64 bg-muted rounded-2xl" />
        </div>
        <div className="flex gap-3 justify-end">
          <div className="h-10 w-36 bg-muted rounded-2xl" />
          <div className="h-8 w-8 bg-muted rounded-full shrink-0" />
        </div>
        <div className="flex gap-3">
          <div className="h-8 w-8 bg-muted rounded-full shrink-0" />
          <div className="h-24 w-72 bg-muted rounded-2xl" />
        </div>
      </div>
      <div className="border-t p-4">
        <div className="h-[52px] bg-muted rounded-lg" />
      </div>
    </div>
  )
}
