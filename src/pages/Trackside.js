import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Trackside.css';
import { useCar } from '../context/CarContext';
import { useEvent } from '../context/EventContext';
import Modal from 'react-modal';
import { Menu, Item, contextMenu } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import EditableTable from '../components/EditableTable';
import PartsGrid from '../components/PartsGrid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

Modal.setAppElement('#root'); // Set the app element for accessibility

const gridLayout = [
  ["Top Left", "Top Middle", "Top Right"],
  ["LF", "Engine", "RF"],
  ["Driver", "Center", "Passenger"],
  ["LR", "Differential", "RR"],
  ["Bottom Left", "Bottom Middle", "Bottom Right"]
];

const Trackside = () => {
  const { selectedCar: carId } = useCar();
  const { currentEvent, setCurrentEvent, currentSession, setCurrentSession } = useEvent();
  const [events, setEvents] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessions, setSessions] = useState([]);
  const [draggedTabIndex, setDraggedTabIndex] = useState(null);
  const [newSessionName, setNewSessionName] = useState('');
  const [selectedSessions, setSelectedSessions] = useState(['Practice', 'Heat', 'Feature']);
  const [showForm, setShowForm] = useState(false);
  const [showCustomSessions, setShowCustomSessions] = useState(false);
  const [parts, setParts] = useState([]);
  const [groupedParts, setGroupedParts] = useState({});
  const [values, setValues] = useState({});
  const [preSessionNotes, setPreSessionNotes] = useState([]);
  const [postSessionNotes, setPostSessionNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [showTableLightbox, setShowTableLightbox] = useState(false);
  const [currentPart, setCurrentPart] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingSessionName, setEditingSessionName] = useState('');
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCallback, setModalCallback] = useState(null);
  const [modalMessage, setModalMessage] = useState('');
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [eventSetups, setEventSetups] = useState([]);
  const [garageEvents, setGarageEvents] = useState([]);
  const [expandedGarageEvent, setExpandedGarageEvent] = useState(null);
  const [preTemplate, setPreTemplate] = useState([]);
  const [postTemplate, setPostTemplate] = useState([]);
  const [eventInfo, setEventInfo] = useState({ temperature: '', humidity: '', notes: '' });
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editTrack, setEditTrack] = useState('');
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');

  useEffect(() => {
    const loadTemplates = async () => {
      const templates = await window.api.getNotesTemplates();
      const pre = templates.find(t => t.name === 'pre');
      const post = templates.find(t => t.name === 'post');
      setPreTemplate(pre ? pre.fields : []);
      setPostTemplate(post ? post.fields : []);
    };
    loadTemplates();
  }, []);

  useEffect(() => {
    if (carId) {
      loadEvents();
      loadTracks();
    }
  }, [carId]);

  useEffect(() => {
    if (currentEvent) {
      loadSessions(currentEvent.id);
      setShowForm(false);
      window.api.getEventInfo(currentEvent.id).then(info => {
        if (info) {
          setEventInfo(info);
        } else {
          setEventInfo({ temperature: '', humidity: '', notes: '' });
        }
      });
    }
  }, [currentEvent]);

  useEffect(() => {
    if (currentSession) {
      loadParts(currentSession);
      loadSessionNotes(currentSession);
    }
  }, [currentSession]);

  useEffect(() => {
    if (!currentSession && sessions.length > 0) {
      setCurrentSession(sessions[0].id);
    }
  }, [sessions]);

  const loadEvents = async () => {
    try {
      const fetchedEvents = await window.api.getEventsWithSessions();
      const filteredEvents = fetchedEvents
        .filter(event => event.carId == carId && event.trackId !== 1)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      setEvents(filteredEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadTracks = async () => {
    try {
      const fetchedTracks = await window.api.getTracks();
      const filteredTracks = fetchedTracks.filter(track => track.id !== 1); // Exclude "Garage" track
      setTracks(filteredTracks);
    } catch (error) {
      console.error('Error loading tracks:', error);
    }
  };

  const loadSessions = async (eventId) => {
    try {
      const fetchedSessions = await window.api.getSessions(eventId);
      const stored = localStorage.getItem(`sessionOrder_${eventId}`);
      let ordered = fetchedSessions;
      if (stored) {
        const order = JSON.parse(stored);
        const map = new Map(fetchedSessions.map(s => [s.id, s]));
        ordered = order.map(id => map.get(id)).filter(Boolean);
        const remaining = fetchedSessions.filter(s => !order.includes(s.id));
        ordered = [...ordered, ...remaining];
      }
      setSessions(ordered);
      if (!currentSession && ordered.length > 0) {
        setCurrentSession(ordered[0].id);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadParts = async (sessionId) => {
    try {
      const fetchedParts = await window.api.getParts(carId);
      const partsValues = await window.api.getPartsValues() || [];
      const sessionPartsValues = await window.api.getSessionPartsValuesBySessionId(sessionId) || {};

      const uniqueParts = ensureUniqueOrder(fetchedParts);
      const sortedParts = uniqueParts.sort((a, b) => a.order - b.order);
      setParts(sortedParts);

      const initialValues = {};
      for (const part of sortedParts) {
        const sessionPartValue = sessionPartsValues.values ? sessionPartsValues.values[part.id] : undefined;
        const partValue = partsValues.find(pv => pv.partId == part.id);
        initialValues[part.id] = sessionPartValue !== undefined ? sessionPartValue : (partValue ? partValue.value : '');
      }
      setValues(initialValues);

      groupPartsByLocation(sortedParts);
    } catch (error) {
      console.error('Error loading parts:', error);
    }
  };

  const ensureUniqueOrder = (parts) => {
    const orderMap = new Map();
    let orderValue = 1;

    parts.forEach((part) => {
      const key = `${part.displayLocation}-${part.subheading || 'Others'}`;
      if (!orderMap.has(key)) {
        orderMap.set(key, new Set());
      }
      orderMap.get(key).add(part.order);
    });

    parts.forEach((part) => {
      const key = `${part.displayLocation}-${part.subheading || 'Others'}`;
      while (orderMap.get(key).has(orderValue)) {
        orderValue++;
      }
      if (!part.order || orderMap.get(key).has(part.order)) {
        part.order = orderValue;
        orderMap.get(key).add(orderValue);
      }
      orderValue++;
    });

    parts.forEach((part) => {
      if (!part.order) {
        window.api.updatePartOrder(part.id, part.order);
      }
    });

    return parts;
  };

  const groupPartsByLocation = (parts) => {
    const grouped = parts.reduce((acc, part) => {
      const location = part.displayLocation;
      const subheading = part.subheading?.trim() || 'Others';
      if (!acc[location]) {
        acc[location] = {};
      }
      if (!acc[location][subheading]) {
        acc[location][subheading] = [];
      }
      acc[location][subheading].push(part);
      return acc;
    }, {});
    setGroupedParts(grouped);
  };

  const handleTrackChange = (e) => {
    const trackName = e.target.value;
    setSelectedTrack(trackName);
    setEventName(`Racing at ${trackName}`);
  };

  const handleEventNameChange = (e) => {
    setEventName(e.target.value);
  };

  const handleAddSession = () => {
    if (newSessionName.trim()) {
      setSessions([...sessions, { name: newSessionName.trim() }]);
      setNewSessionName('');
    }
  };

  const handleSessionChange = (session) => {
    setSelectedSessions(prevSelected => {
      if (prevSelected.includes(session.name || session)) {
        return prevSelected.filter(s => s !== (session.name || session));
      } else {
        return [...prevSelected, session.name || session];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let trackId = tracks.find(track => track.name == selectedTrack)?.id;
    if (!trackId) {
      const newTrack = await window.api.addTrack(selectedTrack);
      trackId = newTrack.id;
    }

    const newEvent = await window.api.addEvent(eventName, new Date(eventDate), trackId, carId);
    const eventId = newEvent.id;

    const sessionPromises = selectedSessions.map(session =>
      window.api.addSession(eventId, new Date(), 'track', session)
    );
    const createdSessions = await Promise.all(sessionPromises);

    const preSessionNotesTemplate = preTemplate.length > 0 ? preTemplate : [];
    const postSessionNotesTemplate = postTemplate.length > 0 ? postTemplate : [];

    await Promise.all(
      createdSessions.map(session =>
        Promise.all([
          window.api.addPreSessionNotes(session.id, preSessionNotesTemplate),
          window.api.addPostSessionNotes(session.id, postSessionNotesTemplate)
        ])
      )
    );

    setCurrentEvent(newEvent);
    setCurrentSession(createdSessions[0]?.id);
    setPreSessionNotes([]);
    setPostSessionNotes([]);
    setShowForm(false); // Hide the form after submission
    loadEvents(); // Refresh the events list
  };

  const toggleForm = () => {
    // Reset sessions when opening the form to avoid duplicates from a previous event
    if (!showForm) {
      setSessions([]);
      setSelectedSessions(['Practice', 'Heat', 'Feature']);
    }
    setShowForm(!showForm);
  };

  const toggleCustomSessions = () => {
    setShowCustomSessions(!showCustomSessions);
  };

  const handleSessionClick = (sessionId) => {
    setCurrentSession(sessionId);
  };

  const handleSelectEvent = (evt) => {
    setCurrentEvent(evt);
    setCurrentSession(null);
    setPreSessionNotes([]);
    setPostSessionNotes([]);
  };

  const handleEndEvent = () => {
    setCurrentEvent(null);
    setCurrentSession(null);
    setPreSessionNotes([]);
    setPostSessionNotes([]);
    setSessions([]); // Clear previous sessions to avoid duplicates when creating a new event
    loadEvents(); // Refresh the events list
  };

  const handleContextMenu = (event, item) => {
    event.preventDefault();
    contextMenu.show({
      id: 'event-menu',
      event: event.nativeEvent || event,
      props: { item }
    });
  };

  const handleDeleteEvent = async ({ props }) => {
    setModalMessage('Are you sure you want to delete this event? This action cannot be undone and will remove all associated sessions and data.');
    setIsModalOpen(true);
    setModalCallback(async (confirm) => {
      if (confirm) {
        try {
          console.debug('Deleting event with id:', props.item.id);
          await window.api.deleteEvent(props.item.id);
          console.debug('Event deleted, reloading events');
          loadEvents();
        } catch (error) {
          console.error('Error deleting event:', error);
        }
      }
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalCallback(null);
    setModalMessage('');
  };

  const handleModalOption = async (option) => {
    console.debug('Modal option selected:', option);
    const cb = modalCallback;
    const hasCallback = Boolean(cb);
    console.debug('Has modal callback:', hasCallback);
    closeModal();
    if (hasCallback) {
      try {
        await cb(option);
        console.debug('Modal callback finished');
      } catch (error) {
        console.error('Error in modal callback:', error);
      }
    }
  };

  const handleChange = (partId, value) => {
    setValues({ ...values, [partId]: value });
  };

  const handleIncrement = (partId) => {
    setValues({ ...values, [partId]: (values[partId] || 0) + 1 });
  };

  const handleDecrement = (partId) => {
    setValues({ ...values, [partId]: (values[partId] || 0) - 1 });
  };

  const handleTableLinkClick = (part) => {
    setCurrentPart(part);
    setShowTableLightbox(true);
  };

  const handleBringSetupToGarage = () => {
    localStorage.setItem('garageSetupValues', JSON.stringify(values));
    if (currentEvent) {
      localStorage.setItem('garageSetupTitle', `Setup from ${currentEvent.name}`);
    }
    navigate('/garage');
  };

  const loadEventSetups = async () => {
    if (!currentEvent) return;
    try {
      const sess = await window.api.getSessions(currentEvent.id);
      const saved = [];
      for (const s of sess) {
        const spv = await window.api.getSessionPartsValuesBySessionId(s.id);
        if (spv) saved.push(s);
      }
      setEventSetups(saved);
    } catch (err) {
      console.error('Error loading event setups:', err);
    }
  };

  const loadGarageSetups = async () => {
    if (!carId) return;
    try {
      const events = await window.api.getEventsWithSessions();
      const garage = events.filter(e => e.carId == carId && e.trackId == 1);
      const result = [];
      for (const ev of garage) {
        const sessionsList = [];
        for (const s of ev.Sessions || []) {
          const spv = await window.api.getSessionPartsValuesBySessionId(s.id);
          if (spv) sessionsList.push(s);
        }
        if (sessionsList.length > 0) result.push({ ...ev, Sessions: sessionsList });
      }
      setGarageEvents(result);
    } catch (err) {
      console.error('Error loading garage setups:', err);
    }
  };

  const openLoadModal = () => {
    setShowLoadModal(true);
    loadEventSetups();
    loadGarageSetups();
  };

  const handleLoadSetup = async (sessionId) => {
    try {
      const spv = await window.api.getSessionPartsValuesBySessionId(sessionId);
      if (spv) {
        setValues(spv.values);
        setShowLoadModal(false);
      }
    } catch (err) {
      console.error('Error loading setup:', err);
    }
  };

  const handleTabDragStart = (index) => {
    setDraggedTabIndex(index);
  };

  const handleTabDrop = (index) => {
    if (draggedTabIndex === null || draggedTabIndex === index) return;
    const updated = [...sessions];
    const [moved] = updated.splice(draggedTabIndex, 1);
    updated.splice(index, 0, moved);
    setSessions(updated);
    setDraggedTabIndex(null);
    if (currentEvent) {
      const order = updated.map(s => s.id);
      localStorage.setItem(`sessionOrder_${currentEvent.id}`, JSON.stringify(order));
    }
  };

  const handleSessionContextMenu = (e, session) => {
    e.preventDefault();
    contextMenu.show({
      id: 'session-menu',
      event: e.nativeEvent || e,
      props: { session }
    });
  };

  const startRenameSession = ({ props }) => {
    setEditingSessionId(props.session.id);
    setEditingSessionName(props.session.name);
  };

  const handleDeleteSession = async ({ props }) => {
    setModalMessage('Are you sure you want to delete this session? This action cannot be undone and will remove all associated data.');
    setIsModalOpen(true);
    setModalCallback(async (confirm) => {
      if (confirm) {
        try {
          if (currentSession === props.session.id) {
            setCurrentSession(null);
          }
          console.debug('Deleting session with id:', props.session.id);
          await window.api.deleteSession(props.session.id);
          console.debug('Session deleted, reloading sessions');
          await loadSessions(currentEvent.id);
        } catch (error) {
          console.error('Error deleting session:', error);
        }
      }
    });
  };

  const saveSessionName = async () => {
    if (editingSessionId) {
      try {
        await window.api.updateSessionName(editingSessionId, editingSessionName);
        const updated = sessions.map(s =>
          s.id === editingSessionId ? { ...s, name: editingSessionName } : s
        );
        setSessions(updated);
      } catch (error) {
        console.error('Error updating session name:', error);
      }
    }
    setEditingSessionId(null);
    setEditingSessionName('');
  };

  const handleAddNewSession = async () => {
    if (!currentEvent) return;
    try {
      const newSession = await window.api.addSession(currentEvent.id, new Date(), 'track', 'New Session');
      await Promise.all([
        window.api.addPreSessionNotes(newSession.id, preTemplate.length > 0 ? preTemplate : []),
        window.api.addPostSessionNotes(newSession.id, postTemplate.length > 0 ? postTemplate : [])
      ]);
      const updated = [...sessions, newSession];
      setSessions(updated);
      setCurrentSession(newSession.id);
      const order = updated.map(s => s.id);
      localStorage.setItem(`sessionOrder_${currentEvent.id}`, JSON.stringify(order));
      setEditingSessionId(newSession.id);
      setEditingSessionName(newSession.name);
    } catch (error) {
      console.error('Error adding session:', error);
    }
  };

  const handleTableLightboxClose = () => {
    setShowTableLightbox(false);
    setCurrentPart(null);
  };

  const handleSetupSubmit = async () => {
    try {
      // Update all part values
      for (const partId in values) {
        await window.api.updatePartValue(partId, values[partId]);
      }
  
      // Check for existing session parts values
      const existingSessionPartsValues = await window.api.getSessionPartsValuesBySessionId(currentSession) || {};
      if (Object.keys(existingSessionPartsValues).length > 0) {
        await window.api.deleteSessionPartsValuesBySessionId(currentSession);
      }
  
      // Add new session parts values
      await window.api.addSessionPartsValue2(currentSession, values);

      // Save notes
      await window.api.updatePreSessionNotes(currentSession, preSessionNotes);
      await window.api.updatePostSessionNotes(currentSession, postSessionNotes);
      await window.api.updateEventInfo(currentEvent.id, eventInfo.temperature, eventInfo.humidity, eventInfo.notes);

      // Refresh the sessions to ensure data is up-to-date but preserve current session
      if (currentEvent && sessions.length > 0) {
        const order = sessions.map(s => s.id);
        localStorage.setItem(`sessionOrder_${currentEvent.id}`, JSON.stringify(order));
      }
      await loadSessions(currentEvent.id);
      setCurrentSession(currentSession); // Ensure the selected session remains highlighted
  
      // Show success toast with session and event details
      toast.success(`Parts values for ${sessions.find(s => s.id === currentSession)?.name || 'session'} updated for ${currentEvent.name}`);
    } catch (error) {
      console.error('Error during setup submit:', error);
      toast.error('Failed to update parts values.');
    }
  };

  const loadSessionNotes = async (sessionId) => {
    try {
      const preNotes = await window.api.getPreSessionNotesBySessionId(sessionId);
      const postNotes = await window.api.getPostSessionNotesBySessionId(sessionId);
      setPreSessionNotes(preNotes ? preNotes.notes : []);
      setPostSessionNotes(postNotes ? postNotes.notes : []);
    } catch (error) {
      console.error('Error loading session notes:', error);
    }
  };

  const renderNotesForm = (notes, setNotes) => {
    return notes.map((note, index) => (
      <div
        className={`notes-row ${note.type === 'Paragraph' ? 'paragraph' : ''}`}
        key={index}
      >
        <div className="notes-label">{note.title}</div>
        <div className="notes-input">
          {note.type === 'Text' ? (
            <input
              type="text"
              value={note.value || ''}
              onChange={(e) => {
                const newNotes = [...notes];
                newNotes[index].value = e.target.value;
                setNotes(newNotes);
              }}
            />
          ) : note.type === 'Paragraph' ? (
            <textarea
              value={note.value || ''}
              onChange={(e) => {
                const newNotes = [...notes];
                newNotes[index].value = e.target.value;
                setNotes(newNotes);
              }}
            />
          ) : null}
        </div>
      </div>
    ));
  };

  const handleShowAll = () => {
    setShowAll(true);
  };

  const handleHideAll = () => {
    setShowAll(false);
  };

  const startEditInfo = () => {
    if (!currentEvent) return;
    setEditTrack(tracks.find(t => t.id === currentEvent.trackId)?.name || '');
    setEditName(currentEvent.name);
    setEditDate(new Date(currentEvent.date).toISOString().split('T')[0]);
    setIsEditingInfo(true);
  };

  const saveEventInfo = async () => {
    if (!currentEvent) return;
    let trackId = tracks.find(t => t.name === editTrack)?.id;
    if (!trackId) {
      const newTrack = await window.api.addTrack(editTrack);
      trackId = newTrack.id;
    }
    await window.api.updateEvent(currentEvent.id, { name: editName, date: new Date(editDate), trackId });
    await window.api.updateEventInfo(currentEvent.id, eventInfo.temperature, eventInfo.humidity, eventInfo.notes);
    setCurrentEvent({ ...currentEvent, name: editName, date: new Date(editDate).toISOString(), trackId });
    setIsEditingInfo(false);
  };

  const cancelEditInfo = () => {
    setIsEditingInfo(false);
  };

  useEffect(() => {
    return () => {
      if (currentEvent && sessions.length > 0) {
        const order = sessions.map(s => s.id);
        localStorage.setItem(`sessionOrder_${currentEvent.id}`, JSON.stringify(order));
      }
    };
  }, [currentEvent, sessions]);

  return (
    <div className="trackside">
      <ToastContainer />
      {currentEvent ? (
        <div className="dashboard">
          <div className="left-column">
            <h2>{currentEvent.name}</h2>
            <div className="event-info box">
              {(() => {
                const track = tracks.find(t => t.id === currentEvent.trackId);
                return track && track.photo ? (
                  <img src={track.photo} alt={track.name} className="track-photo" />
                ) : null;
              })()}
              <div className="event-info-content">
                {isEditingInfo ? (
                  <>
                    <div className="form-group">
                      <label>Track:</label>
                      <input type="text" list="track-options" value={editTrack} onChange={(e) => setEditTrack(e.target.value)} />
                      <datalist id="track-options">
                        {tracks.map((track, index) => (
                          <option key={index} value={track.name} />
                        ))}
                      </datalist>
                    </div>
                    <div className="form-group">
                      <label>Event Name:</label>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Event Date:</label>
                      <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                    </div>
                    <button onClick={saveEventInfo}>💾</button>
                    <button onClick={cancelEditInfo}>Cancel</button>
                  </>
                ) : (
                  <>
                    <div className="info-row"><strong>Track:</strong> {tracks.find(t => t.id === currentEvent.trackId)?.name}</div>
                    <div className="info-row"><strong>Event:</strong> {currentEvent.name}</div>
                    <div className="info-row"><strong>Date:</strong> {new Date(currentEvent.date).toISOString().split('T')[0]}</div>
                    <button className="edit-info" onClick={startEditInfo}>✏️</button>
                  </>
                )}
              </div>
            </div>
            <div className="event-conditions box">
              <div className="form-group">
                <label>Temp:</label>
                <input type="text" value={eventInfo.temperature || ''} onChange={(e) => setEventInfo({ ...eventInfo, temperature: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Humidity:</label>
                <input type="text" value={eventInfo.humidity || ''} onChange={(e) => setEventInfo({ ...eventInfo, humidity: e.target.value })} />
              </div>
              <div className="form-group">
                <label>General Notes:</label>
                <textarea value={eventInfo.notes || ''} onChange={(e) => setEventInfo({ ...eventInfo, notes: e.target.value })} />
              </div>
            </div>
            <button className="end-event" onClick={handleEndEvent}>End Event</button>
          </div>
          <div className="right-column">
            <div className="session-tabs">
              {sessions.map((session, index) => (
                <div
                  key={session.id}
                  className={`session-tab ${session.id == currentSession ? 'active' : ''}`}
                  draggable
                  onDragStart={() => handleTabDragStart(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleTabDrop(index)}
                  onClick={() => handleSessionClick(session.id)}
                  onContextMenu={(e) => handleSessionContextMenu(e, session)}
                >
                  {editingSessionId === session.id ? (
                    <input
                      type="text"
                      value={editingSessionName}
                      onChange={(e) => setEditingSessionName(e.target.value)}
                      onBlur={saveSessionName}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveSessionName(); }}
                      autoFocus
                    />
                  ) : (
                    session.name || session
                  )}
                </div>
              ))}
              <div className="session-tab add-tab" onClick={handleAddNewSession}>+</div>
            </div>
            <div className="notes-columns">
              <div className="box pre-notes">
                <h2>Pre-Session Notes</h2>
                {renderNotesForm(preSessionNotes, setPreSessionNotes)}
              </div>
              <div className="box post-notes">
                <h2>Post-Session Notes</h2>
                {renderNotesForm(postSessionNotes, setPostSessionNotes)}
              </div>
            </div>
            <div className="box setup-box">
              <h2>Setup</h2>
              <button className="bring-garage" onClick={handleBringSetupToGarage}>Bring Setup To Garage</button>
              <button className="load-setup" onClick={openLoadModal}>Load Setup</button>
              <div className="search-controls">
                <input
                  type="text"
                  placeholder="Search Parts"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  className={showAll ? 'active' : ''}
                  onClick={handleShowAll}
                >
                  Show All
                </button>
                <button
                  className={!showAll ? 'active' : ''}
                  onClick={handleHideAll}
                >
                  Hide All
                </button>
              </div>
              <PartsGrid
                gridLayout={gridLayout}
                groupedParts={groupedParts}
                values={values}
                handleChange={handleChange}
                handleIncrement={handleIncrement}
                handleDecrement={handleDecrement}
                handleTableLinkClick={handleTableLinkClick}
                showAll={showAll}
                searchTerm={searchTerm}
              />
              <div className="bottom-space"></div>
            </div>
            <button className="save-notes" onClick={handleSetupSubmit}>Save Notes</button>
            <div className="bottom-bar"></div>
          </div>
        </div>
      ) : (
        <div className="trackside-events-wrapper">
          <h2>Trackside Events</h2>
          <button className="create-event-button" onClick={toggleForm}>{showForm ? 'Cancel' : 'Create New Event'}</button>
          {events.length > 0 ? (
            <div className="event-list">
              {events.map((event, index) => (
                <button
                  key={index}
                  className="event-button"
                  style={{ filter: `saturate(${1 - index * 0.1})` }}
                  onClick={() => handleSelectEvent(event)}
                  onContextMenu={(e) => handleContextMenu(e, event)}
                >
                  <span className="event-title">{event.name}</span>
                  <span className="event-date">{new Date(event.date).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          ) : (
            <p>No trackside events available. Create a new event.</p>
          )}

          {showForm && (
            <div className="create-event">
              <h2>Create Event</h2>
              <form onSubmit={handleSubmit}>
                <label>
                  Track Name:
                  <input
                    type="text"
                    list="track-options"
                    value={selectedTrack}
                    onChange={handleTrackChange}
                    required
                  />
                  <datalist id="track-options">
                    {tracks.map((track, index) => (
                      <option key={index} value={track.name} />
                    ))}
                  </datalist>
                </label>
                <label>
                  Event Name:
                  <input
                    type="text"
                    value={eventName}
                    onChange={handleEventNameChange}
                  />
                </label>
                <label>
                  Event Date:
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Sessions:
                  <div>
                    {['Practice', 'Heat', 'Feature'].map((session, index) => (
                      <div key={index}>
                        <input
                          type="checkbox"
                          id={`session-${index}`}
                          value={session}
                          onChange={() => handleSessionChange(session)}
                          checked={selectedSessions.includes(session)}
                        />
                        <label htmlFor={`session-${index}`}>{session}</label>
                      </div>
                    ))}
                    {sessions.map((session, index) => (
                      <div key={index}>
                        <input
                          type="checkbox"
                          id={`session-${index + 3}`}
                          value={session.name || session}
                          onChange={() => handleSessionChange(session.name || session)}
                          checked={selectedSessions.includes(session.name || session)}
                        />
                        <label htmlFor={`session-${index + 3}`}>{session.name || session}</label>
                      </div>
                    ))}
                  </div>
                </label>
                <button type="button" onClick={toggleCustomSessions}>Add Custom Sessions</button>
                {showCustomSessions && (
                  <div>
                    <input
                      type="text"
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                    />
                    <button type="button" onClick={handleAddSession}>+</button>
                  </div>
                )}
                <button type="submit">Submit</button>
              </form>
            </div>
          )}
        </div>
      )}
      {showTableLightbox && (
        <div className="lightbox">
          <div className="lightbox-content">
            <h2>{currentPart.name} Table</h2>
            <EditableTable
              value={values[currentPart.id]}
              onChange={(newValue) => handleChange(currentPart.id, newValue)}
            />
            <button onClick={handleTableLightboxClose}>Close</button>
          </div>
        </div>
      )}
      <Modal
        isOpen={showLoadModal}
        onRequestClose={() => setShowLoadModal(false)}
        contentLabel="Load Setup"
        className="modal load-setup-modal"
        overlayClassName="overlay"
      >
        <h2>Load Setup</h2>
        <div className="load-section">
          <h3>From This Event</h3>
          {eventSetups.length > 0 ? (
            eventSetups.map((sess) => (
              <div key={sess.id} className="session-item">
                <span>{sess.name || sess.type}</span>
                <button className="load-btn" onClick={() => handleLoadSetup(sess.id)}>Load</button>
              </div>
            ))
          ) : (
            <p>No saved setups.</p>
          )}
        </div>
        <div className="load-section">
          <h3>Setup Garage</h3>
          {garageEvents.length > 0 ? (
            garageEvents.map((ev) => (
              <div key={ev.id} className="event-group">
                <button
                  className={`accordion-button ${expandedGarageEvent === ev.id ? 'expanded' : ''}`}
                  onClick={() => setExpandedGarageEvent(expandedGarageEvent === ev.id ? null : ev.id)}
                >
                  {ev.name}
                </button>
                {expandedGarageEvent === ev.id && (
                  <ul>
                    {ev.Sessions.map((s) => (
                      <li key={s.id} className="session-item">
                        <span>{s.name}</span>
                        <button className="load-btn" onClick={() => handleLoadSetup(s.id)}>Load</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          ) : (
            <p>No garage setups available.</p>
          )}
        </div>
        <button onClick={() => setShowLoadModal(false)}>Close</button>
      </Modal>
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Confirm Deletion"
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Confirm Deletion</h2>
        <p>{modalMessage}</p>
        <button onClick={() => handleModalOption(true)}>Yes</button>
        <button onClick={() => handleModalOption(false)}>No</button>
      </Modal>
      <Menu id="event-menu">
        <Item onClick={handleDeleteEvent}>Delete Event</Item>
      </Menu>
      <Menu id="session-menu">
        <Item onClick={startRenameSession}>Rename Session</Item>
        <Item onClick={handleDeleteSession}>Delete Session</Item>
      </Menu>
    </div>
  );
};

export default Trackside;
