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

export default function MicTest({ mics, selectedMic, speakers, selectedSpeaker, settings, updateSetting }) {
  const [testing, setTesting] = useState(false)
  const [level, setLevel] = useState(0)
  const [profile, setProfile] = useState(settings.micProfile || 'voice')
  const [autoSensitivity, setAutoSensitivity] = useState(settings.micAutoSensitivity ?? true)
  const [sensitivity, setSensitivity] = useState(settings.micSensitivity ?? 40)
  const [noiseSuppression, setNoiseSupression] = useState(settings.micNoiseSuppression ?? true)
  const [echoCancellation, setEchoCancellation] = useState(settings.micEchoCancellation ?? true)

  const streamRef = useRef(null)
  const animFrameRef = useRef(null)
  const audioCtxRef = useRef(null)
  const sourceRef = useRef(null)
  const gainRef = useRef(null)
  const liveAudioRef = useRef(null)

  // Сохраняем при изменении
  useEffect(() => { updateSetting('micProfile', profile) }, [profile, updateSetting])
  useEffect(() => { updateSetting('micNoiseSuppression', noiseSuppression) }, [noiseSuppression, updateSetting])
  useEffect(() => { updateSetting('micEchoCancellation', echoCancellation) }, [echoCancellation, updateSetting])
  useEffect(() => { updateSetting('micSensitivity', sensitivity) }, [sensitivity, updateSetting])
  useEffect(() => { updateSetting('micAutoSensitivity', autoSensitivity) }, [autoSensitivity, updateSetting])

  const applyProfile = useCallback((key) => {
    setProfile(key)
    if (key !== 'custom') {
      const p = PROFILES[key]
      setNoiseSupression(p.noiseSuppression)
      setEchoCancellation(p.echoCancellation)
      setSensitivity(p.sensitivity)
    }
  }, [])

  const markCustom = useCallback(() => {
    setProfile('custom')
  }, [])

  const startTest = useCallback(async () => {
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

      // Автопрослушивание
      const dest = ctx.createMediaStreamDestination()
      gain.connect(dest)
      const audio = new Audio()
      audio.srcObject = dest.stream
      audio.volume = 0.5
      if (selectedSpeaker) audio.setSinkId(selectedSpeaker).catch(() => {})
      audio.play().catch(() => {})
      liveAudioRef.current = audio

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((s, v) => s + v, 0) / dataArray.length
        setLevel(Math.min(100, Math.round(avg * 1.5)))
        animFrameRef.current = requestAnimationFrame(tick)
      }
      tick()
      setTesting(true)
    } catch (e) {
      console.error('Mic test error:', e)
    }
  }, [selectedMic, noiseSuppression, echoCancellation, sensitivity, selectedSpeaker])

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = sensitivity / 50
    }
  }, [sensitivity])

  const stopTest = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (liveAudioRef.current) { liveAudioRef.current.pause(); liveAudioRef.current.srcObject = null; liveAudioRef.current = null }
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    sourceRef.current = null; gainRef.current = null
    setTesting(false); setLevel(0)
  }, [])

  useEffect(() => () => stopTest(), [stopTest])

  return (
    <div className="mic-test">
      <h3>🎙️ Тест микрофона</h3>
      <p className="mic-test-desc">Поговорите в микрофон и проверьте уровень громкости</p>

      {/* Профили */}
      <div className="profile-section">
        <h4>Профиль ввода</h4>
        <div className="profile-grid">
          {Object.entries(PROFILES).map(([key, p]) => (
            <button
              key={key}
              className={`profile-btn ${profile === key ? 'active' : ''}`}
              onClick={() => applyProfile(key)}
            >
              <span className="profile-icon">
                {key === 'standard' ? '🎤' : key === 'voice' ? '🗣️' : key === 'studio' ? '🎛️' : '⚙️'}
              </span>
              <span className="profile-name">{p.name}</span>
              <span className="profile-desc">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Level meter */}
      <div className="level-meter">
        <div className="level-bar">
          {Array.from({ length: 20 }, (_, i) => {
            const threshold = (i + 1) * 5
            const active = level >= threshold
            const color = threshold > 80 ? 'red' : threshold > 60 ? 'orange' : 'green'
            return <div key={i} className={`level-segment ${active ? `active ${color}` : ''}`} />
          })}
        </div>
        <div className="level-label">{level > 0 ? `${level}%` : '—'}</div>
      </div>

      {/* Чувствительность */}
      <div className="sensitivity-section">
        <div className="sensitivity-header">
          <h4>Чувствительность ввода</h4>
          <button
            className={`auto-btn ${autoSensitivity ? 'active' : ''}`}
            onClick={() => setAutoSensitivity(!autoSensitivity)}
          >
            {autoSensitivity ? '🔄 Авто' : '✏️ Вручную'}
          </button>
        </div>
        {!autoSensitivity && (
          <div className="slider-row">
            <span className="slider-label">Тихо</span>
            <input
              type="range"
              min="0"
              max="100"
              value={sensitivity}
              onChange={e => { setSensitivity(Number(e.target.value)); markCustom(); }}
              className="sensitivity-slider"
            />
            <span className="slider-label">Громко</span>
            <span className="slider-value">{sensitivity}%</span>
          </div>
        )}
        {autoSensitivity && (
          <div className="auto-hint">Браузер автоматически подберёт уровень</div>
        )}
      </div>

      {/* Кнопка теста */}
      {!testing ? (
        <button className="btn-primary mic-test-btn" onClick={startTest}>
          Начать тест
        </button>
      ) : (
        <button className="btn-primary mic-test-btn danger" onClick={stopTest}>
          Остановить
        </button>
      )}

      {/* Настройки */}
      <div className="audio-settings">
        <h4>Обработка звука</h4>
        {testing && <div className="playing-hint">🎧 Прослушивание включено</div>}
        <label className="toggle-row">
          <span>Шумоподавление</span>
          <input type="checkbox" checked={noiseSuppression} onChange={e => { setNoiseSupression(e.target.checked); markCustom(); }} disabled={testing} />
          <span className="toggle-slider" />
        </label>
        <label className="toggle-row">
          <span>Подавление эха</span>
          <input type="checkbox" checked={echoCancellation} onChange={e => { setEchoCancellation(e.target.checked); markCustom(); }} disabled={testing} />
          <span className="toggle-slider" />
        </label>
      </div>
    </div>
  )
}
