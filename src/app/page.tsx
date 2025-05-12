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
const BeefCanvas = ({
  gameState,
  setGameState,
  onGameResult
}: {
  gameState: string,
  setGameState: (state: string) => void,
  onGameResult?: (result: { resultWeight: number, leftRatio: number, rightRatio: number }) => void
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [seekBarPosition, setSeekBarPosition] = useState(100);
  const directionRef = useRef<boolean>(true); // true: 右向き, false: 左向き
  const [buttonFlash, setButtonFlash] = useState(false);
  const [leftMeatRatio, setLeftMeatRatio] = useState(0);
  const [rightMeatRatio, setRightMeatRatio] = useState(0);
  const [resultWeight, setResultWeight] = useState(0);

  // お肉の形状を保存する参照を追加
  const beefShapeRef = useRef<Array<{x: number, y: number}>>([]);
  // 分割後のお肉の状態を管理
  const [cutAnimationProgress, setCutAnimationProgress] = useState(0);
  const [isCutAnimationComplete, setIsCutAnimationComplete] = useState(false);

  // 最初の一回だけお肉を描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスのサイズ設定
    canvas.width = 640 + 200; // 左右分割時の余白を考慮
    canvas.height = 320;

    // お肉を描画（一度だけ）
    drawBeef(ctx, 640, canvas.height);
  }, []);

  // resultWeightの変更を監視
  useEffect(() => {
    console.log('resultWeight変更を検知:', resultWeight);
  }, [resultWeight]);

  // gameStateの変更を監視
  useEffect(() => {
    if (gameState === 'result') {
      console.log('結果画面表示時の値:', {
        resultWeight,
        leftMeatRatio,
        rightMeatRatio
      });
    }
  }, [gameState, resultWeight, leftMeatRatio, rightMeatRatio]);
  // カット後のアニメーションを監視
  useEffect(() => {
    if (cutAnimationProgress > 0 && cutAnimationProgress < 1) {
      // アニメーションを更新
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // キャンバスをクリア
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 分割されたお肉を描画
      drawSplitMeat(ctx, canvas.width, canvas.height, cutAnimationProgress);

      // アニメーションを続ける
      const animationId = requestAnimationFrame(() => {
        setCutAnimationProgress(prev => Math.min(prev + 0.02, 1));
      });

      return () => cancelAnimationFrame(animationId);
    } else if (cutAnimationProgress >= 1 && !isCutAnimationComplete) {
      // 完了状態を先に設定
      setIsCutAnimationComplete(true);

      // アニメーション完了後、少し待ってから次の画面に遷移
      // このタイミングでresultWeightの値が確実に反映されるようにする
      setTimeout(() => {
        console.log('結果画面に遷移する前の最終値:', {
          resultWeight,
          leftMeatRatio,
          rightMeatRatio
        });

        // 親コンポーネントに結果を通知
        if (onGameResult) {
          onGameResult({
            resultWeight,
            leftRatio: leftMeatRatio,
            rightRatio: rightMeatRatio
          });
        }
        // 親から結果遷移の通知がない場合のフォールバック
        else {
          setGameState('result');
        }
      }, 500);
    }
  }, [cutAnimationProgress, isCutAnimationComplete, setGameState, resultWeight, leftMeatRatio, rightMeatRatio, onGameResult]);

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

    const width = 640; // シークバーの幅

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
          if (newPosition >= width + 100) {
            newPosition = width + 100;
            directionRef.current = false; // 左向きに切り替え
          }
        } else {
          // 左向きに移動
          newPosition -= speed;
          if (newPosition <= 100) {
            newPosition = 100;
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
      const x = seekBarPosition || 100;
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

    const totalWidth = 640; // 元のキャンバス幅（余白除く）
    const cutPos = (seekBarPosition || 100) - 100; // 100pxの左余白を考慮

    // 左側と右側の肉の割合を計算（調整済みの値で計算）
    const leftRatio = cutPos / totalWidth;
    const rightRatio = 1 - leftRatio;

    console.log('分割比率計算:', { cutPos, totalWidth, leftRatio, rightRatio });

    // 小さい方の割合を計算（1kgの肉を想定）
    const smallerRatio = Math.min(leftRatio, rightRatio);
    const weight = Math.round(smallerRatio * 1000 * 10) / 10; // 小数点第1位で四捨五入
    console.log('重さ計算:', { smallerRatio, weight });

    // すべてのステート更新を一度に行う
    // これにより、Reactのバッチ更新メカニズムを活用して一貫性を保つ
    setLeftMeatRatio(leftRatio);
    setRightMeatRatio(rightRatio);
    setResultWeight(weight);

    // ステート更新が確実に行われた後に分割アニメーションを開始
    // この遅延によりReactがステート更新をコミットする時間を確保
    setTimeout(() => {
      setCutAnimationProgress(0.01);
      setIsCutAnimationComplete(false);
    }, 0);
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
    const startX = 100; // canvasの左端
    const endX = width + 100; // canvasの右端
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

    // お肉の形状を保存
    beefShapeRef.current = [
      { x: startX, y: bottomY },
      ...points.map(p => ({ x: p.x, y: p.y })),
      { x: endX, y: bottomY }
    ];
  };

  // 分割されたお肉を描画する関数
  const drawSplitMeat = (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number) => {
    const cutPos = seekBarPosition || 100;
    const beefShape = beefShapeRef.current;
    const bottomY = height;

    if (beefShape.length === 0) return;

    // 左側のお肉
    ctx.fillStyle = '#FF8C94';
    ctx.strokeStyle = '#E56A77';
    ctx.lineWidth = 2;

    // 左側お肉の移動距離を計算（進行に応じて）
    const leftOffset = -cutPos * 0.3 * progress;

    ctx.beginPath();
    ctx.moveTo(0 + leftOffset, bottomY);

    // 左側お肉の形状を描画
    for (const point of beefShape) {
      if (point.x <= cutPos) {
        ctx.lineTo(point.x + leftOffset, point.y);
      }
    }

    // 切断線
    ctx.lineTo(cutPos + leftOffset, 0);
    ctx.lineTo(cutPos + leftOffset, bottomY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 右側のお肉
    ctx.beginPath();

    // 右側お肉の移動距離を計算（進行に応じて）
    const rightOffset = (width - cutPos) * 0.3 * progress;

    // 切断線
    ctx.moveTo(cutPos + rightOffset, 0);
    ctx.lineTo(cutPos + rightOffset, bottomY);

    // 右側お肉の形状を描画
    const rightSidePoints = beefShape.filter(point => point.x >= cutPos);
    for (const point of rightSidePoints) {
      ctx.lineTo(point.x + rightOffset, point.y);
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  return (
    <div className="relative w-full" style={{ width: '840px', maxWidth: '100%' }}>
      {/* シークバー（円形）- canvasの上に配置 */}
      {gameState === 'playing' && (
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
        style={{ width: '840px', height: '320px', maxWidth: '100%' }}
      />

      {/* カットボタン */}
      {gameState === 'playing' && (
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
    </div>
  );
};

export default function Home() {
  const [gameState, setGameState] = useState('waiting') // waiting, playing, result
  const [gameResult, setGameResult] = useState({ resultWeight: 0, leftRatio: 0, rightRatio: 0 })
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  // BeefCanvasコンポーネントから結果を受け取る関数
  const handleGameResult = (result: { resultWeight: number, leftRatio: number, rightRatio: number }) => {
    setGameResult(result);
    setGameState('result');
  }

  // 保存ダイアログを表示する関数
  const handleShowSaveDialog = () => {
    setShowSaveDialog(true)
  }

  return (
    <div className="flex justify-center items-center w-full">
      <main className="flex min-h-screen flex-col items-center justify-center p-4" style={{ minWidth: '840px', maxWidth: '1200px', width: '100%' }}>
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
              <BeefCanvas gameState={gameState} setGameState={setGameState} onGameResult={handleGameResult} />
            </div>
          </div>
        )}

        {gameState === 'result' && (
          <div className="w-full max-w-lg text-center mx-auto">
            <p className="text-xl mb-4">結果発表</p>
            <div className="relative w-full" style={{ width: '840px', maxWidth: '100%', height: '320px' }}>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center bg-white bg-opacity-80 p-4 rounded shadow-lg z-20">
                <p className="text-xl font-bold">結果</p>
                <p className="text-lg">小さい方の肉: {gameResult.resultWeight}g</p>
                <p className="text-md">分割比率: {Math.round(gameResult.leftRatio * 100)}% : {Math.round(gameResult.rightRatio * 100)}%</p>
              </div>
            </div>            <button
              className="px-6 py-3 text-lg bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 mt-4"
              onClick={() => setGameState('waiting')}
            >
              もう一度チャレンジ
            </button>
            <button
              className="px-6 py-3 text-lg bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300 mt-4 ml-2"
              onClick={handleShowSaveDialog}
            >
              記録を保存する
            </button>

            {/* 記録保存ダイアログ */}
            {showSaveDialog && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                  <h3 className="text-lg font-bold mb-4">記録を保存</h3>
                  <p className="mb-4">あなたの記録: {gameResult.resultWeight}g</p>
                  <div className="flex justify-end">
                    <button
                      className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-300 mr-2"
                      onClick={() => setShowSaveDialog(false)}
                    >
                      キャンセル
                    </button>
                    <button
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300"
                      onClick={() => {
                        // 保存処理をここに実装
                        setShowSaveDialog(false)
                      }}
                    >
                      保存する
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
