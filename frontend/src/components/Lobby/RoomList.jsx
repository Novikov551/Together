import { useState, useEffect, useCallback } from 'react'
import { getRooms, getRoomParticipants, createRoom } from '../../services/api'

export default function RoomList({ sessionToken, onJoinRoom }) {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [participants, setParticipants] = useState(null)
  const [loadingParticipants, setLoadingParticipants] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomPassword, setNewRoomPassword] = useState('')
  const [creating, setCreating] = useState(false)

  const loadRooms = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getRooms(sessionToken)
      setRooms(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [sessionToken])

  useEffect(() => {
    loadRooms()
    const interval = setInterval(loadRooms, 10000)
    return () => clearInterval(interval)
  }, [loadRooms])

  const handleRoomClick = useCallback(async (room) => {
    if (selectedRoom?.name === room.name) {
      setSelectedRoom(null)
      setParticipants(null)
      return
    }
    setSelectedRoom(room)
    setParticipants(null)
    try {
      setLoadingParticipants(true)
      const data = await getRoomParticipants(sessionToken, room.name)
      setParticipants(data.participants || [])
    } catch (e) {
      setParticipants([])
    } finally {
      setLoadingParticipants(false)
    }
  }, [selectedRoom, sessionToken])

  const handleJoin = useCallback((room) => {
    if (room.is_private) {
      onJoinRoom(room.name, true)
    } else {
      onJoinRoom(room.name, false)
    }
  }, [onJoinRoom])

  const handleCreate = useCallback(async (e) => {
    e.preventDefault()
    if (!newRoomName.trim()) return
    try {
      setCreating(true)
      await createRoom(sessionToken, newRoomName.trim(), newRoomPassword || null)
      setNewRoomName('')
      setNewRoomPassword('')
      setShowCreate(false)
      await loadRooms()
    } catch (e) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }, [sessionToken, newRoomName, newRoomPassword, loadRooms])

  if (loading && rooms.length === 0) {
    return <div className="room-list-loading">Загрузка комнат...</div>
  }

  return (
    <div className="room-list">
      <div className="room-list-header">
        <h3>Комнаты</h3>
        <div className="room-list-actions">
          <button className="room-refresh-btn" onClick={loadRooms} title="Обновить">🔄</button>
          <button className="room-create-btn" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? '✕' : '+ Создать'}
          </button>
        </div>
      </div>

      {error && <div className="room-list-error">{error}</div>}

      {showCreate && (
        <form className="room-create-form" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Название комнаты"
            value={newRoomName}
            onChange={e => setNewRoomName(e.target.value)}
            autoFocus
          />
          <input
            type="password"
            placeholder="Пароль (необязательно)"
            value={newRoomPassword}
            onChange={e => setNewRoomPassword(e.target.value)}
          />
          <button type="submit" disabled={creating || !newRoomName.trim()}>
            {creating ? '...' : 'Создать'}
          </button>
        </form>
      )}

      {rooms.length === 0 && !showCreate && (
        <div className="room-list-empty">Нет активных комнат</div>
      )}

      <div className="room-items">
        {rooms.map(room => (
          <div key={room.name} className={`room-item ${selectedRoom?.name === room.name ? 'selected' : ''}`}>
            <div className="room-item-main" onClick={() => handleRoomClick(room)}>
              <div className="room-item-info">
                <span className="room-item-name">
                  {room.is_private && '🔒 '}{room.name}
                </span>
                {room.is_private && <span className="room-badge-private">Приватная</span>}
              </div>
              <span className="room-item-arrow">{selectedRoom?.name === room.name ? '▼' : '▶'}</span>
            </div>

            {selectedRoom?.name === room.name && (
              <div className="room-participants">
                {loadingParticipants ? (
                  <div className="room-participants-loading">Загрузка...</div>
                ) : participants && participants.length > 0 ? (
                  <ul className="room-participants-list">
                    {participants.map((name, i) => (
                      <li key={i} className="room-participant">👤 {name}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="room-participants-empty">Нет участников</div>
                )}
                <button className="room-join-btn" onClick={() => handleJoin(room)}>
                  Подключиться
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}