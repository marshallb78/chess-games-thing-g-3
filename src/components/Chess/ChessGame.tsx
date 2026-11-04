import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess, type Square, type PieceSymbol, type Color } from 'chess.js';
import {
  type TimeControlId,
  TIME_CONTROLS,
  type GameEndReason,
  type MoveRecord,
  type BotDifficulty
} from '../../types/chess';
import { getCapturedPieces } from '../../lib/chessUtils';
import { getBestBotMove } from '../../lib/botEngine';
import { soundManager } from '../../lib/sound';
import { ChessBoardView } from './ChessBoardView';
import { ChessClock } from './ChessClock';
import { CapturedPieces } from './CapturedPieces';
import { MoveHistory } from './MoveHistory';
import { GameOverModal } from './GameOverModal';
import { ConfirmModal } from '../Common/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Flag,
  Handshake,
  ArrowUpDown,
  Home,
  Bot,
  Loader2
} from 'lucide-react';

interface ChessGameProps {
  timeControlId?: TimeControlId;
  whiteName?: string;
  blackName?: string;
  whiteRating?: number;
  blackRating?: number;
  onReturnToLobby?: () => void;
  // Bot game options
  isBotGame?: boolean;
  botDifficulty?: BotDifficulty;
  // Online multiplayer options
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
  isBotGame = false,
  botDifficulty = 'medium',
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
    isOnlineGame || isBotGame ? (playerColor === 'b' ? 'black' : 'white') : 'white'
  );
  const [autoFlip, setAutoFlip] = useState(false);

  // Clocks
  const [whiteTime, setWhiteTime] = useState(tcConfig.initialSeconds);
  const [blackTime, setBlackTime] = useState(tcConfig.initialSeconds);
  const [gameStarted, setGameStarted] = useState(false);

  // Move history
  const [moves, setMoves] = useState<MoveRecord[]>([]);

  // Bot thinking state
  const [isBotThinking, setIsBotThinking] = useState(false);
  const botTimerRef = useRef<number | null>(null);

  // Game over state
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<Color | 'draw' | null>(null);
  const [endReason, setEndReason] = useState<GameEndReason | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showResignModal, setShowResignModal] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);

  // Toast notifications
  const { showToast } = useToast();

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

  // Execute a move on the board (shared by human and bot)
  const executeMove = useCallback(
    (from: Square, to: Square, promotion?: PieceSymbol, isBotMove: boolean = false): boolean => {
      if (isGameOver) return false;

      // Online turn enforcement: can only move on your turn
      if (isOnlineGame && chess.turn() !== playerColor) {
        return false;
      }

      // Bot turn enforcement: human can only move on human turn and when bot isn't thinking
      if (isBotGame && !isBotMove && (chess.turn() !== playerColor || isBotThinking)) {
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
        if (autoFlip && !isOnlineGame && !isBotGame) {
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
      isBotGame,
      isBotThinking,
      playerColor,
      isUntimed,
      tcConfig.incrementSeconds,
      autoFlip,
      gameStarted,
      verifyGameEnd,
      onOnlineMove
    ]
  );

  // BOT GAME RUNNER: watches for bot's turn and calculates response
  useEffect(() => {
    if (!isBotGame || isGameOver) {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      setIsBotThinking(false);
      return;
    }

    const botColor: Color = playerColor === 'w' ? 'b' : 'w';

    if (chess.turn() === botColor) {
      setIsBotThinking(true);
      // Natural pacing delay so the move feels realistic and visible
      botTimerRef.current = window.setTimeout(() => {
        if (isGameOver) {
          setIsBotThinking(false);
          return;
        }

        const botMove = getBestBotMove(chess, botDifficulty);
        if (botMove) {
          executeMove(
            botMove.from as Square,
            botMove.to as Square,
            botMove.promotion as PieceSymbol | undefined,
            true
          );
        }
        setIsBotThinking(false);
      }, 450);
    } else {
      setIsBotThinking(false);
    }

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [chess.fen(), isBotGame, isGameOver, playerColor, botDifficulty, executeMove, chess]);

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

  // Resignation
  const handleResign = () => {
    if (isGameOver) return;
    const resigningColor = isOnlineGame || isBotGame ? playerColor : chess.turn();
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

    if (isBotGame) {
      // Bot evaluates whether position is balanced to accept draw
      const isDrawnPos = Math.abs(moves.length) > 20;
      if (isDrawnPos) {
        setIsGameOver(true);
        setWinner('draw');
        setEndReason('draw_agreement');
        setShowEndModal(true);
        soundManager.playGameEnd(false);
      } else {
        showToast({
          type: 'info',
          title: 'Draw Offer Declined',
          message: 'The computer bot evaluated the current position and declined your draw offer.'
        });
      }
      return;
    }

    const offeringColor = isOnlineGame ? playerColor : chess.turn();

    if (pendingDrawOffer && pendingDrawOffer !== offeringColor) {
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
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
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
    setIsBotThinking(false);
    setBoardOrientation((isOnlineGame || isBotGame) && playerColor === 'b' ? 'black' : 'white');
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
  const isInteractive =
    !isGameOver &&
    !isBotThinking &&
    (!isOnlineGame || chess.turn() === playerColor) &&
    (!isBotGame || chess.turn() === playerColor);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Top action header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.65rem 1rem',
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
              title="Return to Game Selection"
            >
              <Home size={16} /> Back
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

            {isBotGame && (
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--accent-cyan)',
                  background: 'rgba(56, 189, 248, 0.1)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Bot size={14} /> Bot: {botDifficulty.toUpperCase()}
              </span>
            )}

            {(isOnlineGame || isBotGame) && (
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
                You: {playerColor === 'w' ? 'White' : 'Black'}
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

          {!isOnlineGame && !isBotGame && (
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

      {/* Main Board & Panel Layout - Maximized Space */}
      <div className="chess-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 660px) 1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Left Column: Clocks, Captured Pieces & Maximized Board */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Top Player */}
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

          {/* Interactive Maximized Chess Board */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '660px' }}>
            <ChessBoardView
              chess={chess}
              boardOrientation={boardOrientation}
              isInteractive={isInteractive}
              onMakeMove={(from, to, promo) => executeMove(from, to, promo, false)}
            />

            {/* Subtle Overlay while Bot is Calculating */}
            {isBotThinking && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(15, 23, 42, 0.88)',
                  backdropFilter: 'blur(4px)',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px solid var(--accent-cyan)',
                  boxShadow: '0 4px 14px var(--accent-cyan-glow)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--accent-cyan)',
                  zIndex: 20
                }}
              >
                <Loader2 size={14} className="animate-spin" />
                <span>Bot thinking...</span>
              </div>
            )}
          </div>

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

        {/* Right Column: Turn Info, Move History, Action Controls */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            height: '100%',
            minHeight: '480px'
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
                    : isBotThinking
                    ? 'var(--accent-amber)'
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
                  : isBotThinking
                  ? 'Computer Bot is calculating...'
                  : isBotGame && chess.turn() !== playerColor
                  ? "Bot's Turn"
                  : isBotGame && chess.turn() === playerColor
                  ? "Your Turn to Move"
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
          <div style={{ flex: 1, minHeight: '300px' }}>
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
                  onClick={() => setShowResignModal(true)}
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

      {/* Resignation Confirmation Dialog */}
      <ConfirmModal
        isOpen={showResignModal}
        title="Resign Match"
        message="Are you sure you want to resign? This will end the game immediately and record a loss."
        confirmText="Resign"
        cancelText="Keep Playing"
        variant="danger"
        onConfirm={() => {
          setShowResignModal(false);
          handleResign();
        }}
        onCancel={() => setShowResignModal(false)}
      />

      {/* Restart / New Game Confirmation Dialog */}
      <ConfirmModal
        isOpen={showRestartModal}
        title="Restart Match"
        message="Are you sure you want to restart? Your current board position and clock time will be reset."
        confirmText="Restart"
        cancelText="Cancel"
        variant="warning"
        onConfirm={() => {
          setShowRestartModal(false);
          handleRematch();
        }}
        onCancel={() => setShowRestartModal(false)}
      />

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
