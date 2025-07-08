import React, { useState, useEffect } from 'react';
import './Checklist.css';

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
      <ul className="notes-list">
        {notes.map(note => (
          <li key={note.id} className="note-item">
            <input
              type="text"
              value={note.title}
              onChange={(e) => handleTitleChange(note.id, e.target.value)}
              onBlur={() => handleUpdate(note.id, note.title, note.content)}
            />
            <textarea
              value={note.content || ''}
              onChange={(e) => handleContentChange(note.id, e.target.value)}
              onBlur={() => handleUpdate(note.id, note.title, note.content)}
            />
            <button onClick={() => handleDelete(note.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Checklist;
