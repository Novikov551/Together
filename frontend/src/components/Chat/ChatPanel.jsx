import { useState, useRef, useEffect } from 'react'

export default function ChatPanel({ messages, onSend, onClose, soundEnabled, onToggleSound }) {
  const [text, setText] = useState('')
  const messagesRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text)
    setText('')
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h4>💬 Чат</h4>
        <div className="chat-header-actions">
          <label className="chat-sound-toggle" title={soundEnabled ? 'Звук включён' : 'Звук выключен'}>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={onToggleSound}
            />
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
            <span className="toggle-label">
              {soundEnabled ? '🔔' : '🔕'}
            </span>
          </label>
          <button className="panel-close" onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="chat-messages" ref={messagesRef}>
        {messages.length === 0 && (
          <div className="chat-empty">Сообщений пока нет</div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`chat-msg ${msg.isLocal ? 'local' : ''}`}>
            <div className="chat-msg-header">
              <span className="chat-msg-sender">{msg.sender}</span>
              <span className="chat-msg-time">{msg.time}</span>
            </div>
            <div className="chat-msg-text">{msg.text}</div>
          </div>
        ))}
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder="Сообщение..."
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={500}
        />
        <button type="submit" className="chat-send-btn" disabled={!text.trim()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>
    </div>
  )
}
