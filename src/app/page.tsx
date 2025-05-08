'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// お肉を描画するコンポーネント
const BeefCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // キャンバスの初期化とお肉の描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスのサイズ設定
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // お肉の描画
    drawBeef(ctx, canvas.width, canvas.height);
  }, []);

  // お肉を描画する関数
  const drawBeef = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // お肉の色
    ctx.fillStyle = '#FF8C94';
    ctx.strokeStyle = '#E56A77';
    ctx.lineWidth = 2;

    // パスの開始
    ctx.beginPath();

    // 下線の開始点（左端）
    const startX = width * 0.25; // 全体の横幅の50%にするため、左端は25%の位置から始める
    const endX = width * 0.75;   // 右端は75%の位置
    const bottomY = height * 0.8; // 下線のY座標（キャンバスの80%の位置）

    // 下線の左端から開始
    ctx.moveTo(startX, bottomY);

    // ランダムな曲線を作成するためのポイント数
    const numPoints = 5;
    const points = [];

    // ランダムな中間点を生成
    for (let i = 0; i < numPoints; i++) {
      const x = startX + ((endX - startX) * (i + 1)) / (numPoints + 1);
      // 上部の曲線はランダムな高さに
      const y = bottomY - Math.random() * (bottomY * 0.6);
      points.push({ x, y });
    }

    // 曲線を描く（複数の弧を持つランダムな曲線）
    ctx.quadraticCurveTo(points[0].x - 30, bottomY - 60, points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }

    // 最後のポイントから右端へ
    ctx.quadraticCurveTo(
      points[points.length - 1].x,
      points[points.length - 1].y,
      endX,
      bottomY
    );

    // 下線を描画して閉じる
    ctx.lineTo(endX, bottomY);
    ctx.lineTo(startX, bottomY);

    // お肉を塗りつぶす
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-64 mx-auto border border-gray-300 rounded"
      style={{ maxWidth: '50%' }}
    />
  );
};

export default function Home() {
  const [gameState, setGameState] = useState('waiting') // waiting, playing, result

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-center mb-8">牛肉ぴったんこチャレンジ</h1>

      {gameState === 'waiting' && (
        <button
          className="px-6 py-3 text-lg bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300"
          onClick={() => setGameState('playing')}
        >
          ゲームスタート
        </button>
      )}

      {gameState === 'playing' && (
        <div className="w-full max-w-lg">
          <p className="text-center mb-4">肉をぴったり半分に切ろう！</p>
          <div className="flex justify-center">
            <BeefCanvas />
          </div>
        </div>
      )}

      {gameState === 'result' && (
        <div className="w-full max-w-lg text-center">
          <p className="text-xl mb-4">結果</p>
          <button
            className="px-6 py-3 text-lg bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 mt-4"
            onClick={() => setGameState('waiting')}
          >
            もう一度チャレンジ
          </button>
        </div>
      )}
    </main>
  )
}
