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

  const filtered = search.trim()
    ? rooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    : rooms

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

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
          <button className="room-action-btn" onClick={loadRooms} title="Обновить">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
          <button className="room-action-btn accent" onClick={() => setShowCreate(!showCreate)} title="Создать комнату">
            {showCreate ? '✕' : '+'}
          </button>
        </div>
      </div>

      <div className="room-search">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          type="text"
          placeholder="Поиск..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error && <div className="room-list-error">{error}</div>}

      {showCreate && (
        <form className="room-create-form" onSubmit={handleCreate}>
          <input type="text" placeholder="Название" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} autoFocus />
          <input type="password" placeholder="Пароль (опц.)" value={newRoomPassword} onChange={e => setNewRoomPassword(e.target.value)} />
          <button type="submit" disabled={creating || !newRoomName.trim()}>{creating ? '...' : 'Создать'}</button>
        </form>
      )}

      {loading && rooms.length === 0 && <div className="room-list-loading">Загрузка...</div>}
      {!loading && filtered.length === 0 && <div className="room-list-empty">{search ? 'Ничего не найдено' : 'Нет комнат'}</div>}

      <div className="room-items">
        {paged.map(room => (
          <div key={room.name} className={`room-item ${selectedRoom?.name === room.name ? 'selected' : ''}`}>
            <div className="room-item-main" onClick={() => handleRoomClick(room)}>
              <div className="room-item-info">
                <span className="room-item-name">{room.is_private && '🔒 '}{room.name}</span>
              </div>
              <span className="room-item-arrow">{selectedRoom?.name === room.name ? '▾' : '▸'}</span>
            </div>

            {selectedRoom?.name === room.name && (
              <div className="room-participants">
                {loadingParticipants ? (
                  <div className="room-participants-loading">Загрузка...</div>
                ) : participants && participants.length > 0 ? (
                  <ul className="room-participants-list">
                    {participants.map((p, i) => <li key={i} className="room-participant">👤 {p}</li>)}
                  </ul>
                ) : (
                  <div className="room-participants-empty">Пусто</div>
                )}
                <button className="room-join-btn" onClick={() => handleJoin(room)}>
                  {room.is_private ? '🔒 Войти' : 'Войти'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="room-pagination">
          <button disabled={safePage === 0} onClick={() => setPage(p => p - 1)}>‹</button>
          <span>{safePage + 1}/{totalPages}</span>
          <button disabled={safePage >= totalPages - 1} onClick={() => setPage(p => p + 1)}>›</button>
        </div>
      )}
    </div>
  )
}