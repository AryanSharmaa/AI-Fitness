'use client'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Barcode, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface ScannedProduct {
  name: string
  brand: string
  serving: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface Props {
  onClose: () => void
  onLogged: () => void
}

export default function BarcodeScanner({ onClose, onLogged }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scanning, setScanning] = useState(true)
  const [product, setProduct] = useState<ScannedProduct | null>(null)
  const [mealType, setMealType] = useState('snack')
  const [logging, setLogging] = useState(false)
  const [error, setError] = useState('')
  const readerRef = useRef<any>(null)

  useEffect(() => {
    let stopped = false

    async function startScanner() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const reader = new BrowserMultiFormatReader()
        readerRef.current = reader

        await reader.decodeFromVideoDevice(undefined, videoRef.current!, async (result, err) => {
          if (stopped || !result) return
          stopped = true
          setScanning(false)

          const code = result.getText()
          try {
            const res = await fetch(`/api/food/barcode?code=${encodeURIComponent(code)}`)
            const data = await res.json()
            if (!res.ok) { setError(data.error || 'Product not found'); return }
            setProduct(data)
          } catch {
            setError('Failed to look up product')
          }
        })
      } catch (e: any) {
        setError('Camera access denied or not available')
      }
    }

    startScanner()

    return () => {
      stopped = true
      readerRef.current?.reset?.()
    }
  }, [])

  async function logProduct() {
    if (!product) return
    setLogging(true)
    try {
      const res = await fetch('/api/food/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, mealType }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Logged ${product.name} — ${product.calories} kcal`)
      onLogged()
      onClose()
    } catch {
      toast.error('Failed to log')
    } finally {
      setLogging(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm bg-background rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Barcode className="h-4 w-4" />
            <span className="font-medium">Scan Barcode</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scanner / Result */}
        {!product && !error && (
          <div className="relative bg-black" style={{ height: 240 }}>
            <video ref={videoRef} className="w-full h-full object-cover" />
            {scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-48 h-24 border-2 border-white/70 rounded-lg" />
                <p className="text-white text-xs">Point camera at barcode</p>
              </div>
            )}
            {!scanning && !product && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button size="sm" variant="outline" onClick={() => { setError(''); setScanning(true) }}>Try Again</Button>
          </div>
        )}

        {product && (
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">{product.name}</p>
                {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
                <p className="text-xs text-muted-foreground">Per {product.serving}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: 'kcal', value: product.calories, color: 'text-orange-500' },
                { label: 'protein', value: `${product.protein}g`, color: 'text-red-500' },
                { label: 'carbs', value: `${product.carbs}g`, color: 'text-blue-500' },
                { label: 'fat', value: `${product.fat}g`, color: 'text-yellow-500' },
              ].map(m => (
                <div key={m.label} className="bg-muted/50 rounded-lg p-2">
                  <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>

            <Select value={mealType} onValueChange={v => v && setMealType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">🌅 Breakfast</SelectItem>
                <SelectItem value="lunch">☀️ Lunch</SelectItem>
                <SelectItem value="dinner">🌙 Dinner</SelectItem>
                <SelectItem value="snack">🍎 Snack</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={logProduct} disabled={logging} className="w-full">
              {logging ? 'Logging...' : 'Log This'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
