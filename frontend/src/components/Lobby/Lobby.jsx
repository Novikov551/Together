import { useState, useEffect } from 'react'
import { getLiveKitToken } from '../../services/api'
import { useDevices } from '../../hooks/useDevices'
import MicTest from '../MicTest/MicTest'

const AVATARS = ['😀', '😎', '🤓', '😇', '🥳', '🦊', '🐱', '🐶', '🦁', '🐻', '🐼', '🐨', '🎮', '🎵', '🚀', '⭐', '🔥', '💎', '🎯', '🌈']

export default function Lobby({ sessionToken, onJoin, showToast, settings, updateSetting, updateSettings }) {
  const [name, setName] = useState(settings.displayName || '')
  const [room, setRoom] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('join')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const { mics, cameras, speakers, selectedMic, selectedCamera, selectedSpeaker, setSelectedMic, setSelectedCamera, setSelectedSpeaker } = useDevices()

  // Восстановление выбранного устройства
  useEffect(() => {
    if (settings.selectedMic && mics.length > 0) {
      const found = mics.find(d => d.deviceId === settings.selectedMic)
      if (found) setSelectedMic(settings.selectedMic)
    }
    if (settings.selectedCamera && cameras.length > 0) {
      const found = cameras.find(d => d.deviceId === settings.selectedCamera)
      if (found) setSelectedCamera(settings.selectedCamera)
    }
    if (settings.selectedSpeaker && speakers.length > 0) {
      const found = speakers.find(d => d.deviceId === settings.selectedSpeaker)
      if (found) setSelectedSpeaker(settings.selectedSpeaker)
    }
  }, [mics, cameras, speakers]) // eslint-disable-line react-hooks/exhaustive-deps

  // Сохранение при смене устройства
  useEffect(() => { if (selectedMic) updateSetting('selectedMic', selectedMic) }, [selectedMic, updateSetting])
  useEffect(() => { if (selectedCamera) updateSetting('selectedCamera', selectedCamera) }, [selectedCamera, updateSetting])
  useEffect(() => { if (selectedSpeaker) updateSetting('selectedSpeaker', selectedSpeaker) }, [selectedSpeaker, updateSetting])

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!name.trim() || !room.trim()) {
      setError('Заполните имя и комнату')
      return
    }
    setError('')
    setLoading(true)

    // Сохраняем имя и комнату
    updateSettings({ displayName: name.trim(), roomName: room.trim() })

    try {
      const data = await getLiveKitToken(sessionToken, name.trim(), room.trim())
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const liveKitUrl = protocol + '//' + window.location.host
      window.__together = {
        wsUrl: liveKitUrl,
        token: data.live_kit_token,
        displayName: name.trim(),
        roomName: room.trim(),
        micDeviceId: selectedMic,
        cameraDeviceId: selectedCamera,
        speakerDeviceId: selectedSpeaker,
        avatar: settings.avatar,
      }
      onJoin()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen lobby-screen">
      <div className="card lobby-card">
        {/* Tabs */}
        <div className="lobby-tabs">
          <button className={`lobby-tab ${tab === 'join' ? 'active' : ''}`} onClick={() => setTab('join')}>
            🚀 Войти
          </button>
          <button className={`lobby-tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
            🎙️ Настройки
          </button>
        </div>

        {tab === 'join' && (
          <form onSubmit={handleJoin}>
            {/* Avatar */}
            <div className="avatar-section">
              <div className="current-avatar" onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
                {settings.avatar}
              </div>
              <span className="avatar-hint">Нажми чтобы сменить</span>
            </div>

            {showAvatarPicker && (
              <div className="avatar-picker">
                {AVATARS.map(a => (
                  <button
                    key={a}
                    type="button"
                    className={`avatar-option ${settings.avatar === a ? 'selected' : ''}`}
                    onClick={() => { updateSetting('avatar', a); setShowAvatarPicker(false) }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            )}

            <div className="field">
              <label>Ваше имя</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Например, Алексей" />
            </div>
            <div className="field">
              <label>Комната</label>
              <input type="text" value={room} onChange={e => setRoom(e.target.value)} placeholder="Например, family-call" />
            </div>

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Подключение...' : 'Подключиться'}
            </button>
            {error && <div className="error-msg">{error}</div>}
          </form>
        )}

        {tab === 'settings' && (
          <>
            <div className="device-section">
              <h3>⚙️ Устройства</h3>
              <div className="field">
                <label>Микрофон</label>
                <select value={selectedMic} onChange={e => setSelectedMic(e.target.value)}>
                  {mics.length === 0 && <option>Микрофон не найден</option>}
                  {mics.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Микрофон ${d.deviceId.slice(0, 8)}`}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Камера</label>
                <select value={selectedCamera} onChange={e => setSelectedCamera(e.target.value)}>
                  {cameras.length === 0 && <option>Камера не найдена</option>}
                  {cameras.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Камера ${d.deviceId.slice(0, 8)}`}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Динамики</label>
                <select value={selectedSpeaker} onChange={e => setSelectedSpeaker(e.target.value)}>
                  {speakers.length === 0 && <option>Динамики не найдены</option>}
                  {speakers.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Динамики ${d.deviceId.slice(0, 8)}`}</option>)}
                </select>
              </div>
            </div>

            <MicTest
              mics={mics}
              selectedMic={selectedMic}
              speakers={speakers}
              selectedSpeaker={selectedSpeaker}
              settings={settings}
              updateSetting={updateSetting}
            />
          </>
        )}
      </div>
    </div>
  )
}
