import { useState, useRef, useEffect, useCallback } from 'react'

const PROFILES = {
  standard: {
    name: 'Стандарт',
    desc: 'Базовые настройки',
    noiseSuppression: false,
    echoCancellation: true,
    sensitivity: 50,
  },
  voice: {
    name: 'Изоляция голоса',
    desc: 'Убирает фоновый шум',
    noiseSuppression: true,
    echoCancellation: true,
    sensitivity: 40,
  },
  studio: {
    name: 'Студия',
    desc: 'Максимальное качество',
    noiseSuppression: false,
    echoCancellation: false,
    sensitivity: 30,
  },
  custom: {
    name: 'Пользовательский',
    desc: 'Свои настройки',
    noiseSuppression: true,
    echoCancellation: false,
    sensitivity: 50,
  },
}

export default function DeviceSettings({ mics, cameras, speakers, selectedMic, selectedCamera, selectedSpeaker, onMicChange, onCameraChange, onSpeakerChange, onAudioSettingsChange, cameraQuality, onCameraQualityChange, settings, updateSetting }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Профиль — из сохранённых настроек
  const [profile, setProfile] = useState(settings.micProfile || 'voice')
  const [noiseSuppression, setNoiseSuppression] = useState(settings.micNoiseSuppression ?? true)
  const [echoCancellation, setEchoCancellation] = useState(settings.micEchoCancellation ?? true)
  const [sensitivity, setSensitivity] = useState(settings.micSensitivity ?? 40)
  const [autoSensitivity, setAutoSensitivity] = useState(settings.micAutoSensitivity ?? true)

  // Mic test state
  const [testing, setTesting] = useState(false)
  const [level, setLevel] = useState(0)
  const streamRef = useRef(null)
  const animRef = useRef(null)
  const audioCtxRef = useRef(null)
  const sourceRef = useRef(null)
  const gainRef = useRef(null)
  const liveAudioRef = useRef(null)
  const liveDestRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Сохраняем настройки при изменении
  useEffect(() => {
    updateSetting('micProfile', profile)
  }, [profile, updateSetting])
  useEffect(() => {
    updateSetting('micNoiseSuppression', noiseSuppression)
  }, [noiseSuppression, updateSetting])
  useEffect(() => {
    updateSetting('micEchoCancellation', echoCancellation)
  }, [echoCancellation, updateSetting])
  useEffect(() => {
    updateSetting('micSensitivity', sensitivity)
  }, [sensitivity, updateSetting])
  useEffect(() => {
    updateSetting('micAutoSensitivity', autoSensitivity)
  }, [autoSensitivity, updateSetting])

  // Уведомляем родителя
  useEffect(() => {
    if (onAudioSettingsChange) {
      onAudioSettingsChange({ noiseSuppression, echoCancellation, sensitivity })
    }
  }, [noiseSuppression, echoCancellation, sensitivity, onAudioSettingsChange])

  // Применить профиль
  const applyProfile = useCallback((key) => {
    setProfile(key)
    if (key !== 'custom') {
      const p = PROFILES[key]
      setNoiseSuppression(p.noiseSuppression)
      setEchoCancellation(p.echoCancellation)
      setSensitivity(p.sensitivity)
    }
  }, [])

  const markCustom = useCallback(() => {
    setProfile('custom')
  }, [])

  // Обновить gain при изменении чувствительности
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = sensitivity / 50
    }
  }, [sensitivity])

  const startMicTest = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedMic ? { exact: selectedMic } : undefined,
          noiseSuppression,
          echoCancellation,
          autoGainControl: false,
        }
      })
      streamRef.current = stream
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      if (ctx.state === 'suspended') await ctx.resume()

      const source = ctx.createMediaStreamSource(stream)
      sourceRef.current = source
      const gain = ctx.createGain()
      gain.gain.value = sensitivity / 50
      gainRef.current = gain
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(gain)
      gain.connect(analyser)

      // Автоматически включаем прослушивание себя
      const dest = ctx.createMediaStreamDestination()
      gain.connect(dest)
      const audio = new Audio()
      audio.srcObject = dest.stream
      audio.volume = 0.5
      if (selectedSpeaker) audio.setSinkId(selectedSpeaker).catch(() => {})
      audio.play().catch(() => {})
      liveAudioRef.current = audio

      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((s, v) => s + v, 0) / data.length
        setLevel(Math.min(100, Math.round(avg * 1.5)))
        animRef.current = requestAnimationFrame(tick)
      }
      tick()
      setTesting(true)
    } catch (e) {
      console.error('Mic test error:', e)
    }
  }, [selectedMic, noiseSuppression, echoCancellation, sensitivity, selectedSpeaker])

  const stopMicTest = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    if (liveAudioRef.current) { liveAudioRef.current.pause(); liveAudioRef.current.srcObject = null; liveAudioRef.current = null }
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    sourceRef.current = null; gainRef.current = null
    setTesting(false); setLevel(0)
  }, [])

  useEffect(() => () => stopMicTest(), [stopMicTest])

  const handlePopoverClick = useCallback((e) => {
    e.stopPropagation()
  }, [])

  return (
    <div className="device-settings" ref={ref}>
      <button className={`ctrl-btn ${open ? 'off' : 'on'}`} onClick={() => setOpen(!open)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <span className="tooltip">Настройки</span>
      </button>

      {open && (
        <div className="settings-popover" onMouseDown={handlePopoverClick}>
          <h4>Устройства</h4>
          <div className="settings-field">
            <label>Микрофон</label>
            <select value={selectedMic} onChange={e => onMicChange(e.target.value)}>
              {mics.length === 0 && <option>Не найден</option>}
              {mics.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Микрофон ${d.deviceId.slice(0,6)}`}</option>)}
            </select>
          </div>
          <div className="settings-field">
            <label>Камера</label>
            <select value={selectedCamera} onChange={e => onCameraChange(e.target.value)}>
              {cameras.length === 0 && <option>Не найдена</option>}
              {cameras.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Камера ${d.deviceId.slice(0,6)}`}</option>)}
            </select>
          </div>
          <div className="settings-field">
            <label>Динамики</label>
            <select value={selectedSpeaker} onChange={e => onSpeakerChange(e.target.value)}>
              {speakers.length === 0 && <option>Не найдены</option>}
              {speakers.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Динамики ${d.deviceId.slice(0,6)}`}</option>)}
            </select>
          </div>

          {/* Профили ввода */}
          <div className="settings-divider" />
          <h4>Профиль ввода</h4>
          <div className="settings-profile-grid">
            {Object.entries(PROFILES).map(([key, p]) => (
              <button
                key={key}
                className={`settings-profile-btn ${profile === key ? 'active' : ''}`}
                onClick={() => applyProfile(key)}
              >
                <span className="settings-profile-icon">
                  {key === 'standard' ? '🎤' : key === 'voice' ? '🗣️' : key === 'studio' ? '🎛️' : '⚙️'}
                </span>
                <span className="settings-profile-name">{p.name}</span>
              </button>
            ))}
          </div>

          {/* Чувствительность */}
          <div className="settings-divider" />
          <div className="settings-slider-section">
            <div className="settings-slider-header">
              <label>Чувствительность</label>
              <button
                className={`settings-auto-btn ${autoSensitivity ? 'active' : ''}`}
                onClick={() => setAutoSensitivity(!autoSensitivity)}
              >
                {autoSensitivity ? '🔄 Авто' : '✏️ Вручную'}
              </button>
            </div>
            {!autoSensitivity && (
              <div className="settings-slider-row">
                <span className="slider-label">Тихо</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sensitivity}
                  onChange={e => { setSensitivity(Number(e.target.value)); markCustom(); }}
                  className="settings-slider"
                />
                <span className="slider-label">Громко</span>
                <span className="settings-slider-value">{sensitivity}%</span>
              </div>
            )}
            {autoSensitivity && (
              <div className="settings-auto-hint">Браузер автоматически подберёт уровень</div>
            )}
          </div>

          {/* Обработка звука */}
          <div className="settings-divider" />
          <h4>Обработка звука</h4>
          <label className="toggle-row compact">
            <span>Шумоподавление</span>
            <input type="checkbox" checked={noiseSuppression} onChange={e => { setNoiseSuppression(e.target.checked); markCustom(); }} />
          </label>
          <label className="toggle-row compact">
            <span>Подавление эха</span>
            <input type="checkbox" checked={echoCancellation} onChange={e => { setEchoCancellation(e.target.checked); markCustom(); }} />
          </label>

          {/* Mic test */}
          <div className="settings-divider" />
          <h4>Тест микрофона</h4>

          <div className="settings-level-bar">
            {Array.from({ length: 15 }, (_, i) => {
              const threshold = (i + 1) * 6.67
              const active = level >= threshold
              const color = threshold > 80 ? 'red' : threshold > 60 ? 'orange' : 'green'
              return <div key={i} className={`settings-level-seg ${active ? `active ${color}` : ''}`} />
            })}
          </div>

          {!testing ? (
            <button className="settings-test-btn" onClick={startMicTest}>🎙️ Начать тест</button>
          ) : (
            <button className="settings-test-btn danger" onClick={stopMicTest}>⏹ Остановить</button>
          )}
        </div>
      )}
    </div>
  )
}
