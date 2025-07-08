import React, { useEffect, useState } from 'react';
import './Settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('notes');
  const [preFields, setPreFields] = useState([]);
  const [postFields, setPostFields] = useState([]);

  useEffect(() => {
    const loadTemplates = async () => {
      const templates = await window.api.getNotesTemplates();
      const pre = templates.find(t => t.name === 'pre');
      const post = templates.find(t => t.name === 'post');
      setPreFields(pre ? pre.fields : []);
      setPostFields(post ? post.fields : []);
    };
    loadTemplates();
  }, []);

  const handleAddField = (type) => {
    const newField = { title: '', type: 'Text', value: '' };
    if (type === 'pre') {
      setPreFields([...preFields, newField]);
    } else {
      setPostFields([...postFields, newField]);
    }
  };

  const handleRemoveField = (type, index) => {
    if (!window.confirm('Deleting fields may be permanent. Continue?')) return;
    if (type === 'pre') {
      setPreFields(preFields.filter((_, i) => i !== index));
    } else {
      setPostFields(postFields.filter((_, i) => i !== index));
    }
  };

  const handleFieldChange = (type, index, key, value) => {
    if (type === 'pre') {
      const fields = [...preFields];
      fields[index][key] = value;
      setPreFields(fields);
    } else {
      const fields = [...postFields];
      fields[index][key] = value;
      setPostFields(fields);
    }
  };

  const handleSave = async () => {
    await window.api.updateNotesTemplate('pre', preFields);
    await window.api.updateNotesTemplate('post', postFields);
    alert('Notes templates saved');
  };

  const renderFields = (fields, type) => (
    <div className="template-section">
      <h3>{type === 'pre' ? 'Pre-Session Notes' : 'Post-Session Notes'}</h3>
      {fields.map((field, index) => (
        <div className="field-row" key={index}>
          <input
            type="text"
            value={field.title}
            onChange={e => handleFieldChange(type, index, 'title', e.target.value)}
            placeholder="Title"
          />
          <select
            value={field.type}
            onChange={e => handleFieldChange(type, index, 'type', e.target.value)}
          >
            <option value="Text">Text</option>
            <option value="Paragraph">Paragraph</option>
          </select>
          <button onClick={() => handleRemoveField(type, index)}>-</button>
        </div>
      ))}
      <button onClick={() => handleAddField(type)}>Add Field</button>
    </div>
  );

  return (
    <div className="settings">
      <div className="left-column">
        <h2>Settings</h2>
        <button
          className={`nav-button ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          Session Notes
        </button>
      </div>
      <div className="right-column">
        {activeTab === 'notes' && (
          <>
            <div className="notes-columns">
              {renderFields(preFields, 'pre')}
              {renderFields(postFields, 'post')}
            </div>
            <button onClick={handleSave}>Save Templates</button>
          </>
        )}
      </div>
    </div>
  );
};

export default Settings;
