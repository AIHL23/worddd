import React from 'react';

export default function MathGames() {
  return (
    <div className="game-container">
      <h2>🔢 Matematik Oyunları</h2>
      <div className="game-list">
        <div className="game-item">
          <h3>➕ Dört İşlem</h3>
          <p>Toplama, çıkarma, çarpma ve bölme işlemleriyle pratiş yap.</p>
        </div>
        <div className="game-item">
          <h3>📐 Geometri</h3>
          <p>Şekiller ve açıları tanıyarak geometri öğren.</p>
        </div>
        <div className="game-item">
          <h3>🧩 Mantık Oyunları</h3>
          <p>Mantıksal düşünmeyi geliştir ve problemleri çöz.</p>
        </div>
      </div>
    </div>
  );
}
