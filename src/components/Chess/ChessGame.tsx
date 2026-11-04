import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess, type Square, type PieceSymbol, type Color } from 'chess.js';
import {
  type TimeControlId,
  TIME_CONTROLS,
  type GameEndReason,
  type MoveRecord
} from '../../types/chess';
import { getCapturedPieces } from '../../lib/chessUtils';
import { soundManager } from '../../lib/sound';
import { ChessBoardView } from './ChessBoardView';
import { ChessClock } from './ChessClock';
import { CapturedPieces } from './CapturedPieces';
import { MoveHistory } from './MoveHistory';
import { GameOverModal } from './GameOverModal';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Flag,
  Handshake,
  ArrowUpDown,
  Home
} from 'lucide-react';

interface ChessGameProps {
  timeControlId?: TimeControlId;
  whiteName?: string;
  blackName?: string;
  whiteRating?: number;
  blackRating?: number;
  onReturnToLobby?: () => void;
  // Online multiplayer hooks (used in Phase 4)
  isOnlineGame?: boolean;
  playerColor?: 'w' | 'b';
  onOnlineMove?: (move: { from: string; to: string; promotion?: string }) => void;
  onOnlineResign?: () => void;
  onOnlineOfferDraw?: () => void;
}

export const ChessGame: React.FC<ChessGameProps> = ({
  timeControlId = '10+0',
  whiteName = 'White Player',
  blackName = 'Black Player',
  whiteRating,
  blackRating,
  onReturnToLobby,
  isOnlineGame = false,
  playerColor = 'w',
  onOnlineMove,
  onOnlineResign,
  onOnlineOfferDraw
}) => {
  // Initialize game instance
  const [chess] = useState<Chess>(() => new Chess());
  const [, setRenderTrigger] = useState(0); // force re-render when chess updates
  const refreshBoard = () => setRenderTrigger((n) => n + 1);

  const tcConfig = TIME_CONTROLS[timeControlId] || TIME_CONTROLS['10+0'];
  const isUntimed = tcConfig.id === 'untimed';

  // Board orientation
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>(
    isOnlineGame ? (playerColor === 'b' ? 'black' : 'white') : 'white'
  );
  const [autoFlip, setAutoFlip] = useState(false);

  // Clocks
  const [whiteTime, setWhiteTime] = useState(tcConfig.initialSeconds);
  const [blackTime, setBlackTime] = useState(tcConfig.initialSeconds);
  const [gameStarted, setGameStarted] = useState(false);

  // Move history
  const [moves, setMoves] = useState<MoveRecord[]>([]);

  // Game over state
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<Color | 'draw' | null>(null);
  const [endReason, setEndReason] = useState<GameEndReason | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);

  // Draw offer state
  const [pendingDrawOffer, setPendingDrawOffer] = useState<Color | null>(null);

  // Sound mute state
  const [isMuted, setIsMuted] = useState(soundManager.isMuted());

  const timerRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  // Check end conditions from chess.js
  const verifyGameEnd = useCallback(() => {
    if (chess.isCheckmate()) {
      const winnerColor: Color = chess.turn() === 'w' ? 'b' : 'w';
      setIsGameOver(true);
      setWinner(winnerColor);
      setEndReason('checkmate');
      setShowEndModal(true);
      soundManager.playGameEnd(true);
      return true;
    }
    if (chess.isStalemate()) {
      setIsGameOver(true);
      setWinner('draw');
      setEndReason('stalemate');
      setShowEndModal(true);
      soundManager.playGameEnd(false);
      return true;
    }
    if (chess.isInsufficientMaterial()) {
      setIsGameOver(true);
      setWinner('draw');
      setEndReason('insufficient_material');
      setShowEndModal(true);
      soundManager.playGameEnd(false);
      return true;
    }
    if (chess.isThreefoldRepetition()) {
      setIsGameOver(true);
      setWinner('draw');
      setEndReason('threefold_repetition');
      setShowEndModal(true);
      soundManager.playGameEnd(false);
      return true;
    }
    if (chess.isDrawByFiftyMoves()) {
      setIsGameOver(true);
      setWinner('draw');
      setEndReason('fifty_moves');
      setShowEndModal(true);
      soundManager.playGameEnd(false);
      return true;
    }
    return false;
  }, [chess]);

  // Clock countdown timer
  useEffect(() => {
    if (isGameOver || !gameStarted || isUntimed) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    lastTickRef.current = Date.now();

    timerRef.current = window.setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      if (chess.turn() === 'w') {
        setWhiteTime((prev) => {
          const next = prev - elapsed;
          if (next <= 0) {
            setIsGameOver(true);
            setWinner('b');
            setEndReason('timeout');
            setShowEndModal(true);
            soundManager.playGameEnd(false);
            return 0;
          }
          return next;
        });
      } else {
        setBlackTime((prev) => {
          const next = prev - elapsed;
          if (next <= 0) {
            setIsGameOver(true);
            setWinner('w');
            setEndReason('timeout');
            setShowEndModal(true);
            soundManager.playGameEnd(false);
            return 0;
          }
          return next;
        });
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [chess, isGameOver, gameStarted, isUntimed]);

  // Execute a move on the board
  const makeMove = useCallback(
    (from: Square, to: Square, promotion?: PieceSymbol): boolean => {
      if (isGameOver) return false;

      // Online turn enforcement: can only move on your turn
      if (isOnlineGame && chess.turn() !== playerColor) {
        return false;
      }

      const fenBefore = chess.fen();
      const movingColor = chess.turn();

      try {
        const moveResult = chess.move({
          from,
          to,
          promotion: promotion || 'q'
        });

        if (!moveResult) return false;

        // Sound effects
        if (chess.inCheck()) {
          soundManager.playCheck();
        } else if (moveResult.captured) {
          soundManager.playCapture();
        } else {
          soundManager.playMove();
        }

        // Apply time increment
        if (!isUntimed && tcConfig.incrementSeconds > 0) {
          if (movingColor === 'w') {
            setWhiteTime((t) => t + tcConfig.incrementSeconds);
          } else {
            setBlackTime((t) => t + tcConfig.incrementSeconds);
          }
        }

        // Add to move history
        const record: MoveRecord = {
          san: moveResult.san,
          from: moveResult.from as Square,
          to: moveResult.to as Square,
          color: moveResult.color,
          piece: moveResult.piece,
          captured: moveResult.captured,
          promotion: moveResult.promotion,
          fenBefore,
          fenAfter: chess.fen()
        };
        setMoves((prev) => [...prev, record]);

        // Auto-flip for local Pass & Play if enabled
        if (autoFlip && !isOnlineGame) {
          setBoardOrientation(chess.turn() === 'w' ? 'white' : 'black');
        }

        if (!gameStarted) {
          setGameStarted(true);
        }

        // Clear any pending draw offer on move
        setPendingDrawOffer(null);

        // Check if move concluded the game
        verifyGameEnd();
        refreshBoard();

        // Forward to online socket / RTDB if multiplayer
        if (isOnlineGame && onOnlineMove) {
          onOnlineMove({ from, to, promotion: promotion || 'q' });
        }

        return true;
      } catch {
        return false;
      }
    },
    [
      chess,
      isGameOver,
      isOnlineGame,
      playerColor,
      isUntimed,
      tcConfig.incrementSeconds,
      autoFlip,
      gameStarted,
      verifyGameEnd,
      onOnlineMove
    ]
  );

  // Resignation
  const handleResign = () => {
    if (isGameOver) return;
    const resigningColor = isOnlineGame ? playerColor : chess.turn();
    const winningColor: Color = resigningColor === 'w' ? 'b' : 'w';

    setIsGameOver(true);
    setWinner(winningColor);
    setEndReason('resignation');
    setShowEndModal(true);
    soundManager.playGameEnd(false);

    if (isOnlineGame && onOnlineResign) {
      onOnlineResign();
    }
  };

  // Draw offer
  const handleOfferDraw = () => {
    if (isGameOver) return;
    const offeringColor = isOnlineGame ? playerColor : chess.turn();

    if (pendingDrawOffer && pendingDrawOffer !== offeringColor) {
      // Opponent accepted previous draw offer!
      setIsGameOver(true);
      setWinner('draw');
      setEndReason('draw_agreement');
      setShowEndModal(true);
      soundManager.playGameEnd(false);
      setPendingDrawOffer(null);
    } else {
      setPendingDrawOffer(offeringColor);
      if (isOnlineGame && onOnlineOfferDraw) {
        onOnlineOfferDraw();
      }
    }
  };

  // Restart / Rematch
  const handleRematch = () => {
    chess.reset();
    setWhiteTime(tcConfig.initialSeconds);
    setBlackTime(tcConfig.initialSeconds);
    setMoves([]);
    setIsGameOver(false);
    setWinner(null);
    setEndReason(null);
    setShowEndModal(false);
    setPendingDrawOffer(null);
    setGameStarted(false);
    setBoardOrientation(isOnlineGame && playerColor === 'b' ? 'black' : 'white');
    refreshBoard();
  };

  // Sound toggle
  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Captured pieces calculation
  const capturedInfo = getCapturedPieces(chess);

  const isWhiteTurn = chess.turn() === 'w';
  const isInteractive = !isGameOver && (!isOnlineGame || chess.turn() === playerColor);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Top action header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {onReturnToLobby && (
            <button
              onClick={onReturnToLobby}
              className="btn-secondary"
              style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}
              title="Return to Game Lobby"
            >
              <Home size={16} /> Lobby
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--accent-cyan)',
                background: 'var(--bg-surface)',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {tcConfig.name} ({tcConfig.category})
            </span>

            {isOnlineGame && (
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--accent-purple)',
                  background: 'rgba(139, 92, 246, 0.1)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}
              >
                Playing as {playerColor === 'w' ? 'White' : 'Black'}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() =>
              setBoardOrientation((o) => (o === 'white' ? 'black' : 'white'))
            }
            className="btn-secondary"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            title="Flip board orientation"
          >
            <ArrowUpDown size={15} /> Flip Board
          </button>

          {!isOnlineGame && (
            <button
              onClick={() => setAutoFlip(!autoFlip)}
              className={autoFlip ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
              title="Auto-flip board on turn for local Pass & Play"
            >
              Auto-Flip: {autoFlip ? 'ON' : 'OFF'}
            </button>
          )}

          <button
            onClick={toggleSound}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.75rem' }}
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {isMuted ? <VolumeX size={16} color="var(--accent-red)" /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>

      {/* Main Board & Panel Layout */}
      <div className="chess-layout">
        {/* Left Column: Clocks, Captured Pieces & Board */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {/* Top Player (Black if oriented White, White if oriented Black) */}
          {boardOrientation === 'white' ? (
            <div>
              <ChessClock
                timeRemainingSeconds={blackTime}
                isActive={!isGameOver && gameStarted && !isWhiteTurn}
                playerName={blackName}
                isWhite={false}
                rating={blackRating}
                isUntimed={isUntimed}
              />
              <div style={{ marginTop: '4px', padding: '0 4px' }}>
                <CapturedPieces
                  colorCaptured="w"
                  captured={capturedInfo.whiteCaptured}
                  scoreDifference={capturedInfo.blackScore}
                />
              </div>
            </div>
          ) : (
            <div>
              <ChessClock
                timeRemainingSeconds={whiteTime}
                isActive={!isGameOver && gameStarted && isWhiteTurn}
                playerName={whiteName}
                isWhite={true}
                rating={whiteRating}
                isUntimed={isUntimed}
              />
              <div style={{ marginTop: '4px', padding: '0 4px' }}>
                <CapturedPieces
                  colorCaptured="b"
                  captured={capturedInfo.blackCaptured}
                  scoreDifference={capturedInfo.whiteScore}
                />
              </div>
            </div>
          )}

          {/* Interactive Chess Board */}
          <ChessBoardView
            chess={chess}
            boardOrientation={boardOrientation}
            isInteractive={isInteractive}
            onMakeMove={makeMove}
          />

          {/* Bottom Player */}
          {boardOrientation === 'white' ? (
            <div>
              <div style={{ marginBottom: '4px', padding: '0 4px' }}>
                <CapturedPieces
                  colorCaptured="b"
                  captured={capturedInfo.blackCaptured}
                  scoreDifference={capturedInfo.whiteScore}
                />
              </div>
              <ChessClock
                timeRemainingSeconds={whiteTime}
                isActive={!isGameOver && gameStarted && isWhiteTurn}
                playerName={whiteName}
                isWhite={true}
                rating={whiteRating}
                isUntimed={isUntimed}
              />
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '4px', padding: '0 4px' }}>
                <CapturedPieces
                  colorCaptured="w"
                  captured={capturedInfo.whiteCaptured}
                  scoreDifference={capturedInfo.blackScore}
                />
              </div>
              <ChessClock
                timeRemainingSeconds={blackTime}
                isActive={!isGameOver && gameStarted && !isWhiteTurn}
                playerName={blackName}
                isWhite={false}
                rating={blackRating}
                isUntimed={isUntimed}
              />
            </div>
          )}
        </div>

        {/* Right Column: Move History, In-Game Controls & Status */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            height: '100%',
            minHeight: '440px'
          }}
        >
          {/* Turn indicator card */}
          <div
            className="card"
            style={{
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: isGameOver
                    ? 'var(--accent-red)'
                    : isWhiteTurn
                    ? '#ffffff'
                    : '#0284c7',
                  boxShadow: isGameOver
                    ? '0 0 8px rgba(239, 68, 68, 0.6)'
                    : '0 0 8px rgba(56, 189, 248, 0.5)'
                }}
              />
              <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                {isGameOver
                  ? 'Game Over'
                  : isWhiteTurn
                  ? `${whiteName}'s Turn (White)`
                  : `${blackName}'s Turn (Black)`}
              </span>
            </div>

            {chess.inCheck() && !isGameOver && (
              <span
                style={{
                  color: '#fee2e2',
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}
              >
                CHECK!
              </span>
            )}
          </div>

          {/* Move History Panel */}
          <div style={{ flex: 1, minHeight: '260px' }}>
            <MoveHistory moves={moves} currentMoveIndex={moves.length - 1} />
          </div>

          {/* In-Game Action Buttons: Resign, Draw Offer, Rematch */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isGameOver ? '1fr' : '1fr 1fr',
              gap: '0.6rem'
            }}
          >
            {isGameOver ? (
              <button
                onClick={handleRematch}
                className="btn-primary"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                <RotateCcw size={18} /> Rematch / Play Again
              </button>
            ) : (
              <>
                <button
                  onClick={handleOfferDraw}
                  className="btn-secondary"
                  style={{
                    padding: '0.6rem',
                    fontSize: '0.85rem',
                    background: pendingDrawOffer ? 'var(--accent-cyan-glow)' : undefined,
                    borderColor: pendingDrawOffer ? 'var(--accent-cyan)' : undefined
                  }}
                  title="Offer a draw to opponent"
                >
                  <Handshake size={16} />
                  {pendingDrawOffer ? 'Draw Offered' : 'Offer Draw'}
                </button>

                <button
                  onClick={handleResign}
                  className="btn-danger"
                  style={{ padding: '0.6rem', fontSize: '0.85rem' }}
                  title="Resign the game"
                >
                  <Flag size={16} /> Resign
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Game Over Results Modal */}
      {showEndModal && (
        <GameOverModal
          winner={winner}
          reason={endReason}
          whitePlayerName={whiteName}
          blackPlayerName={blackName}
          onRematch={handleRematch}
          onLobby={() => {
            setShowEndModal(false);
            if (onReturnToLobby) onReturnToLobby();
          }}
          onClose={() => setShowEndModal(false)}
        />
      )}
    </div>
  );
};
