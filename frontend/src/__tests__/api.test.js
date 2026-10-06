import { describe, it, expect, vi, beforeEach } from 'vitest'
import { login, getRooms, createRoom, deleteRoom, getLiveKitToken, getRoomParticipants } from '../services/api'

// Мокаем fetch глобально
const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

describe('login', () => {
  it('отправляет POST на /api/authorization/login', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ session_token: 'abc123' }),
    })

    const result = await login('admin', 'password')

    expect(mockFetch).toHaveBeenCalledWith('/api/authorization/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: 'admin', password: 'password' }),
    })
    expect(result.session_token).toBe('abc123')
  })

  it('бросает ошибку при неверных данных', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })

    await expect(login('wrong', 'wrong')).rejects.toThrow('Неверный логин или пароль')
  })
})

describe('getRooms', () => {
  it('отправляет GET на /api/rooms/all с токеном', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ name: 'room1', is_private: false }],
    })

    const result = await getRooms('my-token')

    expect(mockFetch).toHaveBeenCalledWith('/api/rooms/all', {
      headers: { Authorization: 'Bearer my-token' },
    })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('room1')
  })

  it('бросает ошибку при неудаче', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })

    await expect(getRooms('token')).rejects.toThrow('Не удалось загрузить комнаты')
  })
})

describe('createRoom', () => {
  it('отправляет POST с именем и паролем', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    await createRoom('token', 'my-room', 'secret')

    expect(mockFetch).toHaveBeenCalledWith('/api/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      },
      body: JSON.stringify({ name: 'my-room', password: 'secret' }),
    })
  })

  it('не отправляет password если он пустой', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    await createRoom('token', 'public-room', '')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.password).toBeUndefined()
    expect(body.name).toBe('public-room')
  })
})

describe('deleteRoom', () => {
  it('отправляет DELETE на /api/rooms/{name}', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    await deleteRoom('token', 'room-to-delete')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/rooms/room-to-delete',
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('кодирует имя комнаты в URL', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    await deleteRoom('token', 'room with spaces')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/rooms/room%20with%20spaces',
      expect.objectContaining({ method: 'DELETE' })
    )
  })
})

describe('getLiveKitToken', () => {
  it('отправляет POST с display_name и room_name', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ live_kit_token: 'lk-token', live_kit_url: 'ws://localhost' }),
    })

    const result = await getLiveKitToken('session', 'Alice', 'room1')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.display_name).toBe('Alice')
    expect(body.room_name).toBe('room1')
    expect(body.password).toBeUndefined()
    expect(result.live_kit_token).toBe('lk-token')
  })

  it('включает password если передан', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ live_kit_token: 'tok', live_kit_url: 'ws://x' }),
    })

    await getLiveKitToken('session', 'Alice', 'room1', 'secret')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.password).toBe('secret')
  })

  it('бросает ошибку 401 при неверном пароле', async () => {
    mockFetch.mockResolvedValueOnce({ status: 401, ok: false })

    await expect(getLiveKitToken('s', 'A', 'r', 'wrong')).rejects.toThrow('Неверный пароль комнаты')
  })
})

describe('getRoomParticipants', () => {
  it('отправляет GET с encoded room name', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'room', participants: ['Alice'], is_private: false }),
    })

    const result = await getRoomParticipants('token', 'my room')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/rooms/my%20room/participants',
      expect.any(Object)
    )
    expect(result.participants).toContain('Alice')
  })
})