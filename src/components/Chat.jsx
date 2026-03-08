import { useState, useRef, useEffect } from 'react'
import '../styles/Chat.css'

function Chat() {
  const messageIdRef = useRef(2)
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Hello! I\'m your AI agent. How can I help you today?',
      sender: 'agent',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!inputValue.trim()) return

    const userId = String(messageIdRef.current++)
    const agentId = String(messageIdRef.current++)

    const userMessage = {
      id: userId,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    setTimeout(() => {
      const agentResponse = {
        id: agentId,
        text: generateAgentResponse(inputValue),
        sender: 'agent',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, agentResponse])
      setIsLoading(false)
    }, 1000)
  }

  const generateAgentResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase()

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'Hello! It\'s great to chat with you. What would you like to do today?'
    } else if (lowerMessage.includes('automation')) {
      return 'I can help you set up automations! You can manage tasks like email backups, data syncing, and report generation. Would you like to create a new automation?'
    } else if (lowerMessage.includes('help')) {
      return 'I can assist you with:\n• Creating and managing automations\n• Answering questions\n• Providing recommendations\n• Managing your tasks\n\nWhat would you like help with?'
    } else if (lowerMessage.includes('time')) {
      return `The current time is ${new Date().toLocaleTimeString()}. Need any scheduling assistance?`
    } else if (lowerMessage.includes('thanks') || lowerMessage.includes('thank you')) {
      return 'You\'re welcome! Feel free to ask me anything else.'
    } else {
      return `I understand you're asking about "${userMessage}". I'm here to help! Could you provide more details about what you need?`
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        text: 'Hello! I\'m your AI agent. How can I help you today?',
        sender: 'agent',
        timestamp: new Date()
      }
    ])
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>💬 Agent Chat</h2>
        <p>Chat with your AI assistant</p>
      </div>

      <div className="messages-area">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message message-${message.sender}`}
          >
            <div className="message-avatar">
              {message.sender === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              <div className="message-text">{message.text}</div>
              <span className="message-time">
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message message-agent">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="chat-input"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="btn-send"
          >
            ✈️ Send
          </button>
        </div>
        <button onClick={clearChat} className="btn-clear">
          🗑 Clear Chat
        </button>
      </div>
    </div>
  )
}

export default Chat
