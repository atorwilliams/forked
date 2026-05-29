"use client";

import { useState, useEffect } from "react";

interface Author {
  username: string | null;
  name: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
  replies?: Comment[];
}

interface Props {
  recipeId: string;
  currentUsername: string | null;
}

export function Comments({ recipeId, currentUsername }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const fetchComments = async () => {
    const res = await fetch(`/api/recipes/${recipeId}/comments`);
    if (res.ok) setComments(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchComments(); }, [recipeId]);

  const postComment = async (content: string, parentCommentId?: string) => {
    if (!content.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/recipes/${recipeId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim(), parentCommentId }),
    });
    setPosting(false);
    if (res.ok) {
      setNewComment("");
      setReplyText("");
      setReplyingTo(null);
      fetchComments();
    }
  };

  function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return days === 1 ? "yesterday" : `${days} days ago`;
  }

  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 20 }}>
        Comments {comments.length > 0 && `(${comments.length})`}
      </h3>

      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading...</p>
      ) : (
        <>
          {comments.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>No comments yet.</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            {comments.map((c) => (
              <CommentThread
                key={c.id}
                comment={c}
                currentUsername={currentUsername}
                replyingTo={replyingTo}
                replyText={replyText}
                posting={posting}
                onReply={(id) => { setReplyingTo(id); setReplyText(""); }}
                onCancelReply={() => setReplyingTo(null)}
                onReplyTextChange={setReplyText}
                onPostReply={(parentId) => postComment(replyText, parentId)}
                relativeTime={relativeTime}
              />
            ))}
          </div>

          {currentUsername ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Leave a comment..."
                rows={3}
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "8px 10px",
                  color: "var(--text)",
                  fontSize: 13,
                  fontFamily: "inherit",
                  lineHeight: 1.6,
                  resize: "vertical",
                  outline: "none",
                  width: "100%",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => postComment(newComment)}
                  disabled={posting || !newComment.trim()}
                  style={{
                    background: "var(--accent)", border: "none", borderRadius: 6,
                    padding: "6px 16px", color: "#fff", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", opacity: posting || !newComment.trim() ? 0.6 : 1,
                  }}
                >
                  {posting ? "Posting..." : "Comment"}
                </button>
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
              <a href="/login" style={{ color: "var(--text-link)" }}>Sign in</a> to leave a comment.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function CommentThread({ comment, currentUsername, replyingTo, replyText, posting, onReply, onCancelReply, onReplyTextChange, onPostReply, relativeTime }: {
  comment: Comment;
  currentUsername: string | null;
  replyingTo: string | null;
  replyText: string;
  posting: boolean;
  onReply: (id: string) => void;
  onCancelReply: () => void;
  onReplyTextChange: (v: string) => void;
  onPostReply: (parentId: string) => void;
  relativeTime: (iso: string) => string;
}) {
  return (
    <div>
      <CommentRow comment={comment} currentUsername={currentUsername} onReply={onReply} relativeTime={relativeTime} />

      {replyingTo === comment.id && (
        <div style={{ marginLeft: 44, marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          <textarea
            value={replyText}
            onChange={(e) => onReplyTextChange(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
            autoFocus
            style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", color: "var(--text)", fontSize: 13, fontFamily: "inherit", lineHeight: 1.6, resize: "vertical", outline: "none", width: "100%" }}
          />
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <button onClick={onCancelReply} style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 12px", color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}>Cancel</button>
            <button onClick={() => onPostReply(comment.id)} disabled={posting || !replyText.trim()} style={{ background: "var(--accent)", border: "none", borderRadius: 6, padding: "4px 12px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: posting || !replyText.trim() ? 0.6 : 1 }}>
              {posting ? "Posting..." : "Reply"}
            </button>
          </div>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div style={{ marginLeft: 44, marginTop: 8, display: "flex", flexDirection: "column", gap: 10, borderLeft: "2px solid var(--border)", paddingLeft: 16 }}>
          {comment.replies.map((r) => (
            <CommentRow key={r.id} comment={r} currentUsername={currentUsername} onReply={onReply} relativeTime={relativeTime} />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentRow({ comment, currentUsername, onReply, relativeTime }: {
  comment: Comment;
  currentUsername: string | null;
  onReply: (id: string) => void;
  relativeTime: (iso: string) => string;
}) {
  const handle = comment.author.username ?? "unknown";
  const displayName = comment.author.name ?? handle;

  return (
    <div style={{ display: "flex", gap: 12 }}>
      <a href={`/${handle}`} style={{ flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg-tertiary)", border: "1px solid var(--border)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
          {comment.author.image
            ? <img src={comment.author.image} width={32} height={32} alt={displayName} style={{ borderRadius: "50%" }} />
            : displayName[0]?.toUpperCase()}
        </div>
      </a>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
          <a href={`/${handle}`} style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", textDecoration: "none" }}>{displayName}</a>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{relativeTime(comment.createdAt)}</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{comment.content}</p>
        {currentUsername && (
          <button onClick={() => onReply(comment.id)} style={{ background: "transparent", border: "none", padding: 0, marginTop: 6, fontSize: 12, color: "var(--text-muted)", cursor: "pointer" }}>
            Reply
          </button>
        )}
      </div>
    </div>
  );
}
