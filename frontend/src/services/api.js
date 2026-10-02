const AUTH_BASE = '/api/authorization'
const ROOMS_BASE = '/api/rooms'

export async function login(username, password) {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_name: username, password }),
  })
  if (!res.ok) throw new Error('Неверный логин или пароль')
  return res.json()
}

export async function getLiveKitToken(sessionToken, displayName, roomName, password) {
  const body = { display_name: displayName, room_name: roomName }
  if (password) body.password = password

  const res = await fetch(`${AUTH_BASE}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify(body),
  })
  if (res.status === 401) throw new Error('Неверный пароль комнаты')
  if (!res.ok) throw new Error('Не удалось получить токен')
  return res.json()
}

export async function getRooms(sessionToken) {
  const res = await fetch(`${ROOMS_BASE}/all`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  })
  if (!res.ok) throw new Error('Не удалось загрузить комнаты')
  return res.json()
}

export async function getRoomParticipants(sessionToken, roomName) {
  const res = await fetch(`${ROOMS_BASE}/${encodeURIComponent(roomName)}/participants`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  })
  if (!res.ok) throw new Error('Не удалось загрузить участников')
  return res.json()
}

export async function createRoom(sessionToken, name, password) {
  const body = { name }
  if (password) body.password = password

  const res = await fetch(`${ROOMS_BASE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Не удалось создать комнату')
  return res.json()
}
export async function deleteRoom(sessionToken, roomName) {
  const res = await fetch(`${ROOMS_BASE}/${encodeURIComponent(roomName)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${sessionToken}` },
  })
  if (!res.ok) throw new Error('Не удалось удалить комнату')
  return res.json()
}
