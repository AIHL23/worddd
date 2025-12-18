import React from 'react';

export default function ScienceGames() {
  return (
    <div className="game-container">
      <h2>🔬 Fen Oyunları</h2>
      <div className="game-list">
        <div className="game-item">
          <h3>🧬 Biyoloji</h3>
          <p>Canlılar âlemi ve biyolojik süreçleri öğrenirken eğlen.</p>
        </div>
        <div className="game-item">
          <h3>⚛️ Fizik</h3>
          <p>Fizik yasaları eğlenceli oyunlarla keşfet.</p>
        </div>
        <div className="game-item">
          <h3>🧪 Kimya</h3>
          <p>Kimyasal reaksiyonları ve elementleri tanı.</p>
        </div>
      </div>
    </div>
  );
}
