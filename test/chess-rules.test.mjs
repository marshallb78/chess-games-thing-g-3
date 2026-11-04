import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { getCapturedPieces, findKingSquare } from '../src/lib/chessUtils.ts';

test('Chess engine initializes correctly with 32 pieces and standard FEN', () => {
  const chess = new Chess();
  assert.equal(chess.fen(), 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  assert.equal(chess.turn(), 'w');
  assert.equal(chess.isGameOver(), false);
  assert.equal(chess.moves().length, 20); // 16 pawn moves + 4 knight moves
});

test('Legal moves: 1. e4 e5 2. Nf3 Nc6', () => {
  const chess = new Chess();
  const m1 = chess.move('e4');
  assert.ok(m1);
  assert.equal(chess.turn(), 'b');

  const m2 = chess.move('e5');
  assert.ok(m2);

  const m3 = chess.move('Nf3');
  assert.ok(m3);

  const m4 = chess.move('Nc6');
  assert.ok(m4);
});

test('Castling: White kingside castling (O-O) and Queenside (O-O-O)', () => {
  // Setup position for castling
  const chess = new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
  
  // Kingside castling
  const moveResult = chess.move('O-O');
  assert.ok(moveResult);
  assert.equal(chess.get('g1')?.type, 'k');
  assert.equal(chess.get('f1')?.type, 'r');

  // Black queenside castling
  const bMove = chess.move('O-O-O');
  assert.ok(bMove);
  assert.equal(chess.get('c8')?.type, 'k');
  assert.equal(chess.get('d8')?.type, 'r');
});

test('En Passant capture', () => {
  const chess = new Chess('rnbqkbnr/pppp1ppp/8/4pP2/8/8/PPPPP1PP/RNBQKBNR w KQkq e6 0 3');
  // White pawn on f5 captures black pawn on e5 en passant after e7-e5
  const epMove = chess.move('fxe6');
  assert.ok(epMove);
  assert.equal(epMove.flags.includes('e'), true); // en passant flag
  assert.ok(!chess.get('e5')); // black pawn captured
  assert.equal(chess.get('e6')?.type, 'p');
  assert.equal(chess.get('e6')?.color, 'w');
});

test('Pawn promotion to Queen, Rook, Bishop, Knight', () => {
  const promoFen = '8/4P3/8/8/8/8/8/4K2k w - - 0 1';
  
  ['q', 'r', 'b', 'n'].forEach((piece) => {
    const chess = new Chess(promoFen);
    const move = chess.move({ from: 'e7', to: 'e8', promotion: piece });
    assert.ok(move);
    assert.equal(chess.get('e8')?.type, piece);
  });
});

test('Check and Checkmate detection: Scholars Mate', () => {
  const chess = new Chess();
  chess.move('e4');
  chess.move('e5');
  chess.move('Bc4');
  chess.move('Nc6');
  chess.move('Qh5');
  chess.move('Nf6');
  chess.move('Qxf7#'); // Scholar's mate

  assert.equal(chess.inCheck(), true);
  assert.equal(chess.isCheckmate(), true);
  assert.equal(chess.isGameOver(), true);
});

test('Stalemate detection', () => {
  // Known stalemate position: Black king on a8, White queen on c7, White king on a6
  const chess = new Chess('k7/2Q5/K7/8/8/8/8/8 b - - 0 1');
  assert.equal(chess.inCheck(), false);
  assert.equal(chess.isStalemate(), true);
  assert.equal(chess.isGameOver(), true);
});

test('Insufficient material detection (King vs King, King & Bishop vs King)', () => {
  const chess1 = new Chess('8/8/8/8/8/4k3/8/4K3 w - - 0 1');
  assert.equal(chess1.isInsufficientMaterial(), true);
  assert.equal(chess1.isGameOver(), true);

  const chess2 = new Chess('8/8/8/8/8/4k3/5B2/4K3 w - - 0 1');
  assert.equal(chess2.isInsufficientMaterial(), true);
  assert.equal(chess2.isGameOver(), true);
});

test('Threefold repetition detection', () => {
  const chess = new Chess();
  // Move knights back and forth 3 times
  chess.move('Nf3'); chess.move('Nf6');
  chess.move('Ng1'); chess.move('Ng8');
  chess.move('Nf3'); chess.move('Nf6');
  chess.move('Ng1'); chess.move('Ng8');
  assert.equal(chess.isThreefoldRepetition(), true);
  assert.equal(chess.isDraw(), true);
});

test('Fifty-move rule detection', () => {
  // Halfmove clock at 100
  const chess = new Chess('8/8/8/8/8/4k3/4r3/4K3 w - - 100 1');
  assert.equal(chess.isDrawByFiftyMoves(), true);
});

test('King square locator', () => {
  const chess = new Chess();
  assert.equal(findKingSquare(chess, 'w'), 'e1');
  assert.equal(findKingSquare(chess, 'b'), 'e8');
});

test('Captured pieces and material calculation', () => {
  const chess = new Chess();
  // Play e4 d5, exd5 (white captures black pawn)
  chess.move('e4');
  chess.move('d5');
  chess.move('exd5');

  const { whiteCaptured, blackCaptured, whiteScore, blackScore } = getCapturedPieces(chess);
  assert.equal(whiteCaptured.p, 1); // White captured 1 black pawn
  assert.equal(blackCaptured.p, 0);
  assert.equal(whiteScore, 1); // White is +1
  assert.equal(blackScore, -1);
});
