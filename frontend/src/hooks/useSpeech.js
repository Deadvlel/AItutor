import { useState, useEffect, useRef, useCallback } from 'react'

export function speak(text, onEnd) {
  window.speechSynthesis.cancel()
  const doSpeak = () => {
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'vi-VN'
    utt.rate = 0.85
    utt.pitch = 1
    const voices = window.speechSynthesis.getVoices()
    const viVoice = voices.find(v =>
      v.lang === 'vi-VN' || v.lang === 'vi' || v.name.toLowerCase().includes('viet')
    )
    if (viVoice) utt.voice = viVoice
    utt.onend = onEnd || (() => {})
    utt.onerror = onEnd || (() => {})
    window.speechSynthesis.speak(utt)
  }
  if (window.speechSynthesis.getVoices().length > 0) doSpeak()
  else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null
      doSpeak()
    }
  }
}

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('')
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const recogRef = useRef(null)

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) setSupported(false)
  }, [])

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      alert('Trình duyệt không hỗ trợ Voice. Dùng Chrome nhé!')
      return
    }
    recogRef.current?.abort()
    const r = new SR()
    r.lang = 'vi-VN'
    r.continuous = false
    r.interimResults = false
    r.maxAlternatives = 1
    r.onstart = () => setListening(true)
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    r.onresult = (e) => setTranscript(e.results[0][0].transcript)
    recogRef.current = r
    try {
      r.start()
    } catch (e) {
      console.warn(e)
    }
  }, [])

  const stop = useCallback(() => {
    recogRef.current?.stop()
    setListening(false)
  }, [])

  const reset = useCallback(() => setTranscript(''), [])

  return { transcript, setTranscript, listening, supported, start, stop, reset }
}
