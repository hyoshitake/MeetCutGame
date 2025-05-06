import { useState, useEffect, useRef, memo } from 'react';

type GameState = 'ready' | 'playing' | 'result';

interface GameProps {
  userId: string;
  onSaveScore: (score: number) => Promise<void>;
}

// シーカーバーをメモ化してリフレッシュを最適化
const MemoizedSeekbar = memo(({ currentPosition, cutPosition, gameState, seekbarRef }: {
  currentPosition: number;
  cutPosition: number;
  gameState: GameState;
  seekbarRef: React.RefObject<HTMLDivElement>;
}) => (
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
));

// 表示名を設定（デバッグ用）
MemoizedSeekbar.displayName = 'MemoizedSeekbar';

export default function BeefCutGame({ userId, onSaveScore }: GameProps) {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [meatLength, setMeatLength] = useState(300); // 牛肉の初期サイズ
  const [currentPosition, setCurrentPosition] = useState(0);
  const [cutPosition, setCutPosition] = useState(0);
  const [score, setScore] = useState(0);
  const animationRef = useRef<number | null>(null);
  const seekbarRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [cutResult, setCutResult] = useState<{
    leftRatio: number;
    rightRatio: number;
    smallerGrams: number;
  } | null>(null);

  // キャンバスのサイズを設定
  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current) {
        // 横幅は画面の50%
        const width = Math.min(window.innerWidth * 0.5, 500);
        const height = width * 0.6; // アスペクト比を保つ

        setCanvasSize({ width, height });
        canvasRef.current.width = width;
        canvasRef.current.height = height;

        // プレイ中なら肉を再描画
        if (gameState === 'playing') {
          drawMeat();
        } else if (gameState === 'result' && cutPosition) {
          drawCutMeat();
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [gameState]);

  // 肉の絵を描画する関数
  const drawMeat = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 肉の色
    ctx.fillStyle = '#FF6347';
    ctx.strokeStyle = '#8B3A3A';
    ctx.lineWidth = 2;

    // 下線のY座標（キャンバスの下から30%の位置）
    const baselineY = canvas.height * 0.7;

    // パスの開始
    ctx.beginPath();

    // 左下点から開始
    ctx.moveTo(0, baselineY);

    // ランダムな曲線を生成
    const numPoints = 5 + Math.floor(Math.random() * 4); // 5〜8個の制御点
    const pointsX = [];
    const pointsY = [];

    // ランダムな制御点を生成
    for (let i = 0; i < numPoints; i++) {
      pointsX.push(canvas.width * (i / (numPoints - 1)));
      // 下線より上のランダムな高さ
      const maxHeight = baselineY * 0.8;
      pointsY.push(baselineY - (Math.random() * maxHeight));
    }

    // 最初と最後の点は下線に合わせる
    pointsY[0] = baselineY;
    pointsY[numPoints - 1] = baselineY;

    // 複数の弧を持つ曲線を描く
    for (let i = 0; i < numPoints - 1; i++) {
      const cpX1 = pointsX[i] + (pointsX[i+1] - pointsX[i]) / 3;
      const cpY1 = pointsY[i] - Math.random() * 50;

      const cpX2 = pointsX[i] + 2 * (pointsX[i+1] - pointsX[i]) / 3;
      const cpY2 = pointsY[i+1] - Math.random() * 50;

      ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, pointsX[i+1], pointsY[i+1]);
    }

    // 下線を描く（右から左へ）
    ctx.lineTo(canvas.width, baselineY);
    ctx.lineTo(0, baselineY);

    // 塗りつぶし
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  // 切った肉を描画する関数
  const drawCutMeat = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 肉の色
    ctx.fillStyle = '#FF6347';
    ctx.strokeStyle = '#8B3A3A';
    ctx.lineWidth = 2;

    // 下線のY座標（キャンバスの下から30%の位置）
    const baselineY = canvas.height * 0.7;

    // 切れ目の位置
    const cutX = (cutPosition / 100) * canvas.width;

    // 分割後の肉片を少し離す
    const gap = 10; // 隙間のピクセル数
    const leftMeatEndX = cutX - gap/2;
    const rightMeatStartX = cutX + gap/2;

    // 肉の高さを保持する
    const meatHeight = canvas.height * 0.25; // 肉の最大高さの目安

    // 左側の肉片
    ctx.beginPath();
    ctx.moveTo(0, baselineY);
    ctx.lineTo(leftMeatEndX, baselineY);
    // 上部のランダムな曲線
    const leftMeatTopY = baselineY - Math.random() * meatHeight;
    ctx.lineTo(leftMeatEndX, leftMeatTopY);
    ctx.lineTo(0, baselineY - Math.random() * meatHeight);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 右側の肉片
    ctx.beginPath();
    ctx.moveTo(rightMeatStartX, baselineY);
    ctx.lineTo(canvas.width, baselineY);
    // 上部のランダムな曲線
    const rightMeatTopY = baselineY - Math.random() * meatHeight;
    ctx.lineTo(canvas.width, baselineY - Math.random() * meatHeight);
    ctx.lineTo(rightMeatStartX, rightMeatTopY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 肉の割合を計算
    const leftRatio = leftMeatEndX / canvas.width;
    const rightRatio = (canvas.width - rightMeatStartX) / canvas.width;

    // 小さい方の割合を見つける
    const smallerRatio = Math.min(leftRatio, rightRatio);

    // 1kgのグラム数（1000g）に掛け算して、グラム数を計算（小数点第二で四捨五入）
    const smallerGrams = Math.round(smallerRatio * 1000 * 10) / 10;

    // 結果を保存
    setCutResult({
      leftRatio,
      rightRatio,
      smallerGrams
    });
  };

  // ゲーム開始
  const startGame = () => {
    setGameState('playing');
    setMeatLength(300);
    setCurrentPosition(0);
    setCutPosition(0);
    setScore(0);
    setCutResult(null);

    // setTimeout を使って描画が確実に実行されるようにする
    setTimeout(() => {
      drawMeat();
      startAnimation();
    }, 0);
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

    // 肉を切る描画を実行
    setTimeout(() => {
      drawCutMeat();
    }, 0);

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
        <div className="flex flex-col items-center">
          <div className="relative w-full">
            {/* キャンバスを中央揃えに */}
            <canvas
              ref={canvasRef}
              className="mx-auto bg-transparent"
              style={{ display: 'block' }}
            />

            {/* シークバーをメモ化コンポーネントに変更 */}
            <MemoizedSeekbar
              currentPosition={currentPosition}
              cutPosition={cutPosition}
              gameState={gameState}
              seekbarRef={seekbarRef}
            />

            {/* カットボタンをキャンバスの下に配置するよう修正 */}
            <div className="w-full flex justify-center mt-4">
              <button
                onClick={cutMeat}
                className="cut-button"
              >
                <i className="fas fa-scissors"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'result' && (
        <div className="text-center">
          <canvas
            ref={canvasRef}
            className="mx-auto bg-transparent mb-4"
            style={{ display: 'block' }}
          />

          {/* シークバーをメモ化コンポーネントに変更 */}
          <MemoizedSeekbar
            currentPosition={currentPosition}
            cutPosition={cutPosition}
            gameState={gameState}
            seekbarRef={seekbarRef}
          />

          <div className="mt-6">
            <h2 className="text-xl font-bold">結果発表</h2>
            <p className="text-2xl mt-2">スコア: {score}点</p>

            {cutResult && (
              <div className="mt-2 text-sm">
                <p>左側: {(cutResult.leftRatio * 100).toFixed(1)}% / 右側: {(cutResult.rightRatio * 100).toFixed(1)}%</p>
                <p>小さい方の肉: {cutResult.smallerGrams.toFixed(1)}g</p>
              </div>
            )}

            <p className="text-sm mt-3">
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
