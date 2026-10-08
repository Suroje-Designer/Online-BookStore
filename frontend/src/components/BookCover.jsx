import { useState } from 'react';

const PALETTE = ['#12332F', '#7A2E3A', '#2B4C7E', '#5B4A2E', '#3F5D3A', '#4A3B6B', '#8A4B1E'];

const hash = (s = '') => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

// Shows the book image; if it is missing or fails to load, draws a typographic cover instead.
export default function BookCover({ book, className = '' }) {
  const [failed, setFailed] = useState(false);

  if (book.image && !failed) {
    return (
      <div className={`cover ${className}`}>
        <img src={book.image} alt={`Cover of ${book.title}`} loading="lazy" onError={() => setFailed(true)} />
      </div>
    );
  }

  return (
    <div
      className={`cover cover-fallback ${className}`}
      style={{ background: PALETTE[hash(book.title) % PALETTE.length] }}
      role="img"
      aria-label={`Cover of ${book.title}`}
    >
      <strong>{book.title}</strong>
      <span>{book.author}</span>
    </div>
  );
}
