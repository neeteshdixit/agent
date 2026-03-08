import { useState } from 'react'
import '../styles/Automation.css'

function Automation() {
  const [automations, setAutomations] = useState([
    { id: '1', name: 'Email Backup', description: 'Automated email backup every hour', status: 'idle' },
    { id: '2', name: 'Data Sync', description: 'Sync data across devices', status: 'idle' },
    { id: '3', name: 'Report Generation', description: 'Generate monthly reports', status: 'idle' },
  ])
  const [newAutomation, setNewAutomation] = useState('')

  const runAutomation = (id) => {
    setAutomations(prev =>
      prev.map(auto =>
        auto.id === id ? { ...auto, status: 'running' } : auto
      )
    )
    
    setTimeout(() => {
      setAutomations(prev =>
        prev.map(auto =>
          auto.id === id ? { ...auto, status: 'completed' } : auto
        )
      )
    }, 2000)
  }

  const stopAutomation = (id) => {
    setAutomations(prev =>
      prev.map(auto =>
        auto.id === id ? { ...auto, status: 'idle' } : auto
      )
    )
  }

  const addAutomation = () => {
    if (newAutomation.trim()) {
      setAutomations(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          name: newAutomation,
          description: 'New automation task',
          status: 'idle'
        }
      ])
      setNewAutomation('')
    }
  }

  const deleteAutomation = (id) => {
    setAutomations(prev => prev.filter(auto => auto.id !== id))
  }

  return (
    <div className="automation-container">
      <div className="automation-header">
        <h2>🤖 Automation Control</h2>
        <p>Manage and monitor automated tasks</p>
      </div>

      <div className="automation-input-section">
        <input
          type="text"
          placeholder="Enter new automation task..."
          value={newAutomation}
          onChange={(e) => setNewAutomation(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addAutomation()}
          className="automation-input"
        />
        <button onClick={addAutomation} className="btn-add">Add Task</button>
      </div>

      <div className="automations-list">
        {automations.length === 0 ? (
          <div className="empty-state">
            <p>No automations yet. Create one to get started!</p>
          </div>
        ) : (
          automations.map(automation => (
            <div key={automation.id} className={`automation-card status-${automation.status}`}>
              <div className="card-header">
                <h3>{automation.name}</h3>
                <span className={`status-badge ${automation.status}`}>
                  {automation.status === 'running' ? '⏳' : automation.status === 'completed' ? '✅' : '⭕'}
                  {' '}{automation.status}
                </span>
              </div>
              <p className="card-description">{automation.description}</p>
              <div className="card-actions">
                {automation.status === 'idle' && (
                  <button
                    onClick={() => runAutomation(automation.id)}
                    className="btn-run"
                  >
                    ▶ Run
                  </button>
                )}
                {automation.status === 'running' && (
                  <button
                    onClick={() => stopAutomation(automation.id)}
                    className="btn-stop"
                  >
                    ⏹ Stop
                  </button>
                )}
                {automation.status === 'completed' && (
                  <button
                    onClick={() => stopAutomation(automation.id)}
                    className="btn-reset"
                  >
                    ↻ Reset
                  </button>
                )}
                <button
                  onClick={() => deleteAutomation(automation.id)}
                  className="btn-delete"
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Automation
