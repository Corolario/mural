import { useState, useEffect, useCallback } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import api from "../api.js";
import NoteCard from "./NoteCard.jsx";
import NoteModal from "./NoteModal.jsx";

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function Board({ onLogout }) {
  const [notes, setNotes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await api.get("/notes");
      setNotes(res.data);
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const updateNotePosition = useCallback((id, x, y, w, h) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, x, y, w, h } : n))
    );
    api.patch(`/notes/${id}/position`, { x, y, w, h }).catch(() => {});
  }, []);

  const handleDragStop = useCallback((_layout, _oldItem, newItem) => {
    const id = Number(newItem.i);
    updateNotePosition(id, newItem.x, newItem.y, newItem.w, newItem.h);
  }, [updateNotePosition]);

  const handleResizeStop = useCallback((_layout, _oldItem, newItem) => {
    const id = Number(newItem.i);
    updateNotePosition(id, newItem.x, newItem.y, newItem.w, newItem.h);
  }, [updateNotePosition]);

  const handleSave = async (data, noteId) => {
    if (noteId) {
      const res = await api.put(`/notes/${noteId}`, data);
      setNotes((prev) => prev.map((n) => (n.id === noteId ? res.data : n)));
    } else {
      const res = await api.post("/notes", data);
      const created = res.data;
      setNotes((prev) => {
        const maxY = prev.length > 0 ? Math.max(...prev.map((n) => n.y + n.h)) : 0;
        const positioned = { ...created, x: 0, y: maxY };
        api
          .patch(`/notes/${created.id}/position`, {
            x: 0,
            y: maxY,
            w: created.w,
            h: created.h,
          })
          .catch(() => {});
        return [positioned, ...prev];
      });
    }
  };

  const handleDelete = async (noteId) => {
    await api.delete(`/notes/${noteId}`);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  const openCreate = () => {
    setEditNote(null);
    setModalOpen(true);
  };

  const openEdit = (note) => {
    setEditNote(note);
    setModalOpen(true);
  };

  const gridLayout = notes.map((note) => ({
    i: String(note.id),
    x: note.x,
    y: note.y,
    w: note.w,
    h: note.h,
    minW: 1,
    minH: 1,
  }));

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="board">
      <header className="board-header">
        <h1>Mural de Recados</h1>
        <div className="board-header-actions">
          <button className="btn-add" onClick={openCreate}>
            + Novo Recado
          </button>
          <button className="btn-logout" onClick={onLogout}>
            Sair
          </button>
        </div>
      </header>

      {notes.length === 0 ? (
        <div className="empty-board">
          <p>Nenhum recado ainda. Clique em &quot;+ Novo Recado&quot; para começar!</p>
        </div>
      ) : (
        <ResponsiveGridLayout
          className="notes-grid"
          layouts={{ lg: gridLayout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
          rowHeight={80}
          onDragStop={handleDragStop}
          onResizeStop={handleResizeStop}
          draggableHandle=".note-card-header"
          compactType={null}
          allowOverlap={true}
        >
          {notes.map((note) => (
            <div key={String(note.id)}>
              <NoteCard note={note} onEdit={openEdit} onDelete={handleDelete} />
            </div>
          ))}
        </ResponsiveGridLayout>
      )}

      {modalOpen && (
        <NoteModal
          note={editNote}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
