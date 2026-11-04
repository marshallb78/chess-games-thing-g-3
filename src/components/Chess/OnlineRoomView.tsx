import React, { useState, useEffect, useRef } from 'react';
import { Chess, type Square, type PieceSymbol, type Color } from 'chess.js';
import type { GameRoom } from '../../types/room';
import type { UserProfile } from '../../types/user';
import { roomService } from '../../lib/roomService';
import { TIME_CONTROLS } from '../../types/chess';
import { soundManager } from '../../lib/sound';
import { ChessBoardView } from './ChessBoardView';
import { ChessClock } from './ChessClock';
import { CapturedPieces } from './CapturedPieces';
import { MoveHistory } from './MoveHistory';
import { RoomChat } from './RoomChat';
import { GameOverModal } from './GameOverModal';
import { getCapturedPieces } from '../../lib/chessUtils';
import { resolveDisplayName, resolvePlayerRating } from '../../lib/playerUtils';
import {
  Copy,
  Check,
  Share2,
  Users,
  RotateCcw,
  Flag,
  Handshake,
  ArrowUpDown,
  Home,
  MessageSquare,
  ListOrdered
} from 'lucide-react';

interface OnlineRoomViewProps {
  roomId: string;
  userProfile: UserProfile;
  playerColor: 'w' | 'b';
  onLeaveRoom: () => void;
}

export const OnlineRoomView: React.FC<OnlineRoomViewProps> = ({
  roomId,
  userProfile,
  playerColor,
  onLeaveRoom
}) => {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState<'moves' | 'chat'>('moves');

  // Local chess engine instance synchronized with room gameState
  const [chess] = useState<Chess>(() => new Chess());
  const [, setRenderTrigger] = useState(0);
  const refreshBoard = () => setRenderTrigger((n) => n + 1);

  // Clocks
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const timerRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  // Board orientation
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>(
    playerColor === 'b' ? 'black' : 'white'
  );

  // Rematch / Game Over state
  const [showEndModal, setShowEndModal] = useState(false);

  // Listen to room updates from Realtime Database
  useEffect(() => {
    const unsub = roomService.subscribeToRoom(roomId, (updatedRoom) => {
      if (!updatedRoom) return;
      setRoom(updatedRoom);

      // Sync local chess engine to FEN from server
      if (updatedRoom.gameState.fen !== chess.fen()) {
        try {
          chess.load(updatedRoom.gameState.fen);
          refreshBoard();
        } catch (e) {
          console.warn('Failed to load server FEN:', e);
        }
      }

      // Sync clocks
      setWhiteTime(updatedRoom.gameState.whiteTime);
      setBlackTime(updatedRoom.gameState.blackTime);

      // Sync game over dialog
      if (updatedRoom.gameState.isGameOver) {
        setShowEndModal(true);
      } else {
        setShowEndModal(false);
      }
    });

    return () => unsub();
  }, [roomId, chess]);

  const tcConfig = room ? TIME_CONTROLS[room.timeControlId] : TIME_CONTROLS['10+0'];
  const isUntimed = tcConfig.id === 'untimed';

  // Live clock tick when game is playing
  useEffect(() => {
    if (!room || room.status !== 'playing' || room.gameState.isGameOver || isUntimed) {
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
          const next = Math.max(0, prev - elapsed);
          if (next <= 0 && playerColor === 'w') {
            // Local player timed out as White
            roomService.submitMove(roomId, 'w', {
              from: '',
              to: '',
              san: '',
              newFen: chess.fen(),
              newTurn: 'b',
              isCheck: false,
              isGameOver: true,
              winner: 'b',
              endReason: 'timeout',
              whiteTime: 0,
              blackTime
            });
          }
          return next;
        });
      } else {
        setBlackTime((prev) => {
          const next = Math.max(0, prev - elapsed);
          if (next <= 0 && playerColor === 'b') {
            // Local player timed out as Black
            roomService.submitMove(roomId, 'b', {
              from: '',
              to: '',
              san: '',
              newFen: chess.fen(),
              newTurn: 'w',
              isCheck: false,
              isGameOver: true,
              winner: 'w',
              endReason: 'timeout',
              whiteTime,
              blackTime: 0
            });
          }
          return next;
        });
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [room, chess, isUntimed, playerColor, whiteTime, blackTime, roomId]);

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!room) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${room.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Online move execution
  const handleMakeMove = (from: Square, to: Square, promotion?: PieceSymbol): boolean => {
    if (!room || room.status !== 'playing' || room.gameState.isGameOver) return false;
    if (chess.turn() !== playerColor) return false; // Enforce turn

    try {
      const moveResult = chess.move({
        from,
        to,
        promotion: promotion || 'q'
      });

      if (!moveResult) return false;

      // Sound
      if (chess.inCheck()) {
        soundManager.playCheck();
      } else if (moveResult.captured) {
        soundManager.playCapture();
      } else {
        soundManager.playMove();
      }

      // Check game end conditions
      let isGameOver = false;
      let winner: Color | 'draw' | null = null;
      let endReason: any = null;

      if (chess.isCheckmate()) {
        isGameOver = true;
        winner = playerColor;
        endReason = 'checkmate';
      } else if (chess.isStalemate()) {
        isGameOver = true;
        winner = 'draw';
        endReason = 'stalemate';
      } else if (chess.isInsufficientMaterial()) {
        isGameOver = true;
        winner = 'draw';
        endReason = 'insufficient_material';
      } else if (chess.isThreefoldRepetition()) {
        isGameOver = true;
        winner = 'draw';
        endReason = 'threefold_repetition';
      } else if (chess.isDrawByFiftyMoves()) {
        isGameOver = true;
        winner = 'draw';
        endReason = 'fifty_moves';
      }

      const updatedWhiteTime =
        playerColor === 'w' ? whiteTime + tcConfig.incrementSeconds : whiteTime;
      const updatedBlackTime =
        playerColor === 'b' ? blackTime + tcConfig.incrementSeconds : blackTime;

      // Broadcast move to Firebase RTDB
      roomService.submitMove(roomId, playerColor, {
        from,
        to,
        san: moveResult.san,
        promotion: promotion || 'q',
        newFen: chess.fen(),
        newTurn: chess.turn(),
        isCheck: chess.inCheck(),
        isGameOver,
        winner,
        endReason,
        whiteTime: updatedWhiteTime,
        blackTime: updatedBlackTime
      });

      refreshBoard();
      return true;
    } catch {
      return false;
    }
  };

  const handleResign = () => {
    if (!room || room.gameState.isGameOver) return;
    roomService.resignGame(roomId, playerColor);
  };

  const handleOfferDraw = () => {
    if (!room || room.gameState.isGameOver) return;
    roomService.offerOrAcceptDraw(roomId, playerColor, room.gameState.drawOffer);
  };

  const handleRequestRematch = () => {
    if (!room) return;
    roomService.requestRematch(roomId, playerColor, tcConfig.initialSeconds);
  };

  if (!room) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading room details...</p>
      </div>
    );
  }

  // WAITING SCREEN: Waiting for opponent
  if (room.status === 'waiting') {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              color: 'var(--accent-cyan)'
            }}
          >
            <Users size={28} />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            Private Room Created
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Share this room code with your friend. The game will automatically begin once they join!
          </p>

          {/* Big Room Code Box */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '2px dashed var(--accent-cyan)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>
              ROOM CODE
            </span>
            <span
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                letterSpacing: '4px',
                color: 'var(--accent-cyan)',
                fontFamily: 'monospace'
              }}
            >
              {room.roomCode}
            </span>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={handleCopyCode}
                className="btn-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                {copiedCode ? 'Code Copied!' : 'Copy Code'}
              </button>

              <button
                onClick={handleCopyLink}
                className="btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
                {copiedLink ? 'Link Copied!' : 'Copy Join Link'}
              </button>
            </div>
          </div>

          {/* Game settings summary */}
          <div
            style={{
              background: 'var(--bg-surface)',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
              marginBottom: '1.5rem'
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Time Control:</span>
            <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
              {tcConfig.name} ({tcConfig.category})
            </span>
          </div>

          {/* Pulsing waiting status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              marginBottom: '1.5rem'
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'var(--accent-cyan)',
                boxShadow: '0 0 10px var(--accent-cyan-glow)',
                animation: 'pulse 1.5s infinite'
              }}
            />
            <span>Waiting for opponent to connect...</span>
          </div>

          <button
            onClick={onLeaveRoom}
            className="btn-secondary"
            style={{ width: '100%', padding: '0.65rem' }}
          >
            Cancel & Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  // ACTIVE GAME PLAYING SCREEN
  const whitePlayer = room.players.white;
  const blackPlayer = room.players.black;
  const opponent = playerColor === 'w' ? blackPlayer : whitePlayer;
  const opponentConnected = opponent ? opponent.connected : false;

  const whiteName = resolveDisplayName({ displayName: whitePlayer?.displayName }, null, 'White Player');
  const blackName = resolveDisplayName({ displayName: blackPlayer?.displayName }, null, 'Black Player');
  const whiteRating = resolvePlayerRating(whitePlayer, 1200);
  const blackRating = resolvePlayerRating(blackPlayer, 1200);
  const opponentName = playerColor === 'w' ? blackName : whiteName;

  const capturedInfo = getCapturedPieces(chess);
  const isWhiteTurn = chess.turn() === 'w';
  const isMyTurn = !room.gameState.isGameOver && chess.turn() === playerColor;

  // Rematch status
  const myRematchRequested =
    playerColor === 'w' ? room.rematch?.whiteRequested : room.rematch?.blackRequested;
  const opponentRematchRequested =
    playerColor === 'w' ? room.rematch?.blackRequested : room.rematch?.whiteRequested;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Top Header */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={onLeaveRoom}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}
          >
            <Home size={15} /> Leave Room
          </button>

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
            Room: {room.roomCode}
          </span>

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
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setBoardOrientation((o) => (o === 'white' ? 'black' : 'white'))}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
          >
            <ArrowUpDown size={15} /> Flip Board
          </button>
        </div>
      </div>

      {/* Main Board & Panel Layout */}
      <div className="chess-layout">
        {/* Left Column: Clocks, Board & Captured Pieces */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {/* Top Player */}
          {boardOrientation === 'white' ? (
            <div>
              <ChessClock
                timeRemainingSeconds={blackTime}
                isActive={!room.gameState.isGameOver && !isWhiteTurn}
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
                isActive={!room.gameState.isGameOver && isWhiteTurn}
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
            isInteractive={isMyTurn}
            onMakeMove={handleMakeMove}
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
                isActive={!room.gameState.isGameOver && isWhiteTurn}
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
                isActive={!room.gameState.isGameOver && !isWhiteTurn}
                playerName={blackName}
                isWhite={false}
                rating={blackRating}
                isUntimed={isUntimed}
              />
            </div>
          )}
        </div>

        {/* Right Column: Moves, Chat & Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', height: '100%', minHeight: '440px' }}>
          {/* Turn and Status Card */}
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
                  background: room.gameState.isGameOver
                    ? 'var(--accent-red)'
                    : isMyTurn
                    ? 'var(--accent-cyan)'
                    : 'var(--text-muted)',
                  boxShadow: isMyTurn ? '0 0 10px var(--accent-cyan-glow)' : 'none'
                }}
              />
              <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                {room.gameState.isGameOver
                  ? 'Game Over'
                  : isMyTurn
                  ? 'Your Turn to Move!'
                  : `Waiting for ${isWhiteTurn ? whiteName : blackName}...`}
              </span>
            </div>

            {chess.inCheck() && !room.gameState.isGameOver && (
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

          {/* Toggle between Moves and Chat */}
          <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <button
              onClick={() => setActiveSideTab('moves')}
              className="btn-secondary"
              style={{
                flex: 1,
                fontSize: '0.85rem',
                padding: '0.45rem',
                background: activeSideTab === 'moves' ? 'var(--accent-cyan-glow)' : 'transparent',
                borderColor: activeSideTab === 'moves' ? 'var(--accent-cyan)' : 'transparent',
                color: activeSideTab === 'moves' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
              }}
            >
              <ListOrdered size={15} /> Moves
            </button>
            <button
              onClick={() => setActiveSideTab('chat')}
              className="btn-secondary"
              style={{
                flex: 1,
                fontSize: '0.85rem',
                padding: '0.45rem',
                background: activeSideTab === 'chat' ? 'var(--accent-cyan-glow)' : 'transparent',
                borderColor: activeSideTab === 'chat' ? 'var(--accent-cyan)' : 'transparent',
                color: activeSideTab === 'chat' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
              }}
            >
              <MessageSquare size={15} /> Chat
            </button>
          </div>

          {/* Moves or Chat View */}
          <div style={{ flex: 1, minHeight: '260px' }}>
            {activeSideTab === 'moves' ? (
              <MoveHistory
                moves={chess.history({ verbose: true }).map((m) => ({
                  san: m.san,
                  from: m.from,
                  to: m.to,
                  color: m.color,
                  piece: m.piece,
                  captured: m.captured,
                  promotion: m.promotion,
                  fenBefore: '',
                  fenAfter: ''
                }))}
                currentMoveIndex={chess.history().length - 1}
              />
            ) : (
              <RoomChat
                roomId={roomId}
                userProfile={userProfile}
                opponentName={opponentName}
                opponentConnected={opponentConnected}
              />
            )}
          </div>

          {/* In-Game Action Buttons: Resign, Draw Offer, Rematch */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: room.gameState.isGameOver ? '1fr' : '1fr 1fr',
              gap: '0.6rem'
            }}
          >
            {room.gameState.isGameOver ? (
              <button
                onClick={handleRequestRematch}
                className="btn-primary"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                <RotateCcw size={18} />
                {myRematchRequested
                  ? 'Waiting for Opponent...'
                  : opponentRematchRequested
                  ? 'Accept Rematch!'
                  : 'Request Rematch'}
              </button>
            ) : (
              <>
                <button
                  onClick={handleOfferDraw}
                  className="btn-secondary"
                  style={{
                    padding: '0.6rem',
                    fontSize: '0.85rem',
                    background: room.gameState.drawOffer ? 'var(--accent-cyan-glow)' : undefined,
                    borderColor: room.gameState.drawOffer ? 'var(--accent-cyan)' : undefined
                  }}
                >
                  <Handshake size={16} />
                  {room.gameState.drawOffer === playerColor
                    ? 'Draw Offered'
                    : room.gameState.drawOffer
                    ? 'Accept Draw Offer'
                    : 'Offer Draw'}
                </button>

                <button
                  onClick={handleResign}
                  className="btn-danger"
                  style={{ padding: '0.6rem', fontSize: '0.85rem' }}
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
          winner={room.gameState.winner}
          reason={room.gameState.endReason}
          whitePlayerName={whiteName}
          blackPlayerName={blackName}
          onRematch={handleRequestRematch}
          onLobby={onLeaveRoom}
          onClose={() => setShowEndModal(false)}
        />
      )}
    </div>
  );
};

