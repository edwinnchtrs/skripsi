import { useState } from 'react';
import { Send, Heart, MessageCircle } from 'lucide-react';
import { initialCurhat } from './userData';
import type { CurhatPost } from './userData';
import { card, sectionTitle } from '../dashboard/styles';

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const colors = {
    Positif: { bg: '#22c55e22', text: '#22c55e' },
    Netral: { bg: '#3ecfcf22', text: '#3ecfcf' },
    Negatif: { bg: '#ef444422', text: '#ef4444' },
  };
  const theme = colors[sentiment as keyof typeof colors] || colors.Netral;
  return (
    <span style={{
      fontSize: 9, background: theme.bg, color: theme.text,
      padding: '2px 6px', borderRadius: 12, marginLeft: 8, fontWeight: 600
    }}>
      {sentiment}
    </span>
  );
}

export default function AnonymousVentingFeed() {
  const [posts, setPosts] = useState<CurhatPost[]>(initialCurhat);
  const [newPost, setNewPost] = useState('');
  const [replyText, setReplyText] = useState<{ [key: number]: string }>({});
  const [activeReply, setActiveReply] = useState<number | null>(null);

  const handlePost = () => {
    if (!newPost.trim()) return;
    const post: CurhatPost = {
      id: Date.now(),
      text: newPost,
      sentiment: 'Netral', // Ideally from AI backend
      tags: ['#Baru'],
      time: 'Baru saja',
      hugs: 0,
      replies: []
    };
    setPosts([post, ...posts]);
    setNewPost('');
  };

  const handleHug = (id: number) => {
    setPosts(posts.map(p => p.id === id ? { ...p, hugs: p.hugs + 1 } : p));
  };

  const handleReply = (postId: number) => {
    const text = replyText[postId];
    if (!text?.trim()) return;
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          replies: [...p.replies, { id: Date.now(), text, time: 'Baru saja' }]
        };
      }
      return p;
    }));
    setReplyText({ ...replyText, [postId]: '' });
    setActiveReply(null);
  };

  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', maxHeight: '600px' }}>
      <div style={sectionTitle}>Ruang Curhat Anonim</div>
      
      {/* Input box */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <input
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Ceritakan keluh kesahmu tanpa nama..."
          style={{
            flex: 1, background: '#1e2130', border: '1px solid #2a2e42',
            padding: '10px 14px', borderRadius: 8, color: '#e2e8f0', fontSize: 12
          }}
          onKeyDown={(e) => e.key === 'Enter' && handlePost()}
        />
        <button
          onClick={handlePost}
          style={{
            background: '#6c63ff', border: 'none', borderRadius: 8, width: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}
        >
          <Send size={14} color="#fff" />
        </button>
      </div>

      {/* Feed list */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
        {posts.map(post => (
          <div key={post.id} style={{
            background: '#1a1e2e', borderRadius: 8, padding: 12, marginBottom: 12, border: '1px solid #2a2e42'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#8890a4', fontWeight: 600 }}>Anonim</span>
                <SentimentBadge sentiment={post.sentiment} />
              </div>
              <span style={{ fontSize: 10, color: '#8890a4' }}>{post.time}</span>
            </div>
            
            <p style={{ fontSize: 13, color: '#e2e8f0', margin: '0 0 10px 0', lineHeight: 1.5 }}>
              {post.text}
            </p>
            
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {post.tags.map(t => (
                <span key={t} style={{ fontSize: 10, color: '#6c63ff', background: '#6c63ff15', padding: '2px 6px', borderRadius: 4 }}>{t}</span>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 16, borderTop: '1px solid #2a2e42', paddingTop: 8 }}>
              <button onClick={() => handleHug(post.id)} style={{
                background: 'transparent', border: 'none', color: '#8890a4', fontSize: 11,
                display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer'
              }}>
                <Heart size={14} color={post.hugs > 0 ? '#ef4444' : '#8890a4'} fill={post.hugs > 0 ? '#ef4444' : 'none'} />
                {post.hugs > 0 ? `${post.hugs} Pelukan` : 'Beri Pelukan'}
              </button>
              <button onClick={() => setActiveReply(activeReply === post.id ? null : post.id)} style={{
                background: 'transparent', border: 'none', color: '#8890a4', fontSize: 11,
                display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer'
              }}>
                <MessageCircle size={14} />
                {post.replies.length} Balasan
              </button>
            </div>

            {/* Replies Section */}
            {post.replies.length > 0 && (
              <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: '2px solid #2a2e42' }}>
                {post.replies.map(r => (
                  <div key={r.id} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: '#8890a4', marginBottom: 2 }}>Anonim • {r.time}</div>
                    <div style={{ fontSize: 12, color: '#c0c9e0' }}>{r.text}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Input */}
            {activeReply === post.id && (
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <input
                  value={replyText[post.id] || ''}
                  onChange={(e) => setReplyText({ ...replyText, [post.id]: e.target.value })}
                  placeholder="Tulis balasan dukungan..."
                  style={{
                    flex: 1, background: '#131722', border: '1px solid #2a2e42',
                    padding: '8px 10px', borderRadius: 6, color: '#e2e8f0', fontSize: 11
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleReply(post.id)}
                />
                <button
                  onClick={() => handleReply(post.id)}
                  style={{
                    background: '#3ecfcf', border: 'none', borderRadius: 6, padding: '0 12px',
                    color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Balas
                </button>
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}
