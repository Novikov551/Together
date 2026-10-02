export default function CameraPanel({ cameraQuality, onCameraQualityChange, isCamOn, onToggleCam, onClose }) {
  return (
    <div className="screen-share-panel">
      <div className="panel-header">
        <h4>📷 Камера</h4>
        <button className="panel-close" onClick={onClose}>✕</button>
      </div>

      <div className="panel-body">
        <div className="settings-field">
          <label>Качество</label>
          <select value={cameraQuality} onChange={e => onCameraQualityChange(e.target.value)}>
            <option value="low">Низкое (360p)</option>
            <option value="medium">Среднее (720p)</option>
            <option value="high">Высокое (1080p)</option>
          </select>
        </div>

        <div className="panel-info">
          <div className="info-row">
            <span className="info-label">Статус</span>
            <span className={`info-value ${isCamOn ? 'live' : ''}`}>
              {isCamOn ? '● Включена' : '○ Выключена'}
            </span>
          </div>
        </div>

        <div className="panel-actions">
          <button
            className={isCamOn ? 'share-stop-btn' : 'share-start-btn'}
            onClick={() => { onToggleCam(); onClose(); }}
          >
            {isCamOn ? 'Выключить камеру' : 'Включить камеру'}
          </button>
        </div>
      </div>
    </div>
  )
}