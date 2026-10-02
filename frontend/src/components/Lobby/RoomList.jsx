import { useState, useEffect, useCallback } from 'react'
import { getRooms, getRoomParticipants, createRoom } from '../../services/api'

const PAGE_SIZE = 10

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
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

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

  useEffect(() => { loadRooms() }, [loadRooms])

  // Фильтрация по поиску
  const filtered = search.trim()
    ? rooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    : rooms

  // Пагинация
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  // Сброс страницы при поиске
  useEffect(() => { setPage(0) }, [search])

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
    } catch {
      setParticipants([])
    } finally {
      setLoadingParticipants(false)
    }
  }, [selectedRoom, sessionToken])

  const handleJoin = useCallback((room) => {
    onJoinRoom(room.name, room.is_private)
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

      {/* Поиск */}
      <div className="room-search">
        <input
          type="text"
          placeholder="Поиск комнаты..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
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

      {loading && rooms.length === 0 && (
        <div className="room-list-loading">Загрузка...</div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="room-list-empty">{search ? 'Ничего не найдено' : 'Нет активных комнат'}</div>
      )}

      <div className="room-items">
        {paged.map(room => (
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
                    {participants.map((p, i) => (
                      <li key={i} className="room-participant">👤 {p}</li>
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

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="room-pagination">
          <button disabled={safePage === 0} onClick={() => setPage(p => p - 1)}>←</button>
          <span>{safePage + 1} / {totalPages}</span>
          <button disabled={safePage >= totalPages - 1} onClick={() => setPage(p => p + 1)}>→</button>
        </div>
      )}
    </div>
  )
}