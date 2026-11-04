# G+3 Games — Online Multiplayer Chess & Gaming Platform

Welcome to **G+3 Games**, a browser gaming platform built with React, TypeScript, Vite, Firebase Authentication, Firebase Realtime Database, `chess.js`, and `react-chessboard`.

---

## 🎮 Features Included & Working

1. **Full Chess Game Engine**:
   - Legal moves, piece captures, checks, checkmate, stalemate.
   - Castling (Kingside and Queenside) & En passant.
   - Interactive Pawn Promotion dialog (Queen, Rook, Bishop, Knight).
   - Draw detections: Insufficient material, Threefold repetition, 50-move rule, and mutual draw offers.
   - Resignation and timeout handling.
   - Drag-and-drop & Click-to-move support.
   - Legal move and target highlighting, in-check red King indicator, and last move highlighting.
   - Accurate digital clocks with 8 standard time controls (1+0, 2+1, 3+0, 3+2, 5+0, 10+0, 15+10, Casual).
   - Time increments applied automatically on moves.
   - Web Audio API synthesized sound effects for moves, captures, checks, and game endings (no external MP3 asset dependencies or 404s).
   - Board flip & optional auto-flip for Pass & Play.
   - Captured piece counters and material advantage calculation (+1, +3, etc.).
   - Move history in standard algebraic notation (SAN).

2. **Game Modes**:
   - **Pass & Play (Local 2P)**: Play side-by-side on the same computer.
   - **Play vs Computer Bot**: Practice single-player chess against an integrated engine.
   - **Online Multiplayer Private Rooms**: Create a room, get a 6-character room code, share an invite link, and play in real-time.

3. **Secure Authentication (Email & Password)**:
   - Dedicated Sign In, Create Account, and Forgot Password modes.
   - Prevention of duplicate account creation and silent account switching.
   - Session persistence across reloads.
   - Privacy-safe player profiles with unique Public IDs (`P######`). Email addresses are never exposed to other players.

4. **In-Game Chat & Social**:
   - Real-time room chat with 200-character limits and safe text rendering.
   - Player presence indicators (Online / Offline).

5. **Leaderboards**:
   - Global standings categorized by Rapid, Blitz, and Bullet with provisional badges.

6. **12 G+3 Planned Games Catalog**:
   - Shared platform layout with preview cards for future games (Checkers, Typing Grand Prix, Connect Four, etc.).

---

## 🚀 Quick Start Commands

### 1. Run Development Server Locally
```bash
npm run dev
```
Open the URL shown in your terminal (usually `http://localhost:5173`) in your browser.

### 2. Run Test Suite
```bash
npm test
```
Runs 12 unit tests verifying legal moves, castling, en passant, promotion, checkmate, stalemate, and draw conditions.

### 3. Build for Production
```bash
npm run build
```

### 4. Deploy to GitHub Pages
```bash
npm run deploy
```

---

## 🔒 Firebase Realtime Database Security Rules Setup

To protect your Firebase Realtime Database:
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project **`g-plus-games`**.
3. In the left navigation, click **Build** > **Realtime Database**.
4. Click the **Rules** tab at the top.
5. Replace the contents with the rules in `database.rules.json`:

```json
{
  "rules": {
    "profiles": {
      ".read": "auth != null",
      "$uid": {
        ".write": "auth != null && auth.uid === $uid",
        ".validate": "newData.hasChildren(['uid', 'displayName', 'publicId', 'createdAt'])",
        "uid": {
          ".validate": "newData.isString() && newData.val() === $uid"
        },
        "displayName": {
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 30"
        },
        "publicId": {
          ".validate": "newData.isString() && newData.val().length <= 15"
        },
        "createdAt": {
          ".validate": "newData.isNumber()"
        },
        "lastActive": {
          ".validate": "newData.isNumber()"
        },
        "email": {
          ".validate": "false"
        }
      }
    },
    "rooms": {
      ".read": "auth != null",
      "$roomId": {
        ".write": "auth != null && (!data.exists() || data.child('hostUid').val() === auth.uid || data.child('players/white/uid').val() === auth.uid || data.child('players/black/uid').val() === auth.uid || !data.child('players/black').exists())",
        ".validate": "newData.hasChildren(['roomId', 'roomCode', 'hostUid', 'status', 'timeControlId', 'createdAt'])",
        "roomId": {
          ".validate": "newData.isString() && newData.val() === $roomId"
        },
        "roomCode": {
          ".validate": "newData.isString() && newData.val().length >= 4 && newData.val().length <= 10"
        },
        "status": {
          ".validate": "newData.val() === 'waiting' || newData.val() === 'playing' || newData.val() === 'ended'"
        }
      }
    },
    "roomCodes": {
      ".read": "auth != null",
      "$code": {
        ".write": "auth != null && (!data.exists() || root.child('rooms/' + data.val() + '/hostUid').val() === auth.uid)",
        ".validate": "newData.isString()"
      }
    },
    "chat": {
      "$roomId": {
        ".read": "auth != null",
        "$messageId": {
          ".write": "auth != null && !data.exists() && newData.child('senderUid').val() === auth.uid",
          ".validate": "newData.hasChildren(['senderUid', 'senderName', 'text', 'timestamp']) && newData.child('text').isString() && newData.child('text').val().length <= 200"
        }
      }
    }
  }
}
```
6. Click **Publish**.
