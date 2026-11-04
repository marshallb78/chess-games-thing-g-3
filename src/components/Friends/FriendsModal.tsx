import React, { useState, useEffect } from 'react';
import type { FriendEntry, IncomingFriendRequest, OnlinePresenceUser } from '../../lib/onlineService';
import { onlineService } from '../../lib/onlineService';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../Common/ConfirmModal';
import { UserPlus, Users, Check, X, Search, Swords, UserMinus, ShieldAlert } from 'lucide-react';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    uid: string;
    displayName: string;
    isGuest?: boolean;
  } | null;
  onInviteFriend: (friendUid: string, friendName: string) => void;
  onOpenAuth: () => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onInviteFriend,
  onOpenAuth
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [requests, setRequests] = useState<IncomingFriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OnlinePresenceUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [requestSentMap, setRequestSentMap] = useState<Record<string, boolean>>({});
  const [friendToRemove, setFriendToRemove] = useState<FriendEntry | null>(null);

  useEffect(() => {
    if (!isOpen || !currentUser || currentUser.isGuest) return;

    const unsubFriends = onlineService.subscribeToFriends(currentUser.uid, setFriends);
    const unsubReqs = onlineService.subscribeToFriendRequests(currentUser.uid, setRequests);

    return () => {
      unsubFriends();
      unsubReqs();
    };
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await onlineService.searchRegisteredPlayers(searchQuery);
      setSearchResults(results.filter((r) => r.uid !== currentUser?.uid));
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (targetUid: string) => {
    if (!currentUser) return;
    try {
      await onlineService.sendFriendRequest(currentUser, targetUid);
      setRequestSentMap((prev) => ({ ...prev, [targetUid]: true }));
      showToast({ type: 'success', message: 'Friend request sent!' });
    } catch (err: unknown) {
      showToast({ type: 'error', message: (err as Error).message || 'Failed to send request' });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', position: 'relative', minHeight: '440px', display: 'flex', flexDirection: 'column' }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', color: 'var(--text-muted)' }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
          <Users size={22} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Friends</h3>
        </div>

        {currentUser?.isGuest ? (
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              textAlign: 'center',
              margin: 'auto 0'
            }}
          >
            <ShieldAlert size={36} color="var(--accent-cyan)" style={{ margin: '0 auto 0.75rem auto' }} />
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>Registered Account Required</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Guests can play online freely, but creating friend connections requires a persistent email/password account.
            </p>
            <button onClick={onOpenAuth} className="btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
              Sign In or Create Account
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem', marginBottom: '1rem' }}>
              <button
                onClick={() => setActiveTab('friends')}
                className="btn-secondary"
                style={{
                  fontSize: '0.82rem',
                  padding: '0.4rem 0.8rem',
                  background: activeTab === 'friends' ? 'var(--accent-cyan-glow)' : 'transparent',
                  borderColor: activeTab === 'friends' ? 'var(--accent-cyan)' : 'transparent',
                  color: activeTab === 'friends' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
                }}
              >
                Friends ({friends.length})
              </button>

              <button
                onClick={() => setActiveTab('requests')}
                className="btn-secondary"
                style={{
                  fontSize: '0.82rem',
                  padding: '0.4rem 0.8rem',
                  background: activeTab === 'requests' ? 'var(--accent-cyan-glow)' : 'transparent',
                  borderColor: activeTab === 'requests' ? 'var(--accent-cyan)' : 'transparent',
                  color: activeTab === 'requests' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
                }}
              >
                Requests {requests.length > 0 && `(${requests.length})`}
              </button>

              <button
                onClick={() => setActiveTab('search')}
                className="btn-secondary"
                style={{
                  fontSize: '0.82rem',
                  padding: '0.4rem 0.8rem',
                  background: activeTab === 'search' ? 'var(--accent-cyan-glow)' : 'transparent',
                  borderColor: activeTab === 'search' ? 'var(--accent-cyan)' : 'transparent',
                  color: activeTab === 'search' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
                }}
              >
                <Search size={14} /> Add Friend
              </button>
            </div>

            {/* TAB 1: FRIENDS LIST */}
            {activeTab === 'friends' && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {friends.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', margin: 'auto' }}>
                    No friends added yet. Use "Add Friend" to search by player name!
                  </div>
                ) : (
                  friends.map((f) => (
                    <div
                      key={f.uid}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        background: 'var(--bg-surface)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {f.displayName[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{f.displayName}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Friends since {new Date(f.since).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          onClick={() => {
                            onInviteFriend(f.uid, f.displayName);
                            onClose();
                          }}
                          className="btn-primary"
                          style={{ padding: '0.4rem 0.65rem', fontSize: '0.78rem' }}
                          title="Invite to Chess Match"
                        >
                          <Swords size={14} /> Challenge
                        </button>

                        <button
                          onClick={() => setFriendToRemove(f)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '6px', cursor: 'pointer' }}
                          title="Remove Friend"
                          aria-label={`Remove ${f.displayName} from friends`}
                        >
                          <UserMinus size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: REQUESTS */}
            {activeTab === 'requests' && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {requests.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', margin: 'auto' }}>
                    No pending friend requests.
                  </div>
                ) : (
                  requests.map((r) => (
                    <div
                      key={r.fromUid}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        background: 'var(--bg-surface)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.fromName}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>sent a request</div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => currentUser && onlineService.acceptFriendRequest(currentUser, r)}
                          className="btn-primary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
                        >
                          <Check size={14} /> Accept
                        </button>

                        <button
                          onClick={() => currentUser && onlineService.declineFriendRequest(currentUser.uid, r.fromUid)}
                          className="btn-secondary"
                          style={{ padding: '0.4rem 0.65rem', fontSize: '0.78rem' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: SEARCH & ADD */}
            {activeTab === 'search' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search player by name..."
                    style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                  />
                  <button type="submit" disabled={searching || !searchQuery.trim()} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                    <Search size={15} />
                  </button>
                </form>

                <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {searchResults.map((user) => {
                    const isAlreadyFriend = friends.some((f) => f.uid === user.uid);
                    const isSent = !!requestSentMap[user.uid];

                    return (
                      <div
                        key={user.uid}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.6rem 0.85rem',
                          background: 'var(--bg-surface)',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.displayName}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Rating: {user.rating}</div>
                        </div>

                        {isAlreadyFriend ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 600 }}>Already Friend</span>
                        ) : isSent ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>Request Sent!</span>
                        ) : (
                          <button
                            onClick={() => handleSendRequest(user.uid)}
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                          >
                            <UserPlus size={14} /> Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={!!friendToRemove}
        title="Remove Friend"
        message={friendToRemove ? `Are you sure you want to remove ${friendToRemove.displayName} from your friends list?` : ''}
        confirmText="Remove"
        variant="danger"
        onConfirm={async () => {
          if (currentUser && friendToRemove) {
            await onlineService.removeFriend(currentUser.uid, friendToRemove.uid);
            showToast({ type: 'info', message: `${friendToRemove.displayName} removed from friends.` });
            setFriendToRemove(null);
          }
        }}
        onCancel={() => setFriendToRemove(null)}
      />
    </div>
  );
};

