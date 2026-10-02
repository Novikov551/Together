import { useState } from 'react'

export default function JoinModal({ roomName, isPrivate, defaultName, onConfirm, onCancel }) {
  const [name, setName] = useState(defaultName || '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Введите имя')
      return
    }
    if (isPrivate && !password.trim()) {
      setError('Введите пароль')
      return
    }
    setError('')
    onConfirm(name.trim(), isPrivate ? password : null)
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isPrivate ? '🔒' : '🌐'} {roomName}</h3>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <input
            type="text"
            placeholder="Ваше имя"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
          {isPrivate && (
            <input
              type="password"
              placeholder="Пароль комнаты"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          )}
          {error && <div className="modal-error">{error}</div>}
          <button type="submit" className="modal-submit">Подключиться</button>
        </form>
      </div>
    </div>
  )
}