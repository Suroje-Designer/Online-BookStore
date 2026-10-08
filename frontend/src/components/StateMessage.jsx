// Shared empty / error block. Pass `action` to render a button or link under the text.
export default function StateMessage({ title, children, tone = 'neutral', action }) {
  return (
    <div className={`state state-${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
