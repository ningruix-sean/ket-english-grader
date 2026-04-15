'use client'

import { useState, useRef, useEffect } from 'react'

// Supported MIME types in priority order
const MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
]

function getSupportedMimeType() {
  if (typeof window === 'undefined') return 'audio/webm'
  for (const type of MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

/**
 * AudioRecorder component
 * Props:
 *   onAudioReady(blob, filename) – called when recording is stopped and ready
 *   disabled – whether interaction is disabled
 */
export default function AudioRecorder({ onAudioReady, disabled }) {
  const [state, setState] = useState('idle') // idle | requesting | recording | preview
  const [elapsed, setElapsed] = useState(0)
  const [audioUrl, setAudioUrl] = useState(null)
  const [mimeType] = useState(getSupportedMimeType)
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const streamRef = useRef(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      stopStream()
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  async function startRecording() {
    setError(null)
    setState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      chunksRef.current = []
      const options = mimeType ? { mimeType } : {}
      const recorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setState('preview')

        const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm'
        const filename = `recording.${ext}`
        onAudioReady(blob, filename)
      }

      recorder.start(250) // collect data every 250ms
      setState('recording')
      setElapsed(0)
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          if (prev >= 119) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch (err) {
      stopStream()
      setState('idle')
      if (err.name === 'NotAllowedError') {
        setError('麦克风权限被拒绝，请在浏览器设置中允许使用麦克风。')
      } else if (err.name === 'NotFoundError') {
        setError('未找到麦克风设备，请检查设备连接。')
      } else {
        setError(`无法访问麦克风：${err.message}`)
      }
    }
  }

  function stopRecording() {
    clearInterval(timerRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    stopStream()
  }

  function resetRecording() {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setElapsed(0)
    setError(null)
    setState('idle')
    onAudioReady(null, null)
  }

  return (
    <div className="space-y-3">
      {/* State: idle */}
      {state === 'idle' && (
        <button
          onClick={startRecording}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-semibold rounded-2xl shadow-md transition-all active:scale-95"
        >
          <span className="text-2xl">🎙️</span>
          <span className="text-lg">开始录音</span>
        </button>
      )}

      {/* State: requesting mic permission */}
      {state === 'requesting' && (
        <div className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-yellow-100 text-yellow-700 rounded-2xl">
          <span className="animate-pulse text-2xl">🎙️</span>
          <span>正在请求麦克风权限…</span>
        </div>
      )}

      {/* State: recording */}
      {state === 'recording' && (
        <div className="space-y-3">
          <div className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-red-50 border-2 border-red-400 rounded-2xl">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
            </span>
            <span className="text-red-600 font-semibold text-lg">录音中</span>
            <span className="font-mono text-red-500 text-lg">{formatTime(elapsed)}</span>
            <span className="text-xs text-red-400 ml-auto">最长2分钟</span>
          </div>

          {/* Recording bars animation */}
          <div className="flex items-end justify-center gap-1 h-10">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 bg-red-400 rounded-full animate-pulse"
                style={{
                  height: `${20 + Math.random() * 80}%`,
                  animationDelay: `${i * 0.05}s`,
                  animationDuration: `${0.4 + Math.random() * 0.4}s`,
                }}
              />
            ))}
          </div>

          <button
            onClick={stopRecording}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-2xl shadow-md transition-all active:scale-95"
          >
            <span className="w-5 h-5 bg-white rounded-sm inline-block"></span>
            <span className="text-lg">停止录音</span>
          </button>
        </div>
      )}

      {/* State: preview */}
      {state === 'preview' && audioUrl && (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <p className="text-green-700 font-medium mb-3 flex items-center gap-2">
              <span>✅</span>
              <span>录音完成！时长 {formatTime(elapsed)}</span>
            </p>
            <audio src={audioUrl} controls className="w-full rounded-lg" />
          </div>
          <button
            onClick={resetRecording}
            disabled={disabled}
            className="w-full py-2 px-4 text-sm text-gray-600 hover:text-gray-800 underline transition-colors disabled:opacity-50"
          >
            重新录音
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
          ⚠️ {error}
        </div>
      )}
    </div>
  )
}
