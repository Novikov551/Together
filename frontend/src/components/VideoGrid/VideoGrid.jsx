import { useEffect, useRef, useState, useCallback } from 'react'
import { Track } from 'livekit-client'

export default function VideoGrid({ participants, localIdentity, speakers, connectionQuality, pings, globalVolume, isMuted, localAvatar }) {
  const count = participants.length
  const gridClass = count <= 1 ? 'grid-1' : count <= 2 ? 'grid-2' : count <= 3 ? 'grid-3' : 'grid-4'

  return (
    <div className={`video-grid ${gridClass}`}>
      {participants.map(p => (
        <VideoTile
          key={p.identity}
          participant={p}
          isLocal={p.isLocal}
          isSpeaking={speakers.includes(p.identity)}
          quality={connectionQuality[p.identity]}
          ping={p.local ? pings.local : null}
          globalVolume={globalVolume}
          isMuted={isMuted}
          avatar={p.isLocal ? localAvatar : null}
        />
      ))}
    </div>
  )
}

function QualityIndicator({ quality, ping }) {
  // ConnectionQuality: 0 = Unknown, 1 = Poor, 2 = Good, 3 = Excellent
  const q = quality != null && quality > 0 ? quality : 3
  const level = Math.min(q, 3) - 1
  const colors = ['#ef4444', '#f59e0b', '#22c55e']
  const labels = ['Плохое', 'Среднее', 'Хорошее']
  const color = colors[level]
  const pingText = ping != null ? `${ping} ms` : labels[level]

  return (
    <div className="quality-indicator" title={pingText}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="quality-bar"
          style={{
            height: `${(i + 1) * 4 + 2}px`,
            background: i <= level ? color : 'rgba(255,255,255,0.15)',
          }}
        />
      ))}
      {ping != null && <span className="quality-ping">{ping} ms</span>}
    </div>
  )
}

function VideoTile({ participant, isLocal, isSpeaking, quality, ping, globalVolume, isMuted, avatar }) {
  const videoRef = useRef(null)
  const audioRef = useRef(null)
  const screenAudioRef = useRef(null)
  const tileRef = useRef(null)
  const { identity, name, tracks } = participant
  const videoTrack = tracks[Track.Source.Camera] || tracks[Track.Source.ScreenShare]
  const audioTrack = tracks[Track.Source.Microphone]
  const screenShareTrack = tracks[Track.Source.ScreenShare]
  const screenShareAudioTrack = tracks[Track.Source.ScreenShareAudio]
  const hasVideo = !!videoTrack
  const isScreenShare = !!screenShareTrack
  const hasScreenAudio = !!screenShareAudioTrack

  const [volume, setVolume] = useState(100)
  const [screenVolume, setScreenVolume] = useState(100)
  const [tileMuted, setTileMuted] = useState(false)
  const [screenMuted, setScreenMuted] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const [isPiP, setIsPiP] = useState(false)

  // Attach video track
  useEffect(() => {
    if (!videoRef.current || !videoTrack) return
    videoTrack.attach(videoRef.current)
    return () => {
      try { videoTrack.detach(videoRef.current) } catch {}
    }
  }, [videoTrack])

  // Attach microphone audio
  useEffect(() => {
    if (!audioRef.current || !audioTrack || isLocal) return
    audioTrack.attach(audioRef.current)
    return () => {
      try { audioTrack.detach(audioRef.current) } catch {}
    }
  }, [audioTrack, isLocal])

  // Attach screen share audio
  useEffect(() => {
    if (!screenAudioRef.current || !screenShareAudioTrack || isLocal) return
    screenShareAudioTrack.attach(screenAudioRef.current)
    return () => {
      try { screenShareAudioTrack.detach(screenAudioRef.current) } catch {}
    }
  }, [screenShareAudioTrack, isLocal])

  // Apply volume to mic audio (muted by global mute button)
  useEffect(() => {
    if (!audioRef.current || isLocal) return
    const effectiveVolume = (isMuted || tileMuted) ? 0 : (volume / 100) * (globalVolume / 100)
    audioRef.current.volume = Math.max(0, Math.min(1, effectiveVolume))
  }, [volume, globalVolume, tileMuted, isMuted, isLocal])

  // Apply volume to screen share audio (NOT affected by global mute)
  useEffect(() => {
    if (!screenAudioRef.current || isLocal) return
    const effectiveVolume = screenMuted ? 0 : (screenVolume / 100) * (globalVolume / 100)
    screenAudioRef.current.volume = Math.max(0, Math.min(1, effectiveVolume))
  }, [screenVolume, globalVolume, screenMuted, isLocal])

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [contextMenu])

  // PiP change listener
  useEffect(() => {
    const handler = () => setIsPiP(!!document.pictureInPictureElement)
    document.addEventListener('leavepictureinpicture', handler)
    document.addEventListener('enterpictureinpicture', handler)
    return () => {
      document.removeEventListener('leavepictureinpicture', handler)
      document.removeEventListener('enterpictureinpicture', handler)
    }
  }, [])

  const handleContextMenu = useCallback((e) => {
    if (isLocal) return
    e.preventDefault()
    const rect = tileRef.current.getBoundingClientRect()
    setContextMenu({
      x: Math.min(e.clientX - rect.left, rect.width - 220),
      y: Math.min(e.clientY - rect.top, rect.height - 200),
    })
  }, [isLocal])

  const handlePiP = useCallback(async () => {
    if (!videoRef.current) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await videoRef.current.requestPictureInPicture()
      }
    } catch (e) {
      console.error('PiP error:', e)
    }
  }, [])

  const toggleTileMute = useCallback(() => {
    setTileMuted(prev => !prev)
    setContextMenu(null)
  }, [])

  const toggleScreenMute = useCallback(() => {
    setScreenMuted(prev => !prev)
    setContextMenu(null)
  }, [])

  const initial = avatar || (name || '?')[0].toUpperCase()

  return (
    <div
      ref={tileRef}
      className={`video-tile ${isSpeaking ? 'speaking' : ''} ${!hasVideo ? 'no-video' : ''} ${isScreenShare ? 'screen-share' : ''}`}
      onContextMenu={handleContextMenu}
    >
      <div className="speaking-ring" />
      {!hasVideo && (
        <div className="no-video-overlay">
          <div className="avatar">{initial}</div>
        </div>
      )}
      <video ref={videoRef} autoPlay playsInline muted={isLocal} style={{ display: hasVideo ? 'block' : 'none' }} />
      {!isLocal && <audio ref={audioRef} autoPlay />}
      {!isLocal && hasScreenAudio && <audio ref={screenAudioRef} autoPlay />}

      {/* Tile controls overlay */}
      <div className="tile-controls">
        {isScreenShare && (
          <button className="tile-ctrl-btn" onClick={handlePiP} title={isPiP ? 'Вернуть из PiP' : 'Вынести в отдельное окно'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <rect x="12" y="9" width="8" height="6" rx="1" fill="currentColor" opacity="0.3"/>
            </svg>
          </button>
        )}
        {!isLocal && (
          <button className={`tile-ctrl-btn ${tileMuted ? 'muted' : ''}`} onClick={toggleTileMute} title={tileMuted ? 'Включить звук' : 'Выключить звук'}>
            {tileMuted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && !isLocal && (
        <div className="tile-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={e => e.stopPropagation()}>
          <div className="ctx-header">{name}</div>
          <div className="ctx-volume">
            <span className="ctx-label">🎤 Микрофон</span>
            <input
              type="range" min="0" max="100" value={volume}
              onChange={e => setVolume(Number(e.target.value))}
              className="ctx-slider"
            />
            <span className="ctx-value">{volume}%</span>
          </div>
          <button className="ctx-btn" onClick={toggleTileMute}>
            {tileMuted ? '🔊 Включить микрофон' : '🔇 Выключить микрофон'}
          </button>

          {isScreenShare && (
            <>
              <div className="ctx-divider" />
              <div className="ctx-volume">
                <span className="ctx-label">🖥️ Демонстрация</span>
                <input
                  type="range" min="0" max="100" value={screenVolume}
                  onChange={e => setScreenVolume(Number(e.target.value))}
                  className="ctx-slider"
                />
                <span className="ctx-value">{screenVolume}%</span>
              </div>
              <button className="ctx-btn" onClick={toggleScreenMute}>
                {screenMuted ? '🔊 Включить звук демонстрации' : '🔇 Выключить звук демонстрации'}
              </button>
            </>
          )}
        </div>
      )}

      <div className="tile-name">
        <QualityIndicator quality={quality} ping={ping} />
        {tileMuted && <span className="muted-badge">🔇 </span>}
        {name} {isLocal && <span className="you-badge">(вы)</span>}
        {isScreenShare && <span className="screen-badge">🖥️</span>}
      </div>
    </div>
  )
}
