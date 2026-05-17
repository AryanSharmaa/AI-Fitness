'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
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

async function lookupBarcode(code: string): Promise<ScannedProduct> {
  const res = await fetch(`/api/food/barcode?code=${encodeURIComponent(code)}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Product not found')
  return data
}

export default function BarcodeScanner({ onClose, onLogged }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animRef = useRef<number | null>(null)
  const [product, setProduct] = useState<ScannedProduct | null>(null)
  const [mealType, setMealType] = useState('snack')
  const [logging, setLogging] = useState(false)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [useCamera, setUseCamera] = useState(false)
  const [looking, setLooking] = useState(false)

  // Native BarcodeDetector camera scan
  const startCamera = useCallback(async () => {
    setError('')
    setUseCamera(true)
    setScanning(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream

      // @ts-ignore — BarcodeDetector is not in TS types yet
      if (!('BarcodeDetector' in window)) {
        setError('Live scanning not supported on this browser. Enter barcode manually below.')
        setScanning(false)
        return
      }

      // @ts-ignore
      const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'] })

      const detect = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          animRef.current = requestAnimationFrame(detect)
          return
        }
        try {
          const barcodes = await detector.detect(videoRef.current)
          if (barcodes.length > 0) {
            stopCamera()
            setScanning(false)
            setLooking(true)
            const product = await lookupBarcode(barcodes[0].rawValue)
            setProduct(product)
          } else {
            animRef.current = requestAnimationFrame(detect)
          }
        } catch {
          animRef.current = requestAnimationFrame(detect)
        }
      }
      animRef.current = requestAnimationFrame(detect)
    } catch {
      setError('Camera access denied. Enter barcode manually.')
      setScanning(false)
    } finally {
      setLooking(false)
    }
  }, [])

  function stopCamera() {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  useEffect(() => () => stopCamera(), [])

  async function handleManual() {
    const code = manualCode.trim()
    if (!code) return
    setLooking(true)
    setError('')
    try {
      const p = await lookupBarcode(code)
      setProduct(p)
    } catch (e: any) {
      setError(e.message || 'Product not found')
    } finally {
      setLooking(false)
    }
  }

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
            <span className="font-medium text-sm">Barcode Scanner</span>
          </div>
          <button onClick={() => { stopCamera(); onClose() }} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!product && (
            <>
              {/* Camera */}
              {!useCamera ? (
                <Button onClick={startCamera} className="w-full" variant="outline">
                  📷 Scan with Camera
                </Button>
              ) : (
                <div className="relative bg-black rounded-xl overflow-hidden" style={{ height: 200 }}>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {scanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className="w-48 h-20 border-2 border-white/80 rounded-lg" />
                      <p className="text-white text-xs bg-black/50 px-2 py-0.5 rounded">Point at barcode</p>
                    </div>
                  )}
                </div>
              )}

              {/* Manual entry */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Or enter barcode number</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. 8901058825807"
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleManual()}
                    className="text-sm"
                  />
                  <Button onClick={handleManual} disabled={looking || !manualCode.trim()} size="sm">
                    {looking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Look up'}
                  </Button>
                </div>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}
              {looking && !error && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />Looking up product…
                </div>
              )}
            </>
          )}

          {/* Product found */}
          {product && (
            <div className="space-y-4">
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

              <div className="flex gap-2">
                <Button onClick={logProduct} disabled={logging} className="flex-1">
                  {logging ? 'Logging...' : 'Log This'}
                </Button>
                <Button variant="outline" onClick={() => setProduct(null)}>Back</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
