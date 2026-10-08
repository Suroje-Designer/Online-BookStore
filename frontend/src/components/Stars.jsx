export function Stars({ value = 0, size = '1rem' }) {
  const rounded = Math.round(value);
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rounded ? 'star on' : 'star'} aria-hidden="true">
          &#9733;
        </span>
      ))}
    </span>
  );
}

export function StarInput({ value, onChange }) {
  return (
    <div className="stars star-input" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className={n <= value ? 'star on' : 'star'}
          onClick={() => onChange(n)}
        >
          &#9733;
        </button>
      ))}
    </div>
  );
}
