import { useEffect, useRef, useState } from 'react'

interface Props {
  onCapture: (blob: Blob) => void
  disabled?: boolean
}

export default function WebcamCapture({ onCapture, disabled }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function start() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setActive(true)
      setPreviewUrl(null)
    } catch (err) {
      setError('Could not access camera. Check browser permissions.')
    }
  }

  function stop() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setActive(false)
  }

  function capture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setPreviewUrl(URL.createObjectURL(blob))
          onCapture(blob)
        }
      },
      'image/jpeg',
      0.92,
    )
    stop()
  }

  return (
    <div>
      {error && <p className="text-laser text-sm mb-3">{error}</p>}

      {!active && !previewUrl && (
        <button type="button" className="btn" onClick={start} disabled={disabled}>
          📷 Enable camera
        </button>
      )}

      <div className={`relative overflow-hidden rounded-xl border border-line bg-surface2 ${active ? 'block' : 'hidden'}`}>
        <video ref={videoRef} className="w-full aspect-video object-cover" muted playsInline />
        <div className="absolute left-0 right-0 h-0.5 bg-laser shadow-glow animate-scan pointer-events-none" />
      </div>

      {active && (
        <div className="mt-3 flex gap-2">
          <button type="button" className="btn-solid" onClick={capture}>
            Capture photo
          </button>
          <button type="button" className="btn-ghost" onClick={stop}>
            Cancel
          </button>
        </div>
      )}

      {previewUrl && (
        <div className="mt-3">
          <img src={previewUrl} alt="Captured frame" className="rounded-xl border border-line max-h-64" />
          <button type="button" className="btn-ghost mt-2" onClick={start} disabled={disabled}>
            Retake
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
