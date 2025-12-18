import React from 'react';

export default function GeneralGames() {
  return (
    <div className="game-container">
      <h2>🎨 Genel Oyunlar</h2>
      <div className="game-list">
        <div className="game-item">
          <h3>🧩 Bulmacalar</h3>
          <p>Farklı bulmacaları çözerek zekanı geliştir.</p>
        </div>
        <div className="game-item">
          <h3>🧠 Hafıza Oyunu</h3>
          <p>Hafızanı güçlendir ve hızlı düşün.</p>
        </div>
        <div className="game-item">
          <h3>🏆 Genel Bilgi</h3>
          <p>Çeşitli konulardaki bilgini test et ve geliştir.</p>
        </div>
      </div>
    </div>
  );
}
