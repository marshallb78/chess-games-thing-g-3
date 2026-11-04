import React, { useState, useMemo } from 'react';
import { Chess, type Square, type PieceSymbol } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { findKingSquare } from '../../lib/chessUtils';
import { PromotionDialog } from './PromotionDialog';

interface ChessBoardViewProps {
  chess: Chess;
  boardOrientation: 'white' | 'black';
  isInteractive: boolean;
  onMakeMove: (from: Square, to: Square, promotion?: PieceSymbol) => boolean;
}

export const ChessBoardView: React.FC<ChessBoardViewProps> = ({
  chess,
  boardOrientation,
  isInteractive,
  onMakeMove
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  // Compute legal moves from the currently selected square
  const legalMovesFromSelected = useMemo(() => {
    if (!selectedSquare || !isInteractive) return [];
    try {
      return chess.moves({ square: selectedSquare, verbose: true });
    } catch {
      return [];
    }
  }, [chess, selectedSquare, isInteractive]);

  // Compute custom square styles (selected, legal moves, check, last move)
  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // 1. Highlight in-check King in red
    if (chess.inCheck()) {
      const kingSq = findKingSquare(chess, chess.turn());
      if (kingSq) {
        styles[kingSq] = {
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.4) 65%, transparent 100%)',
          borderRadius: '4px'
        };
      }
    }

    // 2. Highlight last move (if any)
    const history = chess.history({ verbose: true });
    if (history.length > 0) {
      const lastMove = history[history.length - 1];
      styles[lastMove.from] = {
        background: 'rgba(234, 179, 8, 0.25)'
      };
      styles[lastMove.to] = {
        background: 'rgba(234, 179, 8, 0.35)'
      };
    }

    // 3. Highlight currently selected square
    if (selectedSquare) {
      styles[selectedSquare] = {
        background: 'rgba(56, 189, 248, 0.4)',
        boxShadow: 'inset 0 0 0 2px var(--accent-cyan)'
      };
    }

    // 4. Highlight legal destination squares
    legalMovesFromSelected.forEach((move) => {
      const isCapture = !!move.captured;
      styles[move.to] = {
        background: isCapture
          ? 'radial-gradient(circle, rgba(239, 68, 68, 0.5) 20%, transparent 22%)'
          : 'radial-gradient(circle, rgba(56, 189, 248, 0.7) 20%, transparent 22%)',
        boxShadow: isCapture ? 'inset 0 0 0 3px rgba(239, 68, 68, 0.6)' : undefined,
        cursor: 'pointer'
      };
    });

    return styles;
  }, [chess, selectedSquare, legalMovesFromSelected]);

  // Handle piece drop (drag and drop)
  const handlePieceDrop = ({
    sourceSquare,
    targetSquare
  }: {
    piece: { pieceType: string };
    sourceSquare: string;
    targetSquare: string | null;
  }): boolean => {
    if (!isInteractive || !targetSquare) return false;

    const from = sourceSquare as Square;
    const to = targetSquare as Square;

    // Check if move is a pawn promotion
    const pieceOnFrom = chess.get(from);
    if (
      pieceOnFrom &&
      pieceOnFrom.type === 'p' &&
      ((pieceOnFrom.color === 'w' && to[1] === '8') ||
        (pieceOnFrom.color === 'b' && to[1] === '1'))
    ) {
      // Verify if the move to 'to' is legally possible with promotion
      const moves = chess.moves({ square: from, verbose: true });
      const canPromoteTo = moves.some((m) => m.to === to && m.promotion);
      if (canPromoteTo) {
        setPendingPromotion({ from, to });
        return false; // will be completed after piece selection in modal
      }
    }

    const success = onMakeMove(from, to);
    setSelectedSquare(null);
    return success;
  };

  // Handle click-to-move
  const handleSquareClick = ({ square }: { square: string }) => {
    if (!isInteractive) return;
    const clickedSq = square as Square;
    const piece = chess.get(clickedSq);

    // If already selected a square, try to move to clickedSq
    if (selectedSquare) {
      if (selectedSquare === clickedSq) {
        setSelectedSquare(null);
        return;
      }

      // Check if clicked square is a legal move
      const isLegal = legalMovesFromSelected.some((m) => m.to === clickedSq);
      if (isLegal) {
        // Check promotion
        const pieceOnFrom = chess.get(selectedSquare);
        if (
          pieceOnFrom &&
          pieceOnFrom.type === 'p' &&
          ((pieceOnFrom.color === 'w' && clickedSq[1] === '8') ||
            (pieceOnFrom.color === 'b' && clickedSq[1] === '1'))
        ) {
          setPendingPromotion({ from: selectedSquare, to: clickedSq });
          setSelectedSquare(null);
          return;
        }

        onMakeMove(selectedSquare, clickedSq);
        setSelectedSquare(null);
        return;
      }

      // If clicked another own piece, switch selection
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(clickedSq);
        return;
      }

      setSelectedSquare(null);
      return;
    }

    // No square selected yet: select if it's current player's piece
    if (piece && piece.color === chess.turn()) {
      setSelectedSquare(clickedSq);
    }
  };

  return (
    <div className="chess-board-wrapper">
      <Chessboard
        options={{
          position: chess.fen(),
          boardOrientation: boardOrientation,
          allowDragging: isInteractive,
          showAnimations: true,
          animationDurationInMs: 200,
          darkSquareStyle: { backgroundColor: 'var(--board-dark)' },
          lightSquareStyle: { backgroundColor: 'var(--board-light)' },
          squareStyles: customSquareStyles,
          onPieceDrop: handlePieceDrop,
          onSquareClick: handleSquareClick
        }}
      />

      {pendingPromotion && (
        <PromotionDialog
          color={chess.turn()}
          onSelectPiece={(promoPiece) => {
            const { from, to } = pendingPromotion;
            setPendingPromotion(null);
            onMakeMove(from, to, promoPiece);
          }}
          onCancel={() => {
            setPendingPromotion(null);
            setSelectedSquare(null);
          }}
        />
      )}
    </div>
  );
};
