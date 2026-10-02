import { useState } from 'react'

export default function PasswordModal({ roomName, onConfirm, onCancel }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('Введите пароль')
      return
    }
    setError('')
    onConfirm(password)
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🔒 {roomName}</h3>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <p className="modal-hint">Эта комната приватная. Введите пароль.</p>
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
          />
          {error && <div className="modal-error">{error}</div>}
          <button type="submit" className="modal-submit">Подключиться</button>
        </form>
      </div>
    </div>
  )
}