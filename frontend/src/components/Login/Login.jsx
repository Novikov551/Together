import { useState, useEffect } from 'react'
import { login } from '../../services/api'

const STORAGE_KEY = 'together_credentials'

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveCredentials(username, password) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ username, password }))
}

function clearCredentials() {
  localStorage.removeItem(STORAGE_KEY)
}

export default function Login({ onLogin, showToast }) {
  const saved = loadSaved()
  const [username, setUsername] = useState(saved?.username || '')
  const [password, setPassword] = useState(saved?.password || '')
  const [remember, setRemember] = useState(!!saved)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(username, password)
      if (remember) {
        saveCredentials(username, password)
      } else {
        clearCredentials()
      }
      onLogin(data.session_token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen login-screen">
      <div className="card login-card">
        <div className="logo">
          <div className="logo-icon">📹</div>
          <h1>Together</h1>
          <p>Групповые видеозвонки</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Логин</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Введите логин"
              autoFocus
            />
          </div>
          <div className="field">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Введите пароль"
            />
          </div>
          <label className="toggle-row compact" style={{ cursor: 'pointer' }}>
            <span>Запомнить меня</span>
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
            />
          </label>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
          {error && <div className="error-msg">{error}</div>}
        </form>
      </div>
    </div>
  )
}