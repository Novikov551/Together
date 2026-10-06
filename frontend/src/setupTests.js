import '@testing-library/jest-dom'
import React from 'react'
import { vi } from 'vitest'

// Делаем React глобально доступным для JSX (classic runtime fallback)
globalThis.React = React

// Мокаем localStorage для Node 22+ jsdom
const storage = {}
global.localStorage = {
  getItem: (key) => storage[key] ?? null,
  setItem: (key, value) => { storage[key] = String(value) },
  removeItem: (key) => { delete storage[key] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
  get length() { return Object.keys(storage).length },
  key: (i) => Object.keys(storage)[i] ?? null,
}

// Мокаем AudioContext для Web Audio API (sounds.js)
const mockOscillator = {
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  type: 'sine',
  frequency: { value: 0, setValueAtTime: vi.fn() },
}

const mockGain = {
  connect: vi.fn(),
  gain: {
    value: 0,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
}

global.AudioContext = vi.fn().mockImplementation(() => ({
  createOscillator: vi.fn().mockReturnValue({ ...mockOscillator }),
  createGain: vi.fn().mockReturnValue({ ...mockGain }),
  destination: {},
  currentTime: 0,
}))
global.webkitAudioContext = global.AudioContext