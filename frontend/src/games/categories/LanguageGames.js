import React from 'react';

export default function LanguageGames() {
  return (
    <div className="game-container">
      <h2>🌍 Dil Oyunları</h2>
      <div className="game-list">
        <div className="game-item">
          <h3>📝 Kelime Öğren</h3>
          <p>Yeni kelimeler öğren ve puan kazanırken hafızanı güçlendir.</p>
        </div>
        <div className="game-item">
          <h3>🔗 Eşleştir</h3>
          <p>Kelimeleri anlamlarıyla eşleştir ve hızını artır.</p>
        </div>
        <div className="game-item">
          <h3>✍️ İmlâ Egzersizi</h3>
          <p>Doğru yazımı öğren ve dikkatini geliştir.</p>
        </div>
      </div>
    </div>
  );
}
