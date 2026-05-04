import { useState, useEffect, useRef } from "react";

const COLORS = ["yellow", "pink", "blue", "green", "purple"];

const COLOR_LABELS = {
  yellow: "Amarelo",
  pink: "Rosa",
  blue: "Azul",
  green: "Verde",
  purple: "Roxo",
};

const COLOR_PREVIEW = {
  yellow: "hsl(45, 100%, 50%)",
  pink: "hsl(340, 100%, 50%)",
  blue: "hsl(210, 100%, 50%)",
  green: "hsl(140, 100%, 50%)",
  purple: "hsl(270, 100%, 50%)",
};

export default function NoteModal({ note, onSave, onClose }) {
  const [content, setContent] = useState("");
  const [color, setColor] = useState("yellow");
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (note) {
      setContent(note.content);
      setColor(note.color);
    } else {
      setContent("");
      setColor("yellow");
    }
  }, [note]);

  function applyFormat(marker) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end);
    const newContent =
      content.slice(0, start) + marker + selected + marker + content.slice(end);
    setContent(newContent);
    // Reposiciona o cursor após o marcador final
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + marker.length, end + marker.length);
    }, 0);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ title: "", content, color }, note?.id);
      onClose();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2>{note ? "Editar Recado" : "Novo Recado"}</h2>
        <div className="format-toolbar">
          <button type="button" className="format-btn format-btn-bold" onClick={() => applyFormat("**")} title="Negrito">
            <b>N</b>
          </button>
          <button type="button" className="format-btn format-btn-underline" onClick={() => applyFormat("__")} title="Sublinhado">
            <u>S</u>
          </button>
        </div>
        <textarea
          ref={textareaRef}
          placeholder="Conteúdo do recado..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          maxLength={5000}
        />
        <div className="color-picker">
          <label>Cor:</label>
          <div className="color-options">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-btn ${c === color ? "selected" : ""}`}
                style={{ backgroundColor: COLOR_PREVIEW[c] }}
                onClick={() => setColor(c)}
                title={COLOR_LABELS[c]}
              />
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-save" disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
