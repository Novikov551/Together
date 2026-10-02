import { useState } from 'react'
import DeviceSettings from './DeviceSettings'
import ScreenSharePanel from './ScreenSharePanel'
import CameraPanel from './CameraPanel'

// SVG иконки для кнопок управления
const MicIcon = ({ on }) => on ? (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
) : (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23"/>
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
)

const CameraIcon = ({ on }) => on ? (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 7l-7 5 7 5V7z"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
) : (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

const ScreenIcon = ({ on }) => on ? (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
    <rect x="7" y="7" width="10" height="6" rx="1" fill="currentColor" opacity="0.15"/>
  </svg>
) : (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
    <line x1="12" y1="8" x2="12" y2="13"/>
    <line x1="9.5" y1="10.5" x2="12" y2="8"/>
    <line x1="14.5" y1="10.5" x2="12" y2="8"/>
  </svg>
)

const PhoneOffIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/>
    <line x1="23" y1="1" x2="1" y2="23"/>
  </svg>
)

const GearIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const VolumeIcon = ({ muted }) => muted ? (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <line x1="23" y1="9" x2="17" y2="15"/>
    <line x1="17" y1="9" x2="23" y2="15"/>
  </svg>
) : (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
)

export default function Controls({
  isMicOn, isCamOn, isScreenSharing,
  onToggleMic, onToggleCam, onToggleScreen, onLeave,
  mics, cameras, speakers,
  selectedMic, selectedCamera, selectedSpeaker,
  onMicChange, onCameraChange, onSpeakerChange,
  onAudioSettingsChange,
  globalVolume, onVolumeChange,
  isMuted, onToggleMute,
  cameraQuality, onCameraQualityChange,
  screenQuality, onScreenQualityChange,
  chatOpen, onToggleChat, unreadMessages,
  settings, updateSetting,
}) {
  const [showScreenPanel, setShowScreenPanel] = useState(false)
  const [showCamPanel, setShowCamPanel] = useState(false)

  return (
    <div className="controls-bar">
      <button className={`ctrl-btn ${isMicOn ? 'on' : 'off'}`} onClick={onToggleMic}>
        <MicIcon on={isMicOn} />
        <span className="tooltip">Микрофон</span>
      </button>
      <div style={{ position: 'relative' }}>
        <button className={`ctrl-btn ${isCamOn ? 'on' : 'off'}`} onClick={() => setShowCamPanel(true)}>
          <CameraIcon on={isCamOn} />
          <span className="tooltip">Камера</span>
        </button>
        {showCamPanel && (
          <CameraPanel
            cameraQuality={cameraQuality}
            onCameraQualityChange={onCameraQualityChange}
            isCamOn={isCamOn}
            onToggleCam={onToggleCam}
            onClose={() => setShowCamPanel(false)}
          />
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <button className={`ctrl-btn ${isScreenSharing ? 'off' : 'on'}`} onClick={() => setShowScreenPanel(true)}>
          <ScreenIcon on={isScreenSharing} />
          <span className="tooltip">Демонстрация экрана</span>
        </button>
        {showScreenPanel && (
          <ScreenSharePanel
            screenQuality={screenQuality}
            onScreenQualityChange={onScreenQualityChange}
            isScreenSharing={isScreenSharing}
            onStartShare={onToggleScreen}
            onStopShare={onToggleScreen}
            onClose={() => setShowScreenPanel(false)}
          />
        )}
      </div>

      <div className="volume-control">
        <button className={`ctrl-btn on ${isMuted ? 'muted' : ''}`} onClick={onToggleMute}>
          <VolumeIcon muted={isMuted} />
          <span className="tooltip">{isMuted ? 'Включить звук' : 'Выключить звук'}</span>
        </button>
      </div>

      <button className={`ctrl-btn ${chatOpen ? 'off' : 'on'}`} onClick={onToggleChat} style={{ position: 'relative' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {unreadMessages > 0 && <span className="chat-badge">{unreadMessages}</span>}
        <span className="tooltip">Чат</span>
      </button>

      <DeviceSettings
        mics={mics} cameras={cameras} speakers={speakers}
        selectedMic={selectedMic} selectedCamera={selectedCamera} selectedSpeaker={selectedSpeaker}
        onMicChange={onMicChange} onCameraChange={onCameraChange} onSpeakerChange={onSpeakerChange}
        onAudioSettingsChange={onAudioSettingsChange}
        settings={settings} updateSetting={updateSetting}
      />

      <button className="ctrl-btn leave" onClick={onLeave}>
        <PhoneOffIcon />
        <span className="tooltip">Покинуть</span>
      </button>
    </div>
  )
}
