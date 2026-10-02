import { useState, useEffect, useCallback } from 'react'

export function useDevices() {
  const [mics, setMics] = useState([])
  const [cameras, setCameras] = useState([])
  const [speakers, setSpeakers] = useState([])
  const [selectedMic, setSelectedMic] = useState('')
  const [selectedCamera, setSelectedCamera] = useState('')
  const [selectedSpeaker, setSelectedSpeaker] = useState('')

  const loadDevices = useCallback(async () => {
    // Запрашиваем только микрофон — камера не нужна до явного включения
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
    } catch (e) {
      console.warn('Нет доступа к микрофону:', e)
    }

    let devices = []
    try {
      devices = await navigator.mediaDevices.enumerateDevices()
    } catch (e) {
      console.warn('Не удалось получить устройства:', e)
    }

    const micList = devices.filter(d => d.kind === 'audioinput')
    const cameraList = devices.filter(d => d.kind === 'videoinput')
    const speakerList = devices.filter(d => d.kind === 'audiooutput')

    setMics(micList)
    setCameras(cameraList)
    setSpeakers(speakerList)

    if (micList.length > 0 && (!selectedMic || !micList.find(d => d.deviceId === selectedMic))) {
      setSelectedMic(micList[0].deviceId)
    }
    if (cameraList.length > 0 && (!selectedCamera || !cameraList.find(d => d.deviceId === selectedCamera))) {
      setSelectedCamera(cameraList[0].deviceId)
    }
    if (speakerList.length > 0 && (!selectedSpeaker || !speakerList.find(d => d.deviceId === selectedSpeaker))) {
      setSelectedSpeaker(speakerList[0].deviceId)
    }
  }, [selectedMic, selectedCamera, selectedSpeaker])

  useEffect(() => {
    loadDevices()
    navigator.mediaDevices.addEventListener('devicechange', loadDevices)
    return () => navigator.mediaDevices.removeEventListener('devicechange', loadDevices)
  }, [loadDevices])

  return {
    mics, cameras, speakers,
    selectedMic, selectedCamera, selectedSpeaker,
    setSelectedMic, setSelectedCamera, setSelectedSpeaker,
  }
}
