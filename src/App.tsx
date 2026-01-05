import { useState } from 'react'
import './App.css'
import Automation from './components/Automation'
import Chat from './components/Chat'

type Tab = 'automation' | 'chat'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('automation')

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>🚀 Agent Dashboard</h1>
          <p>Your AI-powered automation and chat assistant</p>
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={`nav-button ${activeTab === 'automation' ? 'active' : ''}`}
          onClick={() => setActiveTab('automation')}
        >
          <span className="nav-icon">🤖</span>
          Automation
        </button>
        <button
          className={`nav-button ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <span className="nav-icon">💬</span>
          Chat
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'automation' && <Automation />}
        {activeTab === 'chat' && <Chat />}
      </main>

      <footer className="app-footer">
        <p>© 2026 Agent Dashboard. Powered by React + TypeScript + Vite</p>
      </footer>
    </div>
  )
}

export default App
