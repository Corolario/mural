import { useState, useEffect, useCallback, useRef } from "react";
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
  const notesRef = useRef([]);
  const debounceRef = useRef(null);

  notesRef.current = notes;

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

  const handleLayoutChange = useCallback((layout) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      const current = notesRef.current;
      const updates = [];
      layout.forEach((item) => {
        const note = current.find((n) => String(n.id) === item.i);
        if (
          note &&
          (note.x !== item.x ||
            note.y !== item.y ||
            note.w !== item.w ||
            note.h !== item.h)
        ) {
          updates.push({ id: note.id, x: item.x, y: item.y, w: item.w, h: item.h });
        }
      });
      if (updates.length === 0) return;
      setNotes((prev) =>
        prev.map((n) => {
          const u = updates.find((x) => x.id === n.id);
          return u ? { ...n, x: u.x, y: u.y, w: u.w, h: u.h } : n;
        })
      );
      updates.forEach((u) => {
        api
          .patch(`/notes/${u.id}/position`, { x: u.x, y: u.y, w: u.w, h: u.h })
          .catch(() => {});
      });
    }, 300);
  }, []);

  const computeNextPosition = (existingNotes) => {
    if (existingNotes.length === 0) return { x: 0, y: 0 };
    const maxY = Math.max(...existingNotes.map((n) => n.y + n.h));
    return { x: 0, y: maxY };
  };

  const handleSave = async (data, noteId) => {
    if (noteId) {
      const res = await api.put(`/notes/${noteId}`, data);
      setNotes((prev) => prev.map((n) => (n.id === noteId ? res.data : n)));
    } else {
      const pos = computeNextPosition(notesRef.current);
      const res = await api.post("/notes", data);
      const created = res.data;
      await api
        .patch(`/notes/${created.id}/position`, {
          x: pos.x,
          y: pos.y,
          w: created.w,
          h: created.h,
        })
        .catch(() => {});
      setNotes((prev) => [{ ...created, x: pos.x, y: pos.y }, ...prev]);
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
          onLayoutChange={handleLayoutChange}
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
