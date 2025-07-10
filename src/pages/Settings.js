import React, { useEffect, useState } from 'react';
import './Settings.css';
import { useCar } from '../context/CarContext';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const Settings = () => {
  const [activeTab, setActiveTab] = useState('notes');
  const [preFields, setPreFields] = useState([]);
  const [postFields, setPostFields] = useState([]);
  const [carTemplates, setCarTemplates] = useState([]);
  const [tracks, setTracks] = useState([]);
  const { cars, loadCars } = useCar();
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCarId, setTemplateCarId] = useState(null);

  const loadCarTemplates = async () => {
    const t = await window.api.getCarTemplates();
    setCarTemplates(t);
  };

  const loadTracks = async () => {
    const t = await window.api.getTracks();
    setTracks(t.filter(tr => tr.id !== 1));
  };

  useEffect(() => {
    const loadTemplates = async () => {
      const templates = await window.api.getNotesTemplates();
      const pre = templates.find(t => t.name === 'pre');
      const post = templates.find(t => t.name === 'post');
      setPreFields(pre ? pre.fields : []);
      setPostFields(post ? post.fields : []);
    };
    loadTemplates();
    loadCarTemplates();
    loadCars();
    loadTracks();
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

  const openTemplateModal = (carId) => {
    setTemplateCarId(carId);
    setTemplateName('');
    setIsTemplateModalOpen(true);
  };

  const closeTemplateModal = () => {
    setIsTemplateModalOpen(false);
    setTemplateCarId(null);
  };

  const handleSaveTemplate = async () => {
    if (!templateName || !templateCarId) return;
    await window.api.addCarTemplate(templateCarId, templateName);
    loadCarTemplates();
    closeTemplateModal();
  };

  const handlePhotoUpload = (trackId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      await window.api.updateTrackPhoto(trackId, dataUrl);
      setTracks(tracks.map(t => t.id === trackId ? { ...t, photo: dataUrl } : t));
    };
    reader.readAsDataURL(file);
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
        <button
          className={`nav-button ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          Template Car
        </button>
        <button
          className={`nav-button ${activeTab === 'tracks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracks')}
        >
          Tracks
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
        {activeTab === 'templates' && (
          <>
            <div className="template-list">
              <h3>Saved Templates</h3>
              <ul>
                {carTemplates.map(t => (
                  <li key={t.id}>{t.name} - {new Date(t.createdAt).toLocaleDateString()}</li>
                ))}
              </ul>
            </div>
            <div className="car-list">
              <h3>Your Cars</h3>
              <ul>
                {cars.map(c => (
                  <li key={c.id}>
                    {c.name} <button onClick={() => openTemplateModal(c.id)}>Save as Template</button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
        {activeTab === 'tracks' && (
          <div className="track-list">
            <h3>Track Photos</h3>
            <ul>
              {tracks.map(t => (
                <li key={t.id}>
                  {t.name}
                  {t.photo && <img src={t.photo} alt={t.name} className="track-thumb" />}
                  <button onClick={() => document.getElementById(`track-photo-${t.id}`).click()}>Upload Photo</button>
                  <input
                    type="file"
                    accept="image/*"
                    id={`track-photo-${t.id}`}
                    style={{ display: 'none' }}
                    onChange={(e) => handlePhotoUpload(t.id, e)}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <Modal
        isOpen={isTemplateModalOpen}
        onRequestClose={closeTemplateModal}
        contentLabel="Save Template"
        className="modal template-modal"
        overlayClassName="overlay"
      >
        <h2>Template Name</h2>
        <input
          type="text"
          value={templateName}
          onChange={e => setTemplateName(e.target.value)}
          placeholder="Template Name"
        />
        <div className="event-modal-buttons">
          <button onClick={handleSaveTemplate}>Save</button>
          <button onClick={closeTemplateModal}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
