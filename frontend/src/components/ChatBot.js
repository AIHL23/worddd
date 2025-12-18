import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../styles/ChatBot.css';

function ChatBot({ user, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: `Merhaba ${user.name}! 👋 Ben AI asistanınız. Size nasıl yardımcı olabilirim?`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/api/chat/message`, {
        studentId: user.studentId,
        message: inputValue
      });

      if (response.data.success) {
        const botMessage = {
          id: messages.length + 2,
          type: 'bot',
          text: response.data.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      const errorMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: error.response?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h3>🤖 AI Asistanı</h3>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>

      <div className="chatbot-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message-wrapper ${msg.type === 'user' ? 'user-message' : 'bot-message'}`}
          >
            <div className={`message ${msg.isError ? 'error' : ''}`}>
              {msg.type === 'bot' && <span className="bot-icon">🤖</span>}
              <p>{msg.text}</p>
              {msg.type === 'user' && <span className="user-icon">👤</span>}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message-wrapper bot-message">
            <div className="message loading">
              <span className="bot-icon">🤖</span>
              <div className="typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chatbot-input-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Bir soru sorunuz..."
          disabled={isLoading}
          className="chatbot-input"
        />
        <button type="submit" disabled={isLoading} className="send-btn">
          {isLoading ? '⏳' : '📤'}
        </button>
      </form>
    </div>
  );
}

export default ChatBot;
