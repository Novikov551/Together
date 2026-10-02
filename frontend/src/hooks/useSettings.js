import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'together-settings'

const defaults = {
  displayName: '',
  selectedMic: '',
  selectedCamera: '',
  selectedSpeaker: '',
  avatar: '😀',
  cameraQuality: 'medium',
  chatSoundEnabled: true,
  micProfile: 'voice',
  micNoiseSuppression: true,
  micEchoCancellation: true,
  micSensitivity: 40,
  micAutoSensitivity: true,
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaults }
    const saved = JSON.parse(raw)
    return { ...defaults, ...saved }
  } catch {
    return { ...defaults }
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {}
}

export function useSettings() {
  const [settings, setSettings] = useState(loadSettings)

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateSettings = useCallback((partial) => {
    setSettings(prev => ({ ...prev, ...partial }))
  }, [])

  return { settings, updateSetting, updateSettings }
}
