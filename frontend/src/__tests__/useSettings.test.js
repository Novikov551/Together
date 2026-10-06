import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSettings } from '../hooks/useSettings'

beforeEach(() => {
  localStorage.clear()
})

describe('useSettings', () => {
  it('возвращает настройки по умолчанию', () => {
    const { result } = renderHook(() => useSettings())

    expect(result.current.settings.cameraQuality).toBe('medium')
    expect(result.current.settings.chatSoundEnabled).toBe(true)
    expect(result.current.settings.avatar).toBe('😀')
  })

  it('updateSetting обновляет одну настройку', () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.updateSetting('cameraQuality', 'high')
    })

    expect(result.current.settings.cameraQuality).toBe('high')
    // Остальные не изменились
    expect(result.current.settings.chatSoundEnabled).toBe(true)
  })

  it('updateSettings обновляет несколько настроек', () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.updateSettings({
        cameraQuality: 'low',
        chatSoundEnabled: false,
      })
    })

    expect(result.current.settings.cameraQuality).toBe('low')
    expect(result.current.settings.chatSoundEnabled).toBe(false)
  })

  it('сохраняет настройки в localStorage', () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.updateSetting('cameraQuality', 'high')
    })

    const saved = JSON.parse(localStorage.getItem('together-settings'))
    expect(saved.cameraQuality).toBe('high')
  })

  it('загружает настройки из localStorage', () => {
    localStorage.setItem(
      'together-settings',
      JSON.stringify({ cameraQuality: 'ultra', avatar: '😎' })
    )

    const { result } = renderHook(() => useSettings())

    expect(result.current.settings.cameraQuality).toBe('ultra')
    expect(result.current.settings.avatar).toBe('😎')
    // Дефолты для остальных
    expect(result.current.settings.chatSoundEnabled).toBe(true)
  })

  it('повреждённый localStorage не ломает хук', () => {
    localStorage.setItem('together-settings', 'not-json{{{')

    const { result } = renderHook(() => useSettings())

    expect(result.current.settings.cameraQuality).toBe('medium')
  })
})