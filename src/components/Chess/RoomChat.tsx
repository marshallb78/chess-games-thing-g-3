import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../../types/room';
import type { UserProfile } from '../../types/user';
import { roomService } from '../../lib/roomService';
import { MessageSquare, Send, BellOff, Bell } from 'lucide-react';

interface RoomChatProps {
  roomId: string;
  userProfile: UserProfile;
  opponentName?: string;
  opponentConnected?: boolean;
}

export const RoomChat: React.FC<RoomChatProps> = ({
  roomId,
  userProfile,
  opponentName = 'Opponent',
  opponentConnected = true
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = roomService.subscribeToChat(roomId, (msgs) => {
      setMessages(msgs);
    });
    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    try {
      await roomService.sendChatMessage(roomId, userProfile, text);
    } catch (err) {
      console.warn('Failed to send chat message:', err);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-surface)',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden'
      }}
    >
      {/* Chat header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 0.85rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'var(--text-secondary)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <MessageSquare size={16} />
          <span>Room Chat</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: opponentConnected ? 'var(--accent-green)' : 'var(--accent-red)'
              }}
            />
            <span style={{ color: opponentConnected ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
              {opponentName} {opponentConnected ? '(Online)' : '(Offline)'}
            </span>
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            style={{ background: 'transparent', color: isMuted ? 'var(--accent-red)' : 'var(--text-muted)' }}
            title={isMuted ? 'Unmute chat' : 'Mute chat notifications'}
          >
            {isMuted ? <BellOff size={14} /> : <Bell size={14} />}
          </button>
        </div>
      </div>

      {/* Messages list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          minHeight: '160px'
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', margin: 'auto' }}>
            Say hello to your opponent! Keep it friendly.
          </div>
        ) : (
          messages.map((m) => {
            const isSelf = m.senderUid === userProfile.uid;
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: isSelf ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  background: isSelf ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'var(--bg-card)',
                  padding: '6px 10px',
                  borderRadius: isSelf ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                  border: isSelf ? 'none' : '1px solid var(--border-subtle)',
                  fontSize: '0.84rem'
                }}
              >
                {!isSelf && (
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '2px' }}>
                    {m.senderName}
                  </div>
                )}
                <div style={{ wordBreak: 'break-word', color: '#f8fafc' }}>{m.text}</div>
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: isSelf ? 'rgba(255, 255, 255, 0.7)' : 'var(--text-muted)',
                    textAlign: 'right',
                    marginTop: '2px'
                  }}
                >
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <form
        onSubmit={handleSendMessage}
        style={{
          display: 'flex',
          gap: '0.4rem',
          padding: '0.5rem',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)'
        }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message (max 200 chars)..."
          maxLength={200}
          style={{ flex: 1, padding: '6px 10px', fontSize: '0.82rem' }}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="btn-primary"
          style={{ padding: '6px 12px' }}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
