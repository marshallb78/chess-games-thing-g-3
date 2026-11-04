import React from 'react';

export const ChessIllustration: React.FC<{ size?: number; className?: string }> = ({
  size = 360,
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
      {/* Background ambient glow */}
      <div
        style={{
          position: 'absolute',
          inset: '10%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.22) 0%, rgba(56, 189, 248, 0.08) 50%, transparent 75%)',
          filter: 'blur(32px)',
          zIndex: 0
        }}
      />

      <svg
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', zIndex: 1, filter: 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.7))' }}
      >
        <defs>
          {/* Radial & Linear gradients for dark theme styling */}
          <linearGradient id="boardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="darkSquare" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e2c4a" />
            <stop offset="100%" stopColor="#121a2d" />
          </linearGradient>

          <linearGradient id="lightSquare" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="goldPiece" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          <linearGradient id="cyanNeon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>

          <linearGradient id="shadowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
          </linearGradient>

          <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Hex / Isometric Platform Base */}
        <polygon
          points="200,30 360,120 360,280 200,370 40,280 40,120"
          fill="url(#boardGrad)"
          stroke="#1e2c4a"
          strokeWidth="3"
        />

        {/* 3D Depth Edges */}
        <polygon points="40,280 200,370 200,385 40,295" fill="#090d16" />
        <polygon points="360,280 200,370 200,385 360,295" fill="#0b111c" />

        {/* Isometric Checker Grid Pattern */}
        {/* Top diagonal grid representing the board surface */}
        <g opacity="0.95">
          {/* Row 1 */}
          <polygon points="200,80 235,100 200,120 165,100" fill="url(#darkSquare)" />
          <polygon points="235,100 270,120 235,140 200,120" fill="url(#lightSquare)" />
          <polygon points="270,120 305,140 270,160 235,140" fill="url(#darkSquare)" />

          {/* Row 2 */}
          <polygon points="165,100 200,120 165,140 130,120" fill="url(#lightSquare)" />
          <polygon points="200,120 235,140 200,160 165,140" fill="url(#darkSquare)" />
          <polygon points="235,140 270,160 235,180 200,160" fill="url(#lightSquare)" />
          <polygon points="270,160 305,180 270,200 235,180" fill="url(#darkSquare)" />

          {/* Row 3 */}
          <polygon points="130,120 165,140 130,160 95,140" fill="url(#darkSquare)" />
          <polygon points="165,140 200,160 165,180 130,160" fill="url(#lightSquare)" />
          <polygon points="200,160 235,180 200,200 165,180" fill="url(#darkSquare)" />
          <polygon points="235,180 270,200 235,220 200,200" fill="url(#lightSquare)" />

          {/* Row 4 */}
          <polygon points="95,140 130,160 95,180 60,160" fill="url(#lightSquare)" />
          <polygon points="130,160 165,180 130,200 95,180" fill="url(#darkSquare)" />
          <polygon points="165,180 200,200 165,220 130,200" fill="url(#lightSquare)" />
          <polygon points="200,200 235,220 200,240 165,220" fill="url(#darkSquare)" />
          <polygon points="235,220 270,240 235,260 200,240" fill="url(#lightSquare)" />

          {/* Row 5 */}
          <polygon points="95,180 130,200 95,220 60,200" fill="url(#darkSquare)" />
          <polygon points="130,200 165,220 130,240 95,220" fill="url(#lightSquare)" />
          <polygon points="165,220 200,240 165,260 130,240" fill="url(#darkSquare)" />
          <polygon points="200,240 235,260 200,280 165,260" fill="url(#lightSquare)" />

          {/* Row 6 */}
          <polygon points="95,220 130,240 95,260 60,240" fill="url(#lightSquare)" />
          <polygon points="130,240 165,260 130,280 95,260" fill="url(#darkSquare)" />
          <polygon points="165,260 200,280 165,300 130,280" fill="url(#lightSquare)" />
          <polygon points="200,280 235,300 200,320 165,300" fill="url(#darkSquare)" />
        </g>

        {/* Ambient Grid Accent Ring */}
        <polygon
          points="200,74 312,138 312,266 200,330 88,266 88,138"
          stroke="url(#cyanNeon)"
          strokeWidth="2"
          strokeDasharray="8 6"
          fill="none"
          opacity="0.8"
        />

        {/* Shadow under main Knight Piece */}
        <ellipse cx="200" cy="245" rx="35" ry="16" fill="url(#shadowGrad)" opacity="0.85" />

        {/* HERO CHESS PIECE: The Majestic Knight */}
        <g id="hero-knight" filter="url(#cyanGlow)">
          {/* Base */}
          <path
            d="M172 248 C172 242 228 242 228 248 L224 256 C224 260 176 260 176 256 Z"
            fill="url(#goldPiece)"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />
          <path
            d="M176 238 C176 234 224 234 224 238 L222 244 C222 246 178 246 178 244 Z"
            fill="url(#goldPiece)"
          />

          {/* Body & Arching Neck */}
          <path
            d="M182 238 C178 215 160 195 166 165 C170 145 185 130 198 120 C206 126 216 128 222 136 C220 144 214 148 210 152 C228 152 238 166 240 182 C242 196 235 208 232 216 C228 228 224 235 220 238 Z"
            fill="url(#goldPiece)"
            stroke="#38bdf8"
            strokeWidth="2"
          />

          {/* Mane Highlights */}
          <path
            d="M198 120 C186 132 178 152 176 170 C174 186 182 195 184 205"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M190 140 C184 150 182 165 182 178"
            stroke="#0ea5e9"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Snout & Jaw Detail */}
          <path
            d="M210 152 C214 158 220 162 226 162 C230 162 236 158 238 154 L222 136"
            fill="#e2e8f0"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />

          {/* Glowing Eye */}
          <circle cx="212" cy="144" r="3" fill="#38bdf8" />
          <circle cx="212" cy="144" r="1.5" fill="#ffffff" />
        </g>

        {/* Secondary Accenting Pieces (King Cross in background, Pawn flanking) */}
        {/* Opposing King Cross silhouette in background */}
        <g opacity="0.75" transform="translate(100, 100)">
          <path d="M40 50 L40 30 M33 36 L47 36" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M30 75 C30 60 50 60 50 75 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
        </g>

        {/* Small Flanking Pawn */}
        <g opacity="0.8" transform="translate(250, 180)">
          <circle cx="25" cy="20" r="10" fill="url(#goldPiece)" stroke="#38bdf8" strokeWidth="1.5" />
          <path d="M15 45 C15 32 35 32 35 45 Z" fill="url(#goldPiece)" stroke="#38bdf8" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
};
