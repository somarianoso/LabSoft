export default function SectionTitle({ eyebrow, title, action }) {
  return (
    <div className="section-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <button>{action}</button>
    </div>
  );
}
