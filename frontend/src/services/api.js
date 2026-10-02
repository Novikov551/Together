const API_BASE = '/api/authorization'

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_name: username, password }),
  })
  if (!res.ok) throw new Error('Неверный логин или пароль')
  return res.json()
}

export async function getLiveKitToken(sessionToken, displayName, roomName) {
  const res = await fetch(`${API_BASE}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({ display_name: displayName, room_name: roomName }),
  })
  if (!res.ok) throw new Error('Не удалось получить токен')
  return res.json()
}