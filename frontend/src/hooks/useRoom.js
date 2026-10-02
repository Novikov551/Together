import { useState, useRef, useCallback, useEffect } from 'react'
import { Room, Track, VideoPresets, ConnectionQuality } from 'livekit-client'
import { playMicOn, playMicOff, playScreenShareOn, playScreenShareOff, playParticipantJoined, playParticipantLeft, playRemoteScreenShareOn, playRemoteScreenShareOff, playChatMessage } from '../services/sounds'

export const SCREEN_QUALITY = {
  low:    { resolution: { width: 1280, height: 720  }, maxBitrate: 1_500_000, maxFps: 15 },
  medium: { resolution: { width: 1920, height: 1080 }, maxBitrate: 3_000_000, maxFps: 30 },
  high:   { resolution: { width: 2560, height: 1440 }, maxBitrate: 6_000_000, maxFps: 30 },
  ultra:  { resolution: { width: 3840, height: 2160 }, maxBitrate: 12_000_000, maxFps: 30 },
}

export const CAMERA_QUALITY = {
  low:    { resolution: VideoPresets.h360.resolution,  maxBitrate: 500_000,  maxFps: 15 },
  medium: { resolution: VideoPresets.h720.resolution,  maxBitrate: 1_500_000, maxFps: 30 },
  high:   { resolution: VideoPresets.h1080.resolution, maxBitrate: 3_000_000, maxFps: 30 },
}

export function useRoom() {
  const roomRef = useRef(null)
  const [participants, setParticipants] = useState([])
  const [localIdentity, setLocalIdentity] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isMicOn, setIsMicOn] = useState(false)
  const [isCamOn, setIsCamOn] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [speakers, setSpeakers] = useState([])
  const [connectionQuality, setConnectionQuality] = useState({})
  const [pings, setPings] = useState({})
  const [chatMessages, setChatMessages] = useState([])
  const [chatSoundEnabled, setChatSoundEnabled] = useState(true)
  const chatSoundEnabledRef = useRef(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const chatOpenRef = useRef(false)

  // Синхронизация ref с state
  useEffect(() => { chatSoundEnabledRef.current = chatSoundEnabled }, [chatSoundEnabled])
  const [screenQuality, setScreenQuality] = useState('medium')
  const [cameraQuality, setCameraQuality] = useState('medium')

  const updateParticipants = useCallback(() => {
    if (!roomRef.current) return
    const r = roomRef.current
    const list = [
      {
        identity: r.localParticipant.identity,
        name: r.localParticipant.name || r.localParticipant.identity,
        isLocal: true,
        tracks: getTracks(r.localParticipant),
      },
      ...Array.from(r.remoteParticipants.values()).map(p => ({
        identity: p.identity,
        name: p.name || p.identity,
        isLocal: false,
        tracks: getTracks(p),
      })),
    ]
    setParticipants(list)
  }, [])

  const connect = useCallback(async (wsUrl, token, micDeviceId, cameraDeviceId) => {
    const camPreset = CAMERA_QUALITY[cameraQuality] || CAMERA_QUALITY.medium
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: camPreset.resolution,
        maxFps: camPreset.maxFps,
      },
      publishDefaults: {
        videoEncoding: {
          maxBitrate: camPreset.maxBitrate,
          maxFramerate: camPreset.maxFps,
        },
        screenShareEncoding: {
          maxBitrate: (SCREEN_QUALITY[screenQuality] || SCREEN_QUALITY.medium).maxBitrate,
          maxFramerate: (SCREEN_QUALITY[screenQuality] || SCREEN_QUALITY.medium).maxFps,
        },
      },
    })
    roomRef.current = room

    room.on('connected', () => setIsConnected(true))
    room.on('disconnected', () => {
      setIsConnected(false)
      setParticipants([])
      setLocalIdentity(null)
    })

    room.on('participantConnected', (p) => { playParticipantJoined(); updateParticipants() })
    room.on('participantDisconnected', (p) => { playParticipantLeft(); updateParticipants() })
    room.on('trackSubscribed', (track, pub, participant) => {
      if (track.source === Track.Source.ScreenShare) {
        playRemoteScreenShareOn()
      }
      updateParticipants()
    })
    room.on('trackUnsubscribed', (track, pub, participant) => {
      if (track.source === Track.Source.ScreenShare) {
        playRemoteScreenShareOff()
      }
      updateParticipants()
    })
    room.on('trackMuted', updateTracks)
    room.on('trackUnmuted', updateTracks)
    room.on('trackPublished', updateParticipants)
    room.on('trackUnpublished', updateParticipants)

    room.on('activeSpeakersChanged', (activeSpeakers) => {
      setSpeakers(activeSpeakers.map(s => s.identity))
    })

    // Более быстрое обновление speaking через per-participant события
    const handleSpeaking = (speaking, participant) => {
      setSpeakers(prev => {
        if (speaking) {
          return prev.includes(participant.identity) ? prev : [...prev, participant.identity]
        } else {
          return prev.filter(id => id !== participant.identity)
        }
      })
    }

    room.on('isSpeakingChanged', (participant) => {
      handleSpeaking(participant.isSpeaking, participant)
    })

    room.on('connectionQualityChanged', (quality, participant) => {
      setConnectionQuality(prev => ({
        ...prev,
        [participant.identity]: quality,
      }))
    })

    // Чат через data channel
    room.on('dataReceived', (payload, participant) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload))
        if (msg.type === 'chat') {
          setChatMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            sender: participant?.name || participant?.identity || 'Unknown',
            text: msg.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }])
          // Звук уведомления
          if (chatSoundEnabledRef.current) {
            playChatMessage()
          }
          // Счётчик непрочитанных если чат закрыт
          if (!chatOpenRef.current) {
            setUnreadCount(prev => prev + 1)
          }
        }
      } catch {}
    })

    function updateTracks() {
      updateParticipants()
    }

    await room.connect(wsUrl, token)
    setLocalIdentity(room.localParticipant.identity)

    // Микрофон
    try {
      await room.localParticipant.setMicrophoneEnabled(true, {
        deviceId: micDeviceId || undefined,
      })
      setIsMicOn(true)
    } catch (e) {
      console.warn('Микрофон не включился:', e)
    }

    // Камера (опционально)
    try {
      await room.localParticipant.setCameraEnabled(true, {
        deviceId: cameraDeviceId || undefined,
      })
      setIsCamOn(true)
    } catch (e) {
      console.warn('Камера не найдена:', e)
    }

    updateParticipants()
    return room
  }, [updateParticipants, cameraQuality, screenQuality])

  // Измерение пинга через WebRTC stats
  useEffect(() => {
    if (!roomRef.current) return
    const interval = setInterval(async () => {
      try {
        const room = roomRef.current
        if (!room || !room.engine) return
        const pc = room.engine.subscriber?.pc
        if (!pc) return
        const stats = await pc.getStats()
        let rtt = null
        stats.forEach(report => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded' && report.currentRoundTripTime != null) {
            rtt = Math.round(report.currentRoundTripTime * 1000)
          }
        })
        if (rtt != null) {
          setPings({ local: rtt })
        }
      } catch {}
    }, 2000)
    return () => clearInterval(interval)
  }, [isConnected])

  const toggleMic = useCallback(async () => {
    if (!roomRef.current) return
    const next = !isMicOn
    await roomRef.current.localParticipant.setMicrophoneEnabled(next)
    setIsMicOn(next)
    next ? playMicOn() : playMicOff()
    updateParticipants()
  }, [isMicOn, updateParticipants])

  const toggleCam = useCallback(async () => {
    if (!roomRef.current) return
    const next = !isCamOn
    try {
      await roomRef.current.localParticipant.setCameraEnabled(next)
      setIsCamOn(next)
      updateParticipants()
    } catch (e) {
      console.warn('Ошибка камеры:', e)
    }
  }, [isCamOn, updateParticipants])

  const toggleScreen = useCallback(async () => {
    if (!roomRef.current) return
    if (!isScreenSharing) {
      try {
        const sq = SCREEN_QUALITY[screenQuality] || SCREEN_QUALITY.medium
        // Обновляем кодек перед стартом
        if (roomRef.current.options.publishDefaults) {
          roomRef.current.options.publishDefaults.screenShareEncoding = {
            maxBitrate: sq.maxBitrate,
            maxFramerate: sq.maxFps,
          }
        }
        await roomRef.current.localParticipant.setScreenShareEnabled(true, {
          audio: true,
          resolution: sq.resolution,
          maxFps: sq.maxFps,
        })
        setIsScreenSharing(true)
        playScreenShareOn()
      } catch (e) {
        console.error('Screen share error:', e)
      }
    } else {
      await roomRef.current.localParticipant.setScreenShareEnabled(false)
      setIsScreenSharing(false)
      playScreenShareOff()
    }
    updateParticipants()
  }, [isScreenSharing, updateParticipants, screenQuality])

  // Перезапуск демонстрации при смене качества
  useEffect(() => {
    if (!isScreenSharing || !roomRef.current) return
    const restart = async () => {
      try {
        await roomRef.current.localParticipant.setScreenShareEnabled(false)
        const sq = SCREEN_QUALITY[screenQuality] || SCREEN_QUALITY.medium
        // Обновляем кодек в настройках комнаты перед перезапуском
        if (roomRef.current.options.publishDefaults) {
          roomRef.current.options.publishDefaults.screenShareEncoding = {
            maxBitrate: sq.maxBitrate,
            maxFramerate: sq.maxFps,
          }
        }
        await roomRef.current.localParticipant.setScreenShareEnabled(true, {
          audio: true,
          resolution: sq.resolution,
          maxFps: sq.maxFps,
        })
        updateParticipants()
      } catch (e) {
        console.warn('Не удалось обновить качество демонстрации:', e)
      }
    }
    restart()
  }, [screenQuality]) // eslint-disable-line react-hooks/exhaustive-deps

  const disconnect = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect()
      roomRef.current = null
    }
    setIsConnected(false)
    setIsMicOn(false)
    setIsCamOn(false)
    setIsScreenSharing(false)
    setParticipants([])
    setLocalIdentity(null)
    setChatMessages([])
  }, [])

  const sendChatMessage = useCallback((text) => {
    if (!roomRef.current || !text.trim()) return
    const msg = JSON.stringify({ type: 'chat', text: text.trim() })
    const encoded = new TextEncoder().encode(msg)
    roomRef.current.localParticipant.publishData(encoded, { reliable: true })
    // Добавляем своё сообщение локально
    setChatMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      sender: roomRef.current.localParticipant.name || roomRef.current.localParticipant.identity,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLocal: true,
    }])
  }, [])

  const switchDevice = useCallback(async (kind, deviceId) => {
    if (!roomRef.current) return
    const room = roomRef.current
    try {
      if (kind === 'audioinput') {
        await room.switchActiveDevice('audioinput', deviceId)
      } else if (kind === 'videoinput') {
        await room.switchActiveDevice('videoinput', deviceId)
      }
      updateParticipants()
    } catch (e) {
      console.warn('Не удалось переключить устройство:', e)
    }
  }, [updateParticipants])

  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect()
        roomRef.current = null
      }
    }
  }, [])

  return {
    participants,
    localIdentity,
    isConnected,
    isMicOn,
    isCamOn,
    isScreenSharing,
    speakers,
    connectionQuality,
    pings,
    chatMessages,
    sendChatMessage,
    chatSoundEnabled,
    setChatSoundEnabled,
    unreadCount,
    setUnreadCount,
    chatOpenRef,
    screenQuality,
    setScreenQuality,
    cameraQuality,
    setCameraQuality,
    connect,
    disconnect,
    toggleMic,
    toggleCam,
    toggleScreen,
    switchDevice,
  }
}

function getTracks(participant) {
  const tracks = {}
  participant.trackPublications.forEach(pub => {
    if (pub.isSubscribed && pub.track && !pub.isMuted) {
      tracks[pub.source] = pub.track
    }
  })
  return tracks
}
