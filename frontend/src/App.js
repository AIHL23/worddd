import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import AdminPanel from './pages/AdminPanel';
import ChatBot from './components/ChatBot';

function App() {
  const [formData, setFormData] = useState({
    studentId: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Input değişikliği için tek handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/api/auth/login`, {
        studentId: formData.studentId,
        password: formData.password
      });
      
      setUser(response.data.user);
      setMessage('✅ Giriş başarılı!');
      
      if (response.data.user.isFirstLogin) {
        setTimeout(() => {
          setShowChangePassword(true);
          setMessage('');
        }, 1500);
      }
      
    } catch (error) {
      if (error.response) {
        setMessage('❌ ' + error.response.data.message);
      } else {
        setMessage('❌ Sunucu bağlantı hatası!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Şifre Değiştirme Bileşeni
  const ChangePasswordForm = () => {
    const [passwords, setPasswords] = useState({
      newPassword: '',
      confirmPassword: ''
    });

    const handlePasswordChange = (e) => {
      const { name, value } = e.target;
      setPasswords(prevState => ({
        ...prevState,
        [name]: value
      }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (passwords.newPassword !== passwords.confirmPassword) {
        setMessage('❌ Şifreler eşleşmiyor!');
        return;
      }
      
      if (passwords.newPassword.length < 6) {
        setMessage('❌ Şifre en az 6 karakter olmalı!');
        return;
      }

      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        await axios.post(`${apiUrl}/api/auth/change-password`, {
          studentId: user.studentId,
          newPassword: passwords.newPassword
        });
        
        setMessage('✅ Şifre başarıyla değiştirildi!');
        setTimeout(() => {
          setShowChangePassword(false);
        }, 2000);
      } catch (error) {
        setMessage('❌ Şifre değiştirme hatası!');
      }
    };

    return (
      <div className="login-container">
        <div className="login-header">
          <h2>🔐 Şifre Değiştir</h2>
          <p>İlk girişte şifrenizi değiştirmeniz gerekiyor</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Yeni Şifre</label>
            <input
              type="password"
              name="newPassword"
              placeholder="En az 6 karakter"
              value={passwords.newPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>
          
          <div className="input-group">
            <label>Şifre Tekrar</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Şifreyi tekrar yazın"
              value={passwords.confirmPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>
          
          <button type="submit">
            🚀 Şifreyi Değiştir
          </button>
        </form>
        
        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>
    );
  };

  // Ana Giriş Bileşeni
  const LoginForm = () => (
    <div className="login-container">
      <div className="login-header">
        <h2>🎓 Öğrenci Girişi</h2>
        <p>Sisteme hoş geldiniz</p>
      </div>
      
      <form onSubmit={handleLogin}>
        <div className="input-group">
          <label>Öğrenci Numarası</label>
          <input
            type="text"
            name="studentId"
            placeholder="2024001"
            value={formData.studentId}
            onChange={handleInputChange}
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="input-group">
          <label>Şifre</label>
          <input
            type="password"
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleInputChange}
            required
            disabled={isLoading}
          />
        </div>
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? '🔄 Giriş Yapılıyor...' : '🚀 Giriş Yap'}
        </button>
      </form>
      
      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
      
      <div className="login-footer">
        <p>Şifrenizi mi unuttunuz? <a href="#help">Yardım</a></p>
      </div>
    </div>
  );

  // Logout function
  const handleLogout = () => {
    setUser(null);
    setFormData({ studentId: '', password: '' });
    setMessage('');
    setShowChangePassword(false);
  };

  // Home/Dashboard for logged in students
  const HomePage = () => (
    <div className="home-container">
      <div className="home-header">
        <h1>🎓 Öğrenci Paneli</h1>
        <div className="header-buttons">
          <button onClick={() => setShowChat(true)} className="chat-btn">💬 AI ile Sohbet Et</button>
          <button onClick={handleLogout} className="logout-btn">🚪 Çıkış</button>
        </div>
      </div>
      <div className="home-content">
        <div className="welcome-card">
          <h2>Merhaba, {user.name}! 👋</h2>
          <p><strong>Öğrenci Numarası:</strong> {user.studentId}</p>
          <p><strong>Sınıfı:</strong> {user.class}</p>
          <p><strong>Puanları:</strong> {user.points}</p>
        </div>
        <p className="info-text">Kütüphaneye gitmek için <a href="#library">Buraya tıklayın</a></p>
      </div>
      {showChat && <ChatBot user={user} onClose={() => setShowChat(false)} />}
    </div>
  );

  return (
    <div className={`App ${user && user.role === 'admin' ? 'admin-mode' : ''}`}>
      {user && user.role === 'admin' ? (
        <AdminPanel onLogout={handleLogout} />
      ) : showChangePassword ? (
        <ChangePasswordForm />
      ) : user ? (
        <HomePage />
      ) : (
        <LoginForm />
      )}
    </div>
  );
}

export default App;