import { useState } from 'react'
import { login } from '../../services/api'

export default function Login({ onLogin, showToast }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(username, password)
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
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
          {error && <div className="error-msg">{error}</div>}
        </form>
      </div>
    </div>
  )
}
