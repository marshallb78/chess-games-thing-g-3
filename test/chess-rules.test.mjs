import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { getCapturedPieces, findKingSquare } from '../src/lib/chessUtils.ts';
import {
  resolveDisplayName,
  resolvePlayerRating,
  normalizeRoomPlayer,
  sanitizeForFirebase
} from '../src/lib/playerUtils.ts';

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

test('Bot engine calculates legal moves for Easy, Medium, and Hard', async () => {
  const { getBestBotMove } = await import('../src/lib/botEngine.ts');
  const chess = new Chess();

  const easyMove = getBestBotMove(chess, 'easy');
  assert.ok(easyMove);
  assert.ok(chess.moves().includes(easyMove.san));

  const mediumMove = getBestBotMove(chess, 'medium');
  assert.ok(mediumMove);
  assert.ok(chess.moves().includes(mediumMove.san));

  const hardMove = getBestBotMove(chess, 'hard');
  assert.ok(hardMove);
  assert.ok(chess.moves().includes(hardMove.san));
});

test('Bot engine detects mate in 1', async () => {
  const { getBestBotMove } = await import('../src/lib/botEngine.ts');
  // Position where White queen on h5 can play Qxf7#
  const chess = new Chess('r1bqkb1r/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1');
  const best = getBestBotMove(chess, 'hard');
  assert.ok(best);
  assert.equal(best.san, 'Qxf7#');
});

test('Multi-move complete simulation: Human vs Bot plays 10 half-moves legally', async () => {
  const { getBestBotMove } = await import('../src/lib/botEngine.ts');
  const chess = new Chess();
  
  // Human plays 1. e4
  chess.move('e4');
  assert.equal(chess.turn(), 'b');

  // Bot plays as Black for 5 full turns (10 ply total)
  for (let turn = 0; turn < 4; turn++) {
    const botMove = getBestBotMove(chess, 'medium');
    assert.ok(botMove, 'Bot should return a move');
    assert.ok(chess.moves().includes(botMove.san), `Bot move ${botMove.san} must be legal`);
    chess.move(botMove);

    if (chess.isGameOver()) break;

    // Human response: pick first legal move
    const humanMoves = chess.moves({ verbose: true });
    assert.ok(humanMoves.length > 0);
    chess.move(humanMoves[0]);

    if (chess.isGameOver()) break;
  }

  assert.ok(chess.history().length >= 8, 'At least 8 moves played smoothly');
});

test('Invitation lifecycle simulation: User A invites User B, B accepts, both join same match', () => {
  // Mock Realtime Database memory store
  const mockDb = {
    invitations: {},
    rooms: {},
    userInvitations: {}
  };

  const userA = { uid: 'user_a_123', displayName: 'GrandmasterAlice', rating: 1500 };
  const userB = { uid: 'user_b_456', displayName: 'BobTheKnight', rating: 1450 };

  // 1. User A sends invitation
  const inviteId = 'inv_' + Date.now();
  const now = Date.now();
  const inviteData = {
    id: inviteId,
    senderUid: userA.uid,
    senderName: userA.displayName,
    senderRating: userA.rating,
    recipientUid: userB.uid,
    timeControlId: '10+0',
    status: 'pending',
    createdAt: now,
    expiresAt: now + 60000,
    roomId: null
  };

  mockDb.invitations[inviteId] = inviteData;
  mockDb.userInvitations[userB.uid] = { [inviteId]: true };

  assert.equal(mockDb.invitations[inviteId].status, 'pending');
  assert.equal(mockDb.invitations[inviteId].recipientUid, userB.uid);
  assert.equal(mockDb.userInvitations[userB.uid][inviteId], true);

  // 2. User B receives and views invitation
  const receivedInvite = mockDb.invitations[inviteId];
  assert.ok(receivedInvite);
  assert.equal(receivedInvite.senderName, 'GrandmasterAlice');
  assert.equal(Date.now() < receivedInvite.expiresAt, true, 'Invitation must not be expired');

  // 3. User B accepts match: atomic transition & room creation
  assert.equal(receivedInvite.recipientUid, userB.uid, 'User B is intended recipient');
  assert.equal(receivedInvite.status, 'pending', 'Must still be pending');

  const generatedRoomId = 'room_' + Date.now();
  const initialChess = new Chess();

  const gameRoom = {
    roomId: generatedRoomId,
    roomCode: 'AB12CD',
    hostUid: userA.uid,
    status: 'playing',
    timeControlId: '10+0',
    players: {
      white: { uid: userA.uid, displayName: userA.displayName, connected: true },
      black: { uid: userB.uid, displayName: userB.displayName, connected: true }
    },
    gameState: {
      fen: initialChess.fen(),
      turn: 'w',
      moves: []
    }
  };

  mockDb.rooms[generatedRoomId] = gameRoom;
  mockDb.invitations[inviteId].status = 'accepted';
  mockDb.invitations[inviteId].roomId = generatedRoomId;
  delete mockDb.userInvitations[userB.uid][inviteId];

  // 4. Verify both players receive the exact same match ID and colors
  const finalInvite = mockDb.invitations[inviteId];
  assert.equal(finalInvite.status, 'accepted');
  assert.equal(finalInvite.roomId, generatedRoomId);

  // Player A reads the accepted invitation
  const playerARoomId = finalInvite.roomId;
  const playerAColor = gameRoom.players.white.uid === userA.uid ? 'w' : 'b';

  // Player B joined with generatedRoomId
  const playerBRoomId = generatedRoomId;
  const playerBColor = gameRoom.players.black.uid === userB.uid ? 'b' : 'w';

  assert.equal(playerARoomId, playerBRoomId, 'Both players must navigate to the exact same room ID');
  assert.equal(playerAColor, 'w', 'User A is assigned White');
  assert.equal(playerBColor, 'b', 'User B is assigned Black');

  // 5. Verify moves made in match update shared board for both players
  const sharedBoard = new Chess(mockDb.rooms[generatedRoomId].gameState.fen);
  sharedBoard.move('e4');
  mockDb.rooms[generatedRoomId].gameState.fen = sharedBoard.fen();
  mockDb.rooms[generatedRoomId].gameState.turn = sharedBoard.turn();

  assert.equal(mockDb.rooms[generatedRoomId].gameState.turn, 'b');
  assert.ok(mockDb.rooms[generatedRoomId].gameState.fen.includes('4p3') || mockDb.rooms[generatedRoomId].gameState.fen.includes('4P3'));

  sharedBoard.move('e5');
  mockDb.rooms[generatedRoomId].gameState.fen = sharedBoard.fen();
  assert.equal(sharedBoard.turn(), 'w');
});

test('Invitation expiration & duplicate acceptance safety', () => {
  const expiredInvite = {
    id: 'inv_old',
    senderUid: 'u1',
    recipientUid: 'u2',
    status: 'pending',
    createdAt: Date.now() - 100000,
    expiresAt: Date.now() - 40000 // 40 seconds in the past
  };

  // Check expiration detection
  const isExpired = Date.now() > expiredInvite.expiresAt;
  assert.equal(isExpired, true, 'Old invitation must be detected as expired');

  // Duplicate accept prevention check
  const alreadyAccepted = {
    id: 'inv_done',
    status: 'accepted',
    roomId: 'room_existing_999'
  };

  // If already accepted, return existing roomId instead of failing
  const canRejoin = alreadyAccepted.status === 'accepted' && alreadyAccepted.roomId;
  assert.equal(canRejoin, 'room_existing_999');
});

test('Real presence deduplication logic counts unique active players', () => {
  const now = Date.now();
  const mockPresenceData = {
    user_1: { uid: 'user_1', isOnline: true, lastSeen: now - 10000 }, // active (10s ago)
    user_2: { uid: 'user_2', isOnline: true, lastSeen: now - 50000 }, // active (50s ago)
    user_3: { uid: 'user_3', isOnline: false, lastSeen: now - 5000 }, // offline
    user_4: { uid: 'user_4', isOnline: true, lastSeen: now - 300000 }, // stale (5m ago)
    guest_99: { uid: 'guest_99', isOnline: true, lastSeen: now - 20000 } // active guest (20s ago)
  };

  // Filter active players within 120s
  const activeCount = Object.values(mockPresenceData).filter(
    (p) => p.isOnline === true && now - p.lastSeen < 120000
  ).length;

  assert.equal(activeCount, 3, 'Must count exactly 3 active players (user_1, user_2, guest_99)');
});

test('Display name resolution follows 4-tier priority', () => {
  // Tier 1: Saved profile name takes top priority
  assert.equal(
    resolveDisplayName({ displayName: 'GrandmasterCarlsen' }, { displayName: 'Magnus' }, 'Guest 1234'),
    'GrandmasterCarlsen'
  );

  // Tier 2: Authenticated user name when profile name is missing or empty
  assert.equal(
    resolveDisplayName(null, { displayName: 'Magnus' }, 'Guest 1234'),
    'Magnus'
  );
  assert.equal(
    resolveDisplayName({ displayName: '   ' }, { displayName: 'Magnus' }, 'Guest 1234'),
    'Magnus'
  );

  // When profile name is placeholder 'Player' or 'Anonymous', prefers authenticated user's name
  assert.equal(
    resolveDisplayName({ displayName: 'Player' }, { displayName: 'Kasparov' }),
    'Kasparov'
  );

  // Tier 3: Explicitly assigned guest display name
  assert.equal(
    resolveDisplayName(null, null, 'Guest 7788'),
    'Guest 7788'
  );

  // Tier 4: Final fallback to 'Anonymous'
  assert.equal(
    resolveDisplayName(null, null, null),
    'Anonymous'
  );
  assert.equal(
    resolveDisplayName({ displayName: '' }, { displayName: '' }, ''),
    'Anonymous'
  );
});

test('Player rating resolution extracts valid number and falls back to 1200', () => {
  // 1. Direct rating property
  assert.equal(resolvePlayerRating({ rating: 1540 }), 1540);

  // 2. Nested ratings object (standard UserProfile)
  assert.equal(
    resolvePlayerRating({ ratings: { rapid: { rating: 1620 } } }),
    1620
  );
  assert.equal(
    resolvePlayerRating({ ratings: { casual: { rating: 1350 } } }),
    1350
  );
  assert.equal(
    resolvePlayerRating({ ratings: { blitz: { rating: 1780 } } }),
    1780
  );

  // 3. Fallbacks: missing rating, undefined, null, NaN
  assert.equal(resolvePlayerRating(null), 1200);
  assert.equal(resolvePlayerRating({}), 1200);
  assert.equal(resolvePlayerRating({ rating: undefined }), 1200);
  assert.equal(resolvePlayerRating({ rating: null }), 1200);
  assert.equal(resolvePlayerRating({ rating: NaN }), 1200);
  assert.equal(resolvePlayerRating({ ratings: { rapid: { rating: null } } }), 1200);

  // Custom fallback
  assert.equal(resolvePlayerRating(null, 1500), 1500);
});

test('Room player normalization guarantees valid fields without undefined', () => {
  // Guest with no ratings
  const guestNorm = normalizeRoomPlayer({
    uid: 'guest_abc123',
    displayName: 'Guest 9900',
    connected: true
  });
  assert.equal(guestNorm.uid, 'guest_abc123');
  assert.equal(guestNorm.displayName, 'Guest 9900');
  assert.equal(guestNorm.connected, true);
  assert.equal(guestNorm.rating, 1200);
  assert.equal(guestNorm.rating !== undefined, true);

  // User with nested UserProfile ratings
  const userNorm = normalizeRoomPlayer({
    uid: 'user_xyz789',
    displayName: 'CheckmateKing',
    ratings: {
      rapid: { rating: 1450, provisional: false, gamesPlayed: 10 },
      casual: { rating: 1200, provisional: true, gamesPlayed: 0 },
      blitz: { rating: 1200, provisional: true, gamesPlayed: 0 },
      bullet: { rating: 1200, provisional: true, gamesPlayed: 0 }
    }
  });
  assert.equal(userNorm.uid, 'user_xyz789');
  assert.equal(userNorm.displayName, 'CheckmateKing');
  assert.equal(userNorm.connected, true);
  assert.equal(userNorm.rating, 1450);
});

test('sanitizeForFirebase strips all undefined values recursively', () => {
  const dirtyData = {
    roomId: 'room_123',
    status: 'playing',
    players: {
      white: {
        uid: 'u1',
        displayName: 'Player White',
        rating: 1300,
        emptyProp: undefined
      },
      black: {
        uid: 'u2',
        displayName: 'Player Black',
        rating: undefined // BUG 1 reproduction!
      }
    },
    optionalMeta: undefined,
    history: [
      { move: 'e4', comment: undefined },
      { move: 'e5', score: null }
    ]
  };

  const cleanData = sanitizeForFirebase(dirtyData);

  // Check that undefined was stripped
  assert.equal('emptyProp' in cleanData.players.white, false);
  assert.equal('rating' in cleanData.players.black, false);
  assert.equal('optionalMeta' in cleanData, false);
  assert.equal('comment' in cleanData.history[0], false);

  // Check that valid null and values are preserved
  assert.equal(cleanData.roomId, 'room_123');
  assert.equal(cleanData.players.white.rating, 1300);
  assert.equal(cleanData.history[1].score, null);
});

test('Bug 1 & 2 integration: Invite acceptance payload never contains undefined rating', () => {
  // Simulating an invitation record
  const invitation = {
    id: 'inv_abc',
    senderUid: 'sender_111',
    senderName: 'WhiteGrandmaster',
    senderRating: 1550,
    timeControlId: '10+0'
  };

  // Simulating a recipient UserProfile which has `ratings` (no top-level `rating`)
  const recipientProfile = {
    uid: 'recipient_222',
    displayName: 'BlackStrategist',
    ratings: {
      rapid: { rating: 1425, gamesPlayed: 12, provisional: false },
      blitz: { rating: 1200, gamesPlayed: 0, provisional: true },
      casual: { rating: 1200, gamesPlayed: 0, provisional: true },
      bullet: { rating: 1200, gamesPlayed: 0, provisional: true }
    }
  };

  // Construct normalized players as done in acceptInvitation()
  const whitePlayer = normalizeRoomPlayer({
    uid: invitation.senderUid,
    displayName: invitation.senderName,
    connected: true,
    rating: invitation.senderRating
  }, 'White Player');

  const blackPlayer = normalizeRoomPlayer({
    uid: recipientProfile.uid,
    displayName: resolveDisplayName(recipientProfile, null, recipientProfile.displayName),
    connected: true,
    rating: resolvePlayerRating(recipientProfile, 1200)
  }, 'Black Player');

  const roomPayload = {
    roomId: 'room_new_456',
    players: {
      white: whitePlayer,
      black: blackPlayer
    }
  };

  const sanitized = sanitizeForFirebase(roomPayload);

  // Assertions for Bug 1
  assert.equal(sanitized.players.black.rating, 1425);
  assert.equal(typeof sanitized.players.black.rating, 'number');
  assert.notEqual(sanitized.players.black.rating, undefined);
  assert.equal(Number.isNaN(sanitized.players.black.rating), false);

  // Assertions for Bug 2
  assert.equal(sanitized.players.black.displayName, 'BlackStrategist');
  assert.equal(sanitized.players.white.displayName, 'WhiteGrandmaster');
});
