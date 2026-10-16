export default function SectionTitle({ eyebrow, title, action, onAction }) {
  return (
    <div className="section-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <button onClick={onAction}>{action}</button>
    </div>
  );
}
