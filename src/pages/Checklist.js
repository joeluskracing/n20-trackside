import React, { useState, useEffect, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './Checklist.css';

const ItemTypes = { NOTE: 'note' };

const Checklist = () => {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const loadNotes = async () => {
    const data = await window.api.getChecklistNotes();
    setNotes(data || []);
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title) return;
    await window.api.addChecklistNote(title, content);
    setTitle('');
    setContent('');
    loadNotes();
  };

  const handleUpdate = async (id, newTitle, newContent) => {
    await window.api.updateChecklistNote(id, newTitle, newContent);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this note?')) {
      await window.api.deleteChecklistNote(id);
      loadNotes();
    }
  };

  const handleTitleChange = (id, value) => {
    setNotes(notes.map(n => n.id === id ? { ...n, title: value } : n));
  };

  const handleContentChange = (id, value) => {
    setNotes(notes.map(n => n.id === id ? { ...n, content: value } : n));
  };

  const moveNote = (from, to) => {
    const updated = [...notes];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setNotes(updated);
    return updated;
  };

  const handleReorderSave = async (newOrder) => {
    await window.api.reorderChecklistNotes(newOrder.map(n => n.id));
  };

  const NoteItem = ({ note, index }) => {
    const ref = useRef(null);
    const [, drop] = useDrop({
      accept: ItemTypes.NOTE,
      hover(item) {
        if (!ref.current || item.index === index) return;
        moveNote(item.index, index);
        item.index = index;
      },
      drop() {
        handleReorderSave(notes);
      }
    });

    const [{ isDragging }, drag] = useDrag({
      type: ItemTypes.NOTE,
      item: { id: note.id, index },
      collect: (monitor) => ({ isDragging: monitor.isDragging() })
    });

    drag(drop(ref));

    return (
      <li ref={ref} className="note-item" style={{ opacity: isDragging ? 0.5 : 1 }}>
        <input
          type="text"
          value={note.title}
          onChange={(e) => handleTitleChange(note.id, e.target.value)}
          onBlur={() => handleUpdate(note.id, note.title, note.content)}
        />
        <div className="dates">
          Created: {new Date(note.createdAt).toLocaleDateString()}<br />
          Modified: {new Date(note.updatedAt).toLocaleDateString()}
        </div>
        <textarea
          value={note.content || ''}
          onChange={(e) => handleContentChange(note.id, e.target.value)}
          onBlur={() => handleUpdate(note.id, note.title, note.content)}
        />
        <button onClick={() => handleDelete(note.id)}>Delete</button>
      </li>
    );
  };

  return (
    <div className="checklist">
      <h2>Checklist</h2>
      <form onSubmit={handleAdd} className="add-note">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          required
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Content"
        />
        <button type="submit">Add</button>
      </form>
      <DndProvider backend={HTML5Backend}>
        <ul className="notes-list">
          {notes.map((note, idx) => (
            <NoteItem key={note.id} note={note} index={idx} />
          ))}
        </ul>
      </DndProvider>
    </div>
  );
};

export default Checklist;
