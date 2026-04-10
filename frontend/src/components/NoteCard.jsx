const COLOR_HUES = {
  yellow: 45,
  pink: 340,
  blue: 210,
  green: 140,
  purple: 270,
};

function getFadedColor(color, createdAt) {
  const hue = COLOR_HUES[color] ?? 45;
  const msPerDay = 86400000;
  const daysOld = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / msPerDay);
  const ratio = Math.min(daysOld / 8, 1);
  const saturation = Math.round(100 - ratio * 80);
  const lightness = Math.round(50 + ratio * 30);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function getTextColor(color, createdAt) {
  const msPerDay = 86400000;
  const daysOld = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / msPerDay);
  const ratio = Math.min(daysOld / 8, 1);
  const lightness = Math.round(20 + ratio * 30);
  return `hsl(0, 0%, ${lightness}%)`;
}

export default function NoteCard({ note, onEdit, onDelete }) {
  const bgColor = getFadedColor(note.color, note.created_at);
  const textColor = getTextColor(note.color, note.created_at);

  return (
    <div className="note-card" style={{ backgroundColor: bgColor, color: textColor }}>
      <div className="note-card-header">
        <h3 className="note-card-title">{note.title || "Sem título"}</h3>
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
      </div>
      <p className="note-card-content">{note.content}</p>
    </div>
  );
}
