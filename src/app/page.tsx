'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faScissors } from '@fortawesome/free-solid-svg-icons'

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// お肉を描画するコンポーネント
const BeefCanvas = ({ gameState, setGameState }: { gameState: string, setGameState: (state: string) => void }) => {  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [seekBarPosition, setSeekBarPosition] = useState(0);
  const directionRef = useRef<boolean>(true); // true: 右向き, false: 左向き
  const [cuttingInProgress, setCuttingInProgress] = useState(false);
  const [cutPosition, setCutPosition] = useState<number | null>(null);
  const [buttonFlash, setButtonFlash] = useState(false);
  const [meatSplit, setMeatSplit] = useState(false);
  const [leftMeatRatio, setLeftMeatRatio] = useState(0);
  const [rightMeatRatio, setRightMeatRatio] = useState(0);
  const [resultWeight, setResultWeight] = useState(0);

  // 最初の一回だけお肉を描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスのサイズ設定
    canvas.width = 640;
    canvas.height = 320;

    // お肉を描画（一度だけ）
    drawBeef(ctx, canvas.width, canvas.height);
  }, []);

  // シークバーのアニメーションを開始（playingの場合のみ）
  useEffect(() => {
    if (gameState === 'playing') {
      startSeekBarAnimation();
    }

    // クリーンアップ
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState]);

  // シークバーのアニメーションを開始する関数
  const startSeekBarAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;

    // フレームごとの移動量を計算 (1.5秒で片道)
    // 60fps を想定した場合、90フレームで片道になるようにする
    const frameRate = 60; // 想定フレームレート
    const movementDuration = 1.5; // 秒
    const totalFrames = frameRate * movementDuration;
    const speed = width / totalFrames;

    // アニメーションフレーム
    const animateSeekBar = () => {
      // シークバーの位置を更新
      setSeekBarPosition(prevPosition => {
        let newPosition = prevPosition;

        if (directionRef.current) {
          // 右向きに移動
          newPosition += speed;
          if (newPosition >= width) {
            newPosition = width;
            directionRef.current = false; // 左向きに切り替え
          }
        } else {
          // 左向きに移動
          newPosition -= speed;
          if (newPosition <= 0) {
            newPosition = 0;
            directionRef.current = true; // 右向きに切り替え
          }
        }

        return newPosition;
      });

      // 次のフレームをリクエスト
      animationFrameRef.current = requestAnimationFrame(animateSeekBar);
    };

    // アニメーションを開始
    animationFrameRef.current = requestAnimationFrame(animateSeekBar);
  };

  // 肉を切る処理
  const handleCut = () => {
    // ボタンをフラッシュさせる
    setButtonFlash(true);
    setTimeout(() => setButtonFlash(false), 300);

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // カットアニメーションを開始
    startCutAnimation();
  };

  // カットアニメーション
  const startCutAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let currentY = 0;
    const height = canvas.height;
    const cutSpeed = 8; // 1フレームあたりの移動ピクセル数
    const cutLine: Array<{x: number, y: number}> = [];

    // カットアニメーションフレーム
    const animateCut = () => {
      // 現在のシークバー位置でY座標を増加
      const x = seekBarPosition || 0;
      currentY += cutSpeed;

      // 軌跡を記録
      cutLine.push({x, y: currentY});

      // 切断線を描画
      ctx.beginPath();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.moveTo(x, 0);
      for (const point of cutLine) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();

      // 下端に到達したらアニメーション終了
      if (currentY >= height) {
        // 肉を分割して結果表示
        splitMeat();
        return;
      }

      // 次のフレームをリクエスト
      animationFrameRef.current = requestAnimationFrame(animateCut);
    };

    // カットアニメーションを開始
    animationFrameRef.current = requestAnimationFrame(animateCut);
  };

  // 肉を分割する処理
  const splitMeat = () => {
    // カット位置を基に左右の割合を計算
    const canvas = canvasRef.current;
    if (!canvas) return;

    const totalWidth = canvas.width;
    const cutPos = cutPosition || 0;

    // 左側と右側の肉の割合を計算
    const leftRatio = cutPos / totalWidth;
    const rightRatio = 1 - leftRatio;

    setLeftMeatRatio(leftRatio);
    setRightMeatRatio(rightRatio);

    // 小さい方の割合を計算（1kgの肉を想定）
    const smallerRatio = Math.min(leftRatio, rightRatio);
    const weight = Math.round(smallerRatio * 1000 * 10) / 10; // 小数点第1位で四捨五入
    setResultWeight(weight);

    // 分割アニメーションの開始
    setMeatSplit(true);

    // ゲーム状態を結果に変更
    setTimeout(() => {
      setGameState('result');
    }, 1000);
  };

  // お肉を描画する関数
  const drawBeef = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // お肉の色
    ctx.fillStyle = '#FF8C94';
    ctx.strokeStyle = '#E56A77';
    ctx.lineWidth = 2;

    // パスの開始
    ctx.beginPath();

    // 下線の開始点（左端）
    const startX = 0; // canvasの左端
    const endX = width; // canvasの右端
    const bottomY = height; // canvasの下端

    // 下線の左端から開始
    ctx.moveTo(startX, bottomY);

    // ランダムな曲線を作成するためのポイント数
    const numPoints = 5;
    const points = [];

    // ランダムな中間点を生成
    for (let i = 0; i < numPoints; i++) {
      const x = startX + ((endX - startX) * (i + 1)) / (numPoints + 1);
      // 上部の曲線はランダムな高さに
      const y = bottomY - Math.random() * (bottomY * 0.8);
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
    <div className="relative w-full" style={{ width: '640px', maxWidth: '100%' }}>
      {/* シークバー（円形）- canvasの上に配置 */}
      {gameState === 'playing' && !cuttingInProgress && (
        <div
          className="absolute top-0 z-10 rounded-full bg-gray-500"
          style={{
            width: '10px',
            height: '10px',
            left: `${seekBarPosition}px`,
            transform: 'translateX(-50%)'
          }}
        />
      )}

      <canvas
        ref={canvasRef}
        className="w-full h-64 mx-auto rounded"
        style={{ width: '640px', height: '320px', maxWidth: '100%' }}
      />

      {/* カットボタン */}
      {gameState === 'playing' && !cuttingInProgress && (
        <button
          className={`mt-4 w-12 h-12 flex items-center justify-center bg-gray-200 border border-gray-300 shadow-md absolute left-1/2 transform -translate-x-1/2 ${buttonFlash ? 'bg-yellow-300' : ''}`}
          onClick={handleCut}
          style={{
            transition: 'all 0.1s ease'
          }}
        >
          <FontAwesomeIcon icon={faScissors} className="text-gray-700" size="lg" />
        </button>
      )}

      {/* 結果の重さ表示 */}
      {gameState === 'result' && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center bg-white bg-opacity-80 p-4 rounded shadow-lg z-20">
          <p className="text-xl font-bold">結果</p>
          <p className="text-lg">小さい方の肉: {resultWeight}g</p>
          <p className="text-md">分割比率: {Math.round(leftMeatRatio * 100)}% : {Math.round(rightMeatRatio * 100)}%</p>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const [gameState, setGameState] = useState('waiting') // waiting, playing, result

  return (
    <div className="flex justify-center items-center w-full">
      <main className="flex min-h-screen flex-col items-center justify-center p-4" style={{ minWidth: '640px', maxWidth: '1200px', width: '100%' }}>
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
          <div className="w-full mx-auto">
            <p className="text-center mb-4">肉をぴったり半分に切ろう！</p>
            <div className="flex justify-center">
              <BeefCanvas gameState={gameState} setGameState={setGameState} />
            </div>
          </div>
        )}

        {gameState === 'result' && (
          <div className="w-full max-w-lg text-center mx-auto">
            <p className="text-xl mb-4">結果発表</p>
            <div className="flex justify-center">
              <BeefCanvas gameState={gameState} setGameState={setGameState} />
            </div>
            <button
              className="px-6 py-3 text-lg bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 mt-4"
              onClick={() => setGameState('waiting')}
            >
              もう一度チャレンジ
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
