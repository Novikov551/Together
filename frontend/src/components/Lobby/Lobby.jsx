import { useState, useEffect, useCallback } from 'react'
import { getLiveKitToken, createRoom } from '../../services/api'
import { useDevices } from '../../hooks/useDevices'
import MicTest from '../MicTest/MicTest'
import RoomList from './RoomList'
import JoinModal from './JoinModal'

const AVATARS = ['😀', '😎', '🤓', '😇', '🥳', '🦊', '🐱', '🐶', '🦁', '🐻', '🐼', '🐨', '🎮', '🎵', '🚀', '⭐', '🔥', '💎', '🎯', '🌈']

export default function Lobby({ sessionToken, onJoin, showToast, settings, updateSetting, updateSettings }) {
  const [name, setName] = useState(settings.displayName || '')
  const [room, setRoom] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('join')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const [roomPassword, setRoomPassword] = useState('')
  const [joinModal, setJoinModal] = useState(null)
  const { mics, cameras, speakers, selectedMic, selectedCamera, selectedSpeaker, setSelectedMic, setSelectedCamera, setSelectedSpeaker } = useDevices()

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

  useEffect(() => { if (selectedMic) updateSetting('selectedMic', selectedMic) }, [selectedMic, updateSetting])
  useEffect(() => { if (selectedCamera) updateSetting('selectedCamera', selectedCamera) }, [selectedCamera, updateSetting])
  useEffect(() => { if (selectedSpeaker) updateSetting('selectedSpeaker', selectedSpeaker) }, [selectedSpeaker, updateSetting])

  const doJoin = useCallback(async (displayName, roomName, password) => {
    setError('')
    setLoading(true)
    updateSettings({ displayName, roomName })
    try {
      const data = await getLiveKitToken(sessionToken, displayName, roomName, password)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const liveKitUrl = protocol + '//' + window.location.host
      window.__together = {
        wsUrl: liveKitUrl,
        token: data.live_kit_token,
        displayName,
        roomName,
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
  }, [sessionToken, selectedMic, selectedCamera, selectedSpeaker, settings.avatar, updateSettings, onJoin])

  // Вход по кнопке "Подключиться" (центральная карточка)
  const handleJoin = async (e) => {
    e.preventDefault()
    if (!name.trim() || !room.trim()) {
      setError('Заполните имя и комнату')
      return
    }
    // Создаём комнату если нужно
    try {
      await createRoom(sessionToken, room.trim(), isPrivate ? roomPassword : null)
    } catch {
      // Комната уже существует — ок
    }
    await doJoin(name.trim(), room.trim(), isPrivate ? roomPassword : null)
  }

  // Клик "Подключиться" из списка комнат
  const handleJoinRoom = useCallback((roomName, roomIsPrivate) => {
    setJoinModal({ roomName, isPrivate: roomIsPrivate })
  }, [])

  // Подтверждение из модалки
  const handleJoinConfirm = useCallback((displayName, password) => {
    const { roomName } = joinModal
    setJoinModal(null)
    doJoin(displayName, roomName, password)
  }, [joinModal, doJoin])

  return (
    <div className="screen lobby-screen">
      {/* Слева — вход / настройки */}
      <div className="lobby-main">
        <div className="card lobby-card">
          <div className="lobby-tabs">
            <button className={`lobby-tab ${tab === 'join' ? 'active' : ''}`} onClick={() => setTab('join')}>🚀 Войти</button>
            <button className={`lobby-tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>🎙️ Настройки</button>
          </div>

          {tab === 'join' && (
            <form onSubmit={handleJoin}>
              <div className="avatar-section">
                <div className="current-avatar" onClick={() => setShowAvatarPicker(!showAvatarPicker)}>{settings.avatar}</div>
                <span className="avatar-hint">Нажми чтобы сменить</span>
              </div>

              {showAvatarPicker && (
                <div className="avatar-picker">
                  {AVATARS.map(a => (
                    <button key={a} type="button" className={`avatar-option ${settings.avatar === a ? 'selected' : ''}`}
                      onClick={() => { updateSetting('avatar', a); setShowAvatarPicker(false) }}>{a}</button>
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

              {/* Переключатель приватная/публичная */}
              <div className="field-row">
                <label className="toggle-row compact">
                  <span>Приватная комната</span>
                  <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} />
                </label>
              </div>
              {isPrivate && (
                <div className="field">
                  <label>Пароль комнаты</label>
                  <input type="password" value={roomPassword} onChange={e => setRoomPassword(e.target.value)} placeholder="Пароль" />
                </div>
              )}

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
                    {mics.length === 0 && <option>Не найден</option>}
                    {mics.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Микрофон ${d.deviceId.slice(0, 8)}`}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Камера</label>
                  <select value={selectedCamera} onChange={e => setSelectedCamera(e.target.value)}>
                    {cameras.length === 0 && <option>Не найдена</option>}
                    {cameras.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Камера ${d.deviceId.slice(0, 8)}`}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Динамики</label>
                  <select value={selectedSpeaker} onChange={e => setSelectedSpeaker(e.target.value)}>
                    {speakers.length === 0 && <option>Не найдены</option>}
                    {speakers.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Динамики ${d.deviceId.slice(0, 8)}`}</option>)}
                  </select>
                </div>
              </div>
              <MicTest mics={mics} selectedMic={selectedMic} speakers={speakers} selectedSpeaker={selectedSpeaker} settings={settings} updateSetting={updateSetting} />
            </>
          )}
        </div>
      </div>

      {/* Справа — список комнат */}
      <div className="lobby-sidebar">
        <RoomList sessionToken={sessionToken} onJoinRoom={handleJoinRoom} />
      </div>

      {joinModal && (
        <JoinModal
          roomName={joinModal.roomName}
          isPrivate={joinModal.isPrivate}
          defaultName={name}
          onConfirm={handleJoinConfirm}
          onCancel={() => setJoinModal(null)}
        />
      )}
    </div>
  )
}