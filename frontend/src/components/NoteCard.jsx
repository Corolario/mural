const COLOR_HUES = {
  yellow: 45,
  pink: 340,
  blue: 210,
  green: 140,
  purple: 270,
};

function getCardColors(color, createdAt) {
  const hue = COLOR_HUES[color] ?? 45;
  const msPerDay = 86400000;
  const daysOld = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / msPerDay);
  const ratio = Math.min(daysOld / 8, 1);
  const saturation = Math.round(100 - ratio * 80);
  const lightness = Math.round(50 + ratio * 30);
  const borderColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const bgColor = `hsl(${hue}, ${Math.round(saturation * 0.45)}%, ${Math.min(lightness + 22, 96)}%)`;
  return { borderColor, bgColor };
}

function getTextColor(color, createdAt) {
  const msPerDay = 86400000;
  const daysOld = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / msPerDay);
  const ratio = Math.min(daysOld / 8, 1);
  const lightness = Math.round(20 + ratio * 30);
  return `hsl(0, 0%, ${lightness}%)`;
}

function renderContent(text) {
  // Escapa HTML para evitar XSS
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Aplica negrito (**texto**) e sublinhado (__texto__)
  const formatted = escaped
    .replace(/\*\*([\s\S]*?)\*\*/g, "<strong>$1</strong>")
    .replace(/__([\s\S]*?)__/g, "<u>$1</u>")
    .replace(/\n/g, "<br>");

  return formatted;
}

export default function NoteCard({ note, onEdit, onDelete }) {
  const { borderColor, bgColor } = getCardColors(note.color, note.created_at);
  const textColor = getTextColor(note.color, note.created_at);

  return (
    <div className="note-card" style={{ backgroundColor: bgColor, color: textColor, border: `2px solid ${borderColor}` }}>
      <div className="note-card-actions">
        <button
          className="note-btn note-btn-edit"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(note);
          }}
          title="Editar"
        >
          ✎
        </button>
        <button
          className="note-btn note-btn-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          title="Excluir"
        >
          ×
        </button>
      </div>
      <p
        className="note-card-content"
        dangerouslySetInnerHTML={{ __html: renderContent(note.content) }}
      />
    </div>
  );
}
