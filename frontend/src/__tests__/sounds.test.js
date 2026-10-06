import { describe, it, expect, vi } from 'vitest'
import {
  playMicOn,
  playMicOff,
  playScreenShareOn,
  playScreenShareOff,
  playParticipantJoined,
  playParticipantLeft,
  playLeaveCall,
  playChatMessage,
} from '../services/sounds'

// Мокаем Audio — все звуки просто не воспроизводятся в тестах
global.Audio = vi.fn().mockImplementation(() => ({
  play: vi.fn().mockResolvedValue(undefined),
  volume: 0,
}))

describe('sounds', () => {
  it('все функции звуков вызываются без ошибок', () => {
    expect(() => playMicOn()).not.toThrow()
    expect(() => playMicOff()).not.toThrow()
    expect(() => playScreenShareOn()).not.toThrow()
    expect(() => playScreenShareOff()).not.toThrow()
    expect(() => playParticipantJoined()).not.toThrow()
    expect(() => playParticipantLeft()).not.toThrow()
    expect(() => playLeaveCall()).not.toThrow()
    expect(() => playChatMessage()).not.toThrow()
  })
})