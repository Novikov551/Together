import { useEffect, useState, useRef, useCallback } from 'react'
import { useRoom } from '../../hooks/useRoom'
import { useDevices } from '../../hooks/useDevices'
import { playLeaveCall } from '../../services/sounds'
import VideoGrid from '../VideoGrid/VideoGrid'
import Controls from '../Controls/Controls'
import ChatPanel from '../Chat/ChatPanel'

export default function Call({ onLeave, showToast, settings, updateSetting, updateSettings }) {
  const {
    participants, localIdentity, isConnected,
    isMicOn, isCamOn, isScreenSharing, speakers,
    connectionQuality, pings,
    chatMessages, sendChatMessage,
    chatSoundEnabled, setChatSoundEnabled,
    unreadCount, setUnreadCount, chatOpenRef,
    screenQuality, setScreenQuality,
    cameraQuality, setCameraQuality,
    connect, disconnect, toggleMic, toggleCam, toggleScreen,
    switchDevice, applyAudioSettings,
  } = useRoom()

  const {
    mics, cameras, speakers: speakerDevices,
    selectedMic, selectedCamera, selectedSpeaker,
    setSelectedMic, setSelectedCamera, setSelectedSpeaker,
  } = useDevices()

  const [timer, setTimer] = useState('00:00')
  const [roomName, setRoomName] = useState('')
  const [globalVolume, setGlobalVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  // Загрузка сохранённых настроек
  useEffect(() => {
    if (settings.cameraQuality) setCameraQuality(settings.cameraQuality)
    if (settings.chatSoundEnabled === false) setChatSoundEnabled(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Сохранение настроек при изменении
  useEffect(() => { updateSetting('cameraQuality', cameraQuality) }, [cameraQuality, updateSetting])
  useEffect(() => { updateSetting('chatSoundEnabled', chatSoundEnabled) }, [chatSoundEnabled, updateSetting])

  // Синхронизация chatOpen с ref
  useEffect(() => { chatOpenRef.current = chatOpen }, [chatOpen, chatOpenRef])

  // Сброс непрочитанных при открытии чата
  useEffect(() => { if (chatOpen) setUnreadCount(0) }, [chatOpen, setUnreadCount])
  const connectedRef = useRef(false)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    if (connectedRef.current) return
    connectedRef.current = true

    const { wsUrl, token, displayName, roomName: rn, micDeviceId, cameraDeviceId } = window.__together || {}
    if (!wsUrl || !token) {
      onLeave()
      return
    }
    setRoomName(rn)

    connect(wsUrl, token, micDeviceId, cameraDeviceId).then(() => {
      showToast(`✅ Подключено к ${rn}`)
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        const m = String(Math.floor(elapsed / 60)).padStart(2, '0')
        const s = String(elapsed % 60).padStart(2, '0')
        setTimer(`${m}:${s}`)
      }, 1000)
    }).catch(err => {
      showToast('Ошибка подключения: ' + err.message)
      onLeave()
    })

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLeave = () => {
    playLeaveCall()
    disconnect()
    if (timerRef.current) clearInterval(timerRef.current)
    onLeave()
  }

  const handleMicChange = useCallback(async (deviceId) => {
    setSelectedMic(deviceId)
    await switchDevice('audioinput', deviceId)
  }, [setSelectedMic, switchDevice])

  const handleCameraChange = useCallback(async (deviceId) => {
    setSelectedCamera(deviceId)
    await switchDevice('videoinput', deviceId)
  }, [setSelectedCamera, switchDevice])

  const handleSpeakerChange = useCallback((deviceId) => {
    setSelectedSpeaker(deviceId)
    document.querySelectorAll('audio, video').forEach(el => {
      if (el.setSinkId) el.setSinkId(deviceId).catch(() => {})
    })
  }, [setSelectedSpeaker])

  const handleAudioSettingsChange = useCallback((settings) => {
    applyAudioSettings({
      noiseSuppression: settings.noiseSuppression,
      echoCancellation: settings.echoCancellation,
      autoGainControl: false,
    })
  }, [applyAudioSettings])

  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
  }, [])

  return (
    <div className={`screen call-screen ${chatOpen ? 'chat-open' : ''}`}>
      <div className="call-main">
        <div className="top-bar">
          <div className="room-info">
            <span className="room-name">{roomName}</span>
            <span className="room-badge">● LIVE</span>
          </div>
          <div className="participants-count">
            <span>👥</span> <span>{participants.length}</span>
          </div>
          <div className="timer">{timer}</div>
        </div>

        <VideoGrid
          participants={participants}
          localIdentity={localIdentity}
          speakers={speakers}
          connectionQuality={connectionQuality}
          pings={pings}
          globalVolume={globalVolume}
          isMuted={isMuted}
          localAvatar={settings.avatar}
        />

        <Controls
          isMicOn={isMicOn}
          isCamOn={isCamOn}
          isScreenSharing={isScreenSharing}
          onToggleMic={toggleMic}
          onToggleCam={toggleCam}
          onToggleScreen={toggleScreen}
          onLeave={handleLeave}
          mics={mics}
          cameras={cameras}
          speakers={speakerDevices}
          selectedMic={selectedMic}
          selectedCamera={selectedCamera}
          selectedSpeaker={selectedSpeaker}
          onMicChange={handleMicChange}
          onCameraChange={handleCameraChange}
          onSpeakerChange={handleSpeakerChange}
          onAudioSettingsChange={handleAudioSettingsChange}
          globalVolume={globalVolume}
          onVolumeChange={setGlobalVolume}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          cameraQuality={cameraQuality}
          onCameraQualityChange={setCameraQuality}
          screenQuality={screenQuality}
          onScreenQualityChange={setScreenQuality}
          chatOpen={chatOpen}
          onToggleChat={() => setChatOpen(prev => !prev)}
          unreadMessages={unreadCount}
          settings={settings}
          updateSetting={updateSetting}
          />
      </div>

      {chatOpen && (
        <ChatPanel
          messages={chatMessages}
          onSend={sendChatMessage}
          onClose={() => setChatOpen(false)}
          soundEnabled={chatSoundEnabled}
          onToggleSound={() => setChatSoundEnabled(prev => !prev)}
        />
      )}
    </div>
  )
}
