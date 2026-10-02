import { useState, useCallback } from 'react'
import { useSettings } from './hooks/useSettings'
import Login from './components/Login/Login'
import Lobby from './components/Lobby/Lobby'
import Call from './components/Call/Call'
import Toast from './components/Toast/Toast'

export default function App() {
  const [screen, setScreen] = useState('login')
  const [sessionToken, setSessionToken] = useState('')
  const [toast, setToast] = useState(null)
  const { settings, updateSetting, updateSettings } = useSettings()

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const handleLogin = useCallback((token) => {
    setSessionToken(token)
    setScreen('lobby')
  }, [])

  const handleJoin = useCallback(() => {
    setScreen('call')
  }, [])

  const handleLeave = useCallback(() => {
    setScreen('lobby')
  }, [])

  return (
    <>
      {screen === 'login' && <Login onLogin={handleLogin} showToast={showToast} />}
      {screen === 'lobby' && (
        <Lobby
          sessionToken={sessionToken}
          onJoin={handleJoin}
          showToast={showToast}
          settings={settings}
          updateSetting={updateSetting}
          updateSettings={updateSettings}
        />
      )}
      {screen === 'call' && (
        <Call
          sessionToken={sessionToken}
          onLeave={handleLeave}
          showToast={showToast}
          settings={settings}
          updateSetting={updateSetting}
          updateSettings={updateSettings}
        />
      )}
      {toast && <Toast message={toast} />}
    </>
  )
}
