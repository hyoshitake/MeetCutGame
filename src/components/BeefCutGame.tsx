import { useState, useEffect, useRef } from 'react';

type GameState = 'ready' | 'playing' | 'result';

interface GameProps {
  userId: string;
  onSaveScore: (score: number) => Promise<void>;
}

export default function BeefCutGame({ userId, onSaveScore }: GameProps) {
  // ゲーム状態の管理
  const [gameState, setGameState] = useState<GameState>('ready');

  // シークバーの位置と方向
  const [seekPosition, setSeekPosition] = useState(0);
  const [seekDirection, setSeekDirection] = useState(1); // 1: 右, -1: 左

  // 切った位置と得点
  const [cutPosition, setCutPosition] = useState(0);
  const [score, setScore] = useState(0);

  // 肉の切断結果
  const [cutResult, setCutResult] = useState<{
    leftRatio: number;
    rightRatio: number;
    smallerGrams: number;
  } | null>(null);

  // DOMの参照
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // アニメーションの管理
  const animationRef = useRef<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // 切断アニメーションの状態
  const [isCutting, setIsCutting] = useState(false);
  const [cutStartTime, setCutStartTime] = useState(0);
  const [cutStartY, setCutStartY] = useState(0);
  const [baselineY, setBaselineY] = useState(0);

  // キャンバスのサイズを設定
  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current && gameAreaRef.current && seekBarRef.current) {
        // 横幅は画面の50%
        const width = Math.min(window.innerWidth * 0.5, 500);
        const height = width * 0.6; // アスペクト比を保つ

        setCanvasSize({ width, height });
        canvasRef.current.width = width;
        canvasRef.current.height = height;

        // シークバーコンテナの幅をキャンバスに合わせる
        if (seekBarRef.current) {
          seekBarRef.current.style.width = `${width}px`;
        }

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
  }, [gameState, cutPosition]);

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
    const newBaselineY = canvas.height * 0.7;
    setBaselineY(newBaselineY);

    // パスの開始
    ctx.beginPath();

    // 左下点から開始
    ctx.moveTo(0, newBaselineY);

    // ランダムな曲線を生成
    const numPoints = 5 + Math.floor(Math.random() * 4); // 5〜8個の制御点
    const pointsX = [];
    const pointsY = [];

    // ランダムな制御点を生成
    for (let i = 0; i < numPoints; i++) {
      pointsX.push(canvas.width * (i / (numPoints - 1)));
      // 下線より上のランダムな高さ
      const maxHeight = newBaselineY * 0.8;
      pointsY.push(newBaselineY - (Math.random() * maxHeight));
    }

    // 最初と最後の点は下線に合わせる
    pointsY[0] = newBaselineY;
    pointsY[numPoints - 1] = newBaselineY;

    // 複数の弧を持つ曲線を描く
    for (let i = 0; i < numPoints - 1; i++) {
      const cpX1 = pointsX[i] + (pointsX[i+1] - pointsX[i]) / 3;
      const cpY1 = pointsY[i] - Math.random() * 50;

      const cpX2 = pointsX[i] + 2 * (pointsX[i+1] - pointsX[i]) / 3;
      const cpY2 = pointsY[i+1] - Math.random() * 50;

      ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, pointsX[i+1], pointsY[i+1]);
    }

    // 下線を描く（右から左へ）
    ctx.lineTo(canvas.width, newBaselineY);
    ctx.lineTo(0, newBaselineY);

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

  // シークバーのアニメーション（時間ベース）
  const startAnimation = () => {
    // 前回の更新時間とアニメーションの状態
    let lastTimestamp = 0;
    const TOTAL_DURATION = 1500; // シークバーが片道する時間（ミリ秒）

    const animate = (timestamp: number) => {
      // 初回実行時またはリセット後の初回実行時
      if (!lastTimestamp) {
        lastTimestamp = timestamp;
      }

      // 経過時間を計算（ミリ秒）
      const elapsed = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      // カクつきを防ぐために、経過時間が異常に長い場合は調整
      const safeElapsed = Math.min(elapsed, 50);

      // 速度計算（1.5秒で端から端まで移動）
      const speed = (100 / TOTAL_DURATION) * safeElapsed;

      // 新しい位置を計算
      let newPosition = seekPosition + speed * seekDirection;

      // 方向の更新（端に到達したら逆方向へ）
      let newDirection = seekDirection;
      if (newPosition >= 100) {
        newPosition = 100;
        newDirection = -1;
      } else if (newPosition <= 0) {
        newPosition = 0;
        newDirection = 1;
      }

      // 状態を更新
      setSeekPosition(newPosition);
      setSeekDirection(newDirection);

      // ゲームが実行中なら次のフレームの処理を予約
      if (gameState === 'playing') {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    // 初回のアニメーションフレームをリクエスト
    animationRef.current = requestAnimationFrame(animate);
  };

  // ゲーム開始
  const startGame = () => {
    // ゲーム状態を「プレイ中」に設定
    setGameState('playing');

    // 各種値をリセット
    setSeekPosition(0);
    setSeekDirection(1);
    setCutPosition(0);
    setScore(0);
    setCutResult(null);
    setIsCutting(false);

    // setTimeout を使って描画が確実に実行されるようにする
    setTimeout(() => {
      drawMeat();
      startAnimation();
    }, 0);
  };

  // 肉を切る
  const cutMeat = () => {
    if (gameState !== 'playing' || isCutting) return;

    // アニメーションを停止
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // カット位置を保存
    setCutPosition(seekPosition);

    // スコア計算（50%からの差異に基づく）
    const accuracy = Math.abs(50 - seekPosition);
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

  // コンポーネントのアンマウント時に実行
  useEffect(() => {
    return () => {
      // アニメーションを停止
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []);

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">牛肉ぴったんこチャレンジ</h1>

      {/* ゲーム開始前の画面 */}
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

      {/* ゲームプレイ画面 */}
      {gameState === 'playing' && (
        <div className="relative" ref={gameAreaRef}>
          {/* シークバーコンテナ */}
          <div
            className="relative h-12 bg-gray-200 rounded-md mx-auto mb-4 overflow-hidden"
            ref={seekBarRef}
          >
            {/* シークバー */}
            <div
              className="absolute top-0 h-full w-4 bg-gray-500 rounded-full transform -translate-x-1/2"
              style={{ left: `${seekPosition}%` }}
            ></div>
          </div>

          {/* キャンバス - 中央揃えにする */}
          <canvas
            ref={canvasRef}
            className="mx-auto bg-transparent"
            style={{ display: 'block' }}
          />

          {/* カットボタン - キャンバスの下中央に配置 */}
          <div className="w-full flex justify-center mt-4">
            <button
              onClick={cutMeat}
              className="cut-button"
            >
              <i className="fas fa-scissors"></i>
            </button>
          </div>
        </div>
      )}

      {/* 結果画面 */}
      {gameState === 'result' && (
        <div className="text-center">
          {/* キャンバス - 切った後の肉を表示 */}
          <canvas
            ref={canvasRef}
            className="mx-auto bg-transparent mb-4"
            style={{ display: 'block' }}
          />

          {/* シークバー（結果表示用） */}
          <div className="relative h-12 bg-red-100 rounded-md mx-auto mb-8 overflow-hidden" ref={seekBarRef}>
            {/* 現在位置マーカー */}
            <div
              className="absolute top-0 h-full w-2 bg-red-600"
              style={{ left: `${seekPosition}%` }}
            ></div>

            {/* カットライン */}
            <div
              className="absolute top-0 h-full w-0.5 bg-black"
              style={{ left: `${cutPosition}%` }}
            ></div>

            {/* 理想的な50%ライン */}
            <div
              className="absolute top-0 h-full w-0.5 bg-green-500 opacity-70"
              style={{ left: `50%` }}
            ></div>
          </div>

          {/* 結果表示 */}
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

            {/* もう一度チャレンジボタン */}
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
