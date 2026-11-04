import React from 'react';

export const ChessIllustration: React.FC<{ size?: number; className?: string }> = ({
  size = 400,
  className = ''
}) => {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        maxWidth: `${size}px`,
        aspectRatio: '1 / 1',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      {/* Background ambient radial glow */}
      <div
        style={{
          position: 'absolute',
          inset: '5%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.28) 0%, rgba(37, 99, 235, 0.12) 45%, transparent 70%)',
          filter: 'blur(36px)',
          zIndex: 0,
          animation: 'glowPulse 6s ease-in-out infinite alternate',
          pointerEvents: 'none'
        }}
      />

      {/* Floating vector illustration wrapper */}
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'heroFloat 5s ease-in-out infinite alternate',
          willChange: 'transform'
        }}
      >
        <svg
          viewBox="0 0 460 460"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            width: '100%',
            height: '100%',
            zIndex: 1,
            filter: 'drop-shadow(0 24px 36px rgba(0, 0, 0, 0.8))'
          }}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="boardEdgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            <linearGradient id="boardSurfaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e2c4a" />
              <stop offset="100%" stopColor="#0b1120" />
            </linearGradient>

            <linearGradient id="darkSquareGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="lightSquareGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="knightChrome" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#f1f5f9" />
              <stop offset="70%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            <linearGradient id="darkPiece" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="60%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="electricBlueNeon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>

            <radialGradient id="pieceShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0, 0, 0, 0.75)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>

            <filter id="subtleCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 3D Isometric Platform Base */}
          {/* Bottom bevel shadow */}
          <polygon points="50,330 230,425 230,442 50,347" fill="#020617" />
          <polygon points="410,330 230,425 230,442 410,347" fill="#050a14" />

          {/* Main platform slab */}
          <polygon
            points="230,55 410,150 410,330 230,425 50,330 50,150"
            fill="url(#boardEdgeGrad)"
            stroke="#1e3a8a"
            strokeWidth="2.5"
          />

          {/* Platform upper border accent */}
          <polygon
            points="230,65 398,154 398,322 230,412 62,322 62,154"
            fill="url(#boardSurfaceGrad)"
            stroke="rgba(56, 189, 248, 0.3)"
            strokeWidth="1.5"
          />

          {/* Isometric Chessboard Tiles */}
          <g opacity="0.95">
            {/* Row 1 */}
            <polygon points="230,105 270,126 230,147 190,126" fill="url(#darkSquareGrad)" />
            <polygon points="270,126 310,147 270,168 230,147" fill="url(#lightSquareGrad)" />
            <polygon points="310,147 350,168 310,189 270,168" fill="url(#darkSquareGrad)" />

            {/* Row 2 */}
            <polygon points="190,126 230,147 190,168 150,147" fill="url(#lightSquareGrad)" />
            <polygon points="230,147 270,168 230,189 190,168" fill="url(#darkSquareGrad)" />
            <polygon points="270,168 310,189 270,210 230,189" fill="url(#lightSquareGrad)" />
            <polygon points="310,189 350,210 310,231 270,210" fill="url(#darkSquareGrad)" />

            {/* Row 3 */}
            <polygon points="150,147 190,168 150,189 110,168" fill="url(#darkSquareGrad)" />
            <polygon points="190,168 230,189 190,210 150,189" fill="url(#lightSquareGrad)" />
            <polygon points="230,189 270,210 230,231 190,210" fill="url(#darkSquareGrad)" />
            <polygon points="270,210 310,231 270,252 230,231" fill="url(#lightSquareGrad)" />

            {/* Row 4 */}
            <polygon points="110,168 150,189 110,210 70,189" fill="url(#lightSquareGrad)" />
            <polygon points="150,189 190,210 150,231 110,210" fill="url(#darkSquareGrad)" />
            <polygon points="190,210 230,231 190,252 150,231" fill="url(#lightSquareGrad)" />
            <polygon points="230,231 270,252 230,273 190,252" fill="url(#darkSquareGrad)" />
            <polygon points="270,252 310,273 270,294 230,273" fill="url(#lightSquareGrad)" />

            {/* Row 5 */}
            <polygon points="110,210 150,231 110,252 70,231" fill="url(#darkSquareGrad)" />
            <polygon points="150,231 190,252 150,273 110,252" fill="url(#lightSquareGrad)" />
            <polygon points="190,252 230,273 190,294 150,273" fill="url(#darkSquareGrad)" />
            <polygon points="230,273 270,294 230,315 190,294" fill="url(#lightSquareGrad)" />

            {/* Row 6 */}
            <polygon points="110,252 150,273 110,294 70,273" fill="url(#lightSquareGrad)" />
            <polygon points="150,273 190,294 150,315 110,294" fill="url(#darkSquareGrad)" />
            <polygon points="190,294 230,315 190,336 150,315" fill="url(#lightSquareGrad)" />
            <polygon points="230,315 270,336 230,357 190,336" fill="url(#darkSquareGrad)" />
          </g>

          {/* Board Accent Geometric Circuit Lines */}
          <polygon
            points="230,95 358,162 358,302 230,369 102,302 102,162"
            stroke="url(#electricBlueNeon)"
            strokeWidth="1.75"
            strokeDasharray="10 8"
            fill="none"
            opacity="0.75"
          />

          {/* BACK-ROW PIECE: Majestic King silhouette with glowing cross */}
          <g opacity="0.82" transform="translate(132, 115)">
            <ellipse cx="25" cy="80" rx="20" ry="8" fill="url(#pieceShadow)" />
            {/* King Base & Pedestal */}
            <path d="M10 75 C10 68 40 68 40 75 L38 82 C38 85 12 85 12 82 Z" fill="url(#darkPiece)" stroke="#38bdf8" strokeWidth="1" />
            <path d="M14 68 C14 52 36 52 36 68 Z" fill="url(#darkPiece)" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" />
            {/* King Crown */}
            <path d="M12 52 C12 42 38 42 38 52 L36 38 C30 40 20 40 14 38 Z" fill="url(#darkPiece)" stroke="#38bdf8" strokeWidth="1" />
            {/* Cross */}
            <path d="M25 38 L25 18 M19 24 L31 24" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" filter="url(#subtleCyanGlow)" />
          </g>

          {/* BACK-ROW PIECE: Sleek Queen */}
          <g opacity="0.8" transform="translate(268, 138)">
            <ellipse cx="22" cy="74" rx="18" ry="7" fill="url(#pieceShadow)" />
            <path d="M8 70 C8 64 36 64 36 70 L34 76 C34 78 10 78 10 76 Z" fill="url(#darkPiece)" stroke="rgba(56, 189, 248, 0.5)" strokeWidth="1" />
            <path d="M12 64 C12 50 32 50 32 64 Z" fill="url(#darkPiece)" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" />
            {/* Coronet */}
            <path d="M10 48 L14 34 L18 42 L22 30 L26 42 L30 34 L34 48 Z" fill="url(#darkPiece)" stroke="#38bdf8" strokeWidth="1" />
            <circle cx="22" cy="27" r="2.5" fill="#38bdf8" filter="url(#subtleCyanGlow)" />
          </g>

          {/* FLANKING PIECE: Sleek Rook in mid-left */}
          <g opacity="0.75" transform="translate(75, 192)">
            <ellipse cx="20" cy="65" rx="16" ry="6" fill="url(#pieceShadow)" />
            <path d="M8 60 C8 55 32 55 32 60 L30 66 C30 68 10 68 10 66 Z" fill="url(#darkPiece)" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" />
            <path d="M11 55 L12 40 L28 40 L29 55 Z" fill="url(#darkPiece)" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="1" />
            <path d="M9 40 L9 32 L14 32 L14 35 L17 35 L17 32 L23 32 L23 35 L26 35 L26 32 L31 32 L31 40 Z" fill="url(#darkPiece)" stroke="#38bdf8" strokeWidth="1" />
          </g>

          {/* HERO CENTERPIECE: The Majestic Chrome & Cyan Knight */}
          {/* Shadow under main Knight */}
          <ellipse cx="230" cy="298" rx="46" ry="18" fill="url(#pieceShadow)" opacity="0.9" />

          <g id="hero-knight" filter="url(#subtleCyanGlow)">
            {/* Pedestal Base */}
            <path
              d="M196 295 C196 288 264 288 264 295 L258 305 C258 310 202 310 202 305 Z"
              fill="url(#knightChrome)"
              stroke="#38bdf8"
              strokeWidth="2"
            />
            {/* Tier 2 Base ring */}
            <path
              d="M202 284 C202 278 258 278 258 284 L255 292 C255 295 205 295 205 292 Z"
              fill="url(#knightChrome)"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />

            {/* Muscular Neck & Head */}
            <path
              d="M208 284 C204 256 182 232 190 196 C195 172 212 154 228 142 C238 148 250 151 258 160 C256 170 248 174 244 180 C264 180 276 196 278 216 C280 234 272 248 268 258 C264 272 258 280 254 284 Z"
              fill="url(#knightChrome)"
              stroke="#38bdf8"
              strokeWidth="2.2"
            />

            {/* Sculpted Mane Plates */}
            <path
              d="M228 142 C214 156 204 180 202 202 C200 222 210 232 212 245"
              stroke="#38bdf8"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M218 166 C210 178 208 196 208 212"
              stroke="#0ea5e9"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M214 200 C210 212 212 226 216 238"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Snout, Nostril & Jaw */}
            <path
              d="M244 180 C248 188 256 192 264 192 C270 192 276 186 278 180 L258 160"
              fill="#f8fafc"
              stroke="#38bdf8"
              strokeWidth="1.75"
            />
            {/* Nostril */}
            <ellipse cx="264" cy="184" rx="2.5" ry="1.5" fill="#0284c7" />

            {/* Glowing Cyan Eye */}
            <circle cx="246" cy="170" r="3.5" fill="#38bdf8" />
            <circle cx="246" cy="170" r="1.5" fill="#ffffff" />
          </g>

          {/* Ambient light spark particles */}
          <circle cx="230" cy="115" r="2" fill="#38bdf8" opacity="0.8" />
          <circle cx="170" cy="160" r="1.5" fill="#60a5fa" opacity="0.6" />
          <circle cx="295" cy="190" r="2" fill="#38bdf8" opacity="0.7" />
          <circle cx="340" cy="270" r="1.5" fill="#93c5fd" opacity="0.5" />
        </svg>
      </div>
    </div>
  );
};
