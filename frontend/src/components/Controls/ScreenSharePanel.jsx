export default function ScreenSharePanel({ screenQuality, onScreenQualityChange, isScreenSharing, onStartShare, onStopShare, onClose }) {
  return (
    <div className="screen-share-panel">
      <div className="panel-header">
        <h4>🖥️ Демонстрация экрана</h4>
        <button className="panel-close" onClick={onClose}>✕</button>
      </div>

      <div className="panel-body">
        <div className="settings-field">
          <label>Качество</label>
          <select value={screenQuality} onChange={e => onScreenQualityChange(e.target.value)}>
            <option value="low">Низкое (720p)</option>
            <option value="medium">Среднее (1080p)</option>
            <option value="high">Высокое (1440p)</option>
            <option value="ultra">Максимальное (4K)</option>
          </select>
        </div>

        <div className="panel-info">
          <div className="info-row">
            <span className="info-label">Статус</span>
            <span className={`info-value ${isScreenSharing ? 'live' : ''}`}>
              {isScreenSharing ? '● В эфире' : '○ Не активна'}
            </span>
          </div>
        </div>

        <div className="panel-actions">
          {!isScreenSharing ? (
            <button className="share-start-btn" onClick={() => { onStartShare(); onClose(); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              Начать демонстрацию
            </button>
          ) : (
            <button className="share-stop-btn" onClick={() => { onStopShare(); onClose(); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
              Остановить
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
