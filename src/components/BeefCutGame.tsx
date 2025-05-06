import { useState, useEffect, useRef } from 'react';

type GameState = 'ready' | 'playing' | 'result';

interface GameProps {
  userId: string;
  onSaveScore: (score: number) => Promise<void>;
}

export default function BeefCutGame({ userId, onSaveScore }: GameProps) {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [meatLength, setMeatLength] = useState(300); // 牛肉の初期サイズ
  const [currentPosition, setCurrentPosition] = useState(0);
  const [cutPosition, setCutPosition] = useState(0);
  const [score, setScore] = useState(0);
  const animationRef = useRef<number | null>(null);
  const seekbarRef = useRef<HTMLDivElement>(null);

  // ゲーム開始
  const startGame = () => {
    setGameState('playing');
    setMeatLength(300);
    setCurrentPosition(0);
    setCutPosition(0);
    setScore(0);
    startAnimation();
  };

  // シーカーバーのアニメーション
  const startAnimation = () => {
    let direction = 1;
    let position = 0;

    const animate = () => {
      position += 2 * direction;

      // 端に到達したら方向転換
      if (position >= 100 || position <= 0) {
        direction *= -1;
      }

      setCurrentPosition(position);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  // 肉を切る
  const cutMeat = () => {
    if (gameState !== 'playing') return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    setCutPosition(currentPosition);

    // スコア計算（50%からの差異に基づく）
    const accuracy = Math.abs(50 - currentPosition);
    const newScore = Math.max(100 - accuracy * 2, 0);
    setScore(newScore);

    // 結果画面へ
    setGameState('result');

    // スコア保存
    if (userId) {
      onSaveScore(newScore);
    }
  };

  // アニメーション停止
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // シーカーバーコンポーネント
  const Seekbar = () => (
    <div className="relative w-full h-12 bg-red-100 rounded-md my-8 overflow-hidden" ref={seekbarRef}>
      {/* 現在位置マーカー */}
      <div
        className="absolute top-0 h-full w-2 bg-red-600"
        style={{ left: `${currentPosition}%` }}
      ></div>

      {/* カットライン（結果表示時のみ） */}
      {gameState === 'result' && (
        <div
          className="absolute top-0 h-full w-0.5 bg-black"
          style={{ left: `${cutPosition}%` }}
        ></div>
      )}

      {/* 理想的な50%ライン（結果表示時のみ） */}
      {gameState === 'result' && (
        <div
          className="absolute top-0 h-full w-0.5 bg-green-500 opacity-70"
          style={{ left: `50%` }}
        ></div>
      )}
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">牛肉ぴったんこチャレンジ</h1>

      {gameState === 'ready' && (
        <div className="text-center">
          <p className="mb-4">牛肉をぴったり半分に切ってください！</p>
          <button
            onClick={startGame}
            className="start-button"
          >
            スタート
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="relative">
          <div
            className="bg-red-400 mx-auto rounded-md"
            style={{ width: `${meatLength}px`, height: '60px' }}
          ></div>

          <Seekbar />

          <button
            onClick={cutMeat}
            className="cut-button"
          >
            <i className="fas fa-utensils"></i>
          </button>
        </div>
      )}

      {gameState === 'result' && (
        <div className="text-center">
          <div
            className="bg-red-400 mx-auto rounded-md relative mb-4"
            style={{ width: `${meatLength}px`, height: '60px' }}
          >
            {/* カット線を表示 */}
            <div
              className="absolute top-0 h-full w-0.5 bg-white"
              style={{ left: `${cutPosition}%` }}
            ></div>
          </div>

          <Seekbar />

          <div className="mt-6">
            <h2 className="text-xl font-bold">結果発表</h2>
            <p className="text-2xl mt-2">スコア: {score}点</p>
            <p className="text-sm mt-1">
              {score >= 90 ? '素晴らしい！ほぼ完璧です！' :
               score >= 70 ? 'あと少し！惜しい！' :
               score >= 50 ? 'まあまあです。もう一度チャレンジしてみましょう！' :
               'もっと練習しましょう！'}
            </p>

            <button
              onClick={startGame}
              className="start-button mt-6"
            >
              もう一度チャレンジ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
