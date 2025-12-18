import React from 'react';

function AdminPanel({ onLogout }) {
  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🔧 Yönetici Paneli</h1>
        {onLogout && (
          <button onClick={onLogout} className="logout-btn">
            🚪 Çıkış
          </button>
        )}
      </div>
      <div className="admin-content-full">
        <p style={{ textAlign: 'center', padding: '40px', fontSize: '16px' }}>
          Admin paneli vanilla JavaScript frontend'de mevcuttur. 
          <br />
          Lütfen sayfayı yenileyin.
        </p>
      </div>
    </div>
  );
}

export default AdminPanel;
