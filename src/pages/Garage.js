// Garage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import './Garage.css';
import { useCar } from '../context/CarContext';
import { Menu, Item, contextMenu } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import EditableTable from '../components/EditableTable';
import PartsGrid from '../components/PartsGrid';
import '../components/PartsGrid.css';
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

const Garage = () => {
  const { selectedCar: carId, carName } = useCar();
  const [parts, setParts] = useState([]);
  const [groupedParts, setGroupedParts] = useState({});
  const [sessions, setSessions] = useState([]);
  const [values, setValues] = useState({});
  const [showTableLightbox, setShowTableLightbox] = useState(false);
  const [currentPart, setCurrentPart] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedSaveEventId, setSelectedSaveEventId] = useState(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (carId) {
      loadParts();
      loadEventsWithSessions();
      setSessionTitle(`Current Setup at ${new Date().toLocaleString()}`);
    }
  }, [carId, carName]);

  const loadParts = async () => {
    try {
      const fetchedParts = await window.api.getParts(carId);
      const partsValues = await window.api.getPartsValues();

      const uniqueParts = ensureUniqueOrder(fetchedParts);
      const sortedParts = uniqueParts.sort((a, b) => a.order - b.order);
      setParts(sortedParts);

      await initializeValues(sortedParts, partsValues);

      const storedValues = localStorage.getItem('garageSetupValues');
      if (storedValues) {
        setValues(JSON.parse(storedValues));
        localStorage.removeItem('garageSetupValues');
      }
      const storedTitle = localStorage.getItem('garageSetupTitle');
      if (storedTitle) {
        setSessionTitle(storedTitle);
        localStorage.removeItem('garageSetupTitle');
      }

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

  const initializeValues = async (parts, partsValues) => {
    const initialValues = {};

    for (const part of parts) {
      let partValue = partsValues.find((pv) => pv.partId === part.id);
      if (!partValue) {
        partValue = await window.api.addPartValue(part.id, null);
        initialValues[part.id] = '';
      } else {
        initialValues[part.id] = partValue.value;
      }
    }

    setValues(initialValues);
  };

  const loadEventsWithSessions = async () => {
    try {
      const fetchedEvents = await window.api.getEventsWithSessions();
      const filteredEvents = fetchedEvents.filter(event => event.carId == carId && event.trackId == 1);
      const sortedEvents = filteredEvents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setEvents(sortedEvents);
    } catch (error) {
      console.error('Error loading events with sessions:', error);
    }
  };

  const handleChange = (partId, value) => {
    setValues({ ...values, [partId]: value });
    if (!sessionTitle.startsWith("Modified from")) {
      setSessionTitle(`Modified from ${sessionTitle.split(' at ')[0]} at ${new Date().toLocaleString()}`);
    }
  };

  const handleIncrement = (partId) => {
    setValues({ ...values, [partId]: (values[partId] || 0) + 1 });
    if (!sessionTitle.startsWith("Modified from")) {
      setSessionTitle(`Modified from ${sessionTitle.split(' at ')[0]} at ${new Date().toLocaleString()}`);
    }
  };

  const handleDecrement = (partId) => {
    setValues({ ...values, [partId]: (values[partId] || 0) - 1 });
    if (!sessionTitle.startsWith("Modified from")) {
      setSessionTitle(`Modified from ${sessionTitle.split(' at ')[0]} at ${new Date().toLocaleString()}`);
    }
  };

  const handleTableLinkClick = (part) => {
    setCurrentPart(part);
    setShowTableLightbox(true);
  };

  const handleTableLightboxClose = () => {
    setShowTableLightbox(false);
    setCurrentPart(null);
  };

  const saveToEvent = async (eventId) => {
    const newSession = await window.api.addSession(eventId, new Date(), 'garage', sessionTitle);
    await window.api.addSessionPartsValue(newSession.id, values);
    loadEventsWithSessions();
    setCurrentSessionId(newSession.id);
    setSelectedEventId(eventId);
    toast.success('Setup saved');
  };

  const createNewEventAndSave = async () => {
    const garageTrackId = 1;
    const newEvent = await window.api.addEvent(`Garage session on ${new Date().toISOString().split('T')[0]}`, new Date(), garageTrackId, carId);
    await saveToEvent(newEvent.id);
  };

  const handleSubmit = async () => {
    try {
      for (const partId in values) {
        await window.api.updatePartValue(partId, values[partId]);
      }

      if (events.length === 0) {
        await createNewEventAndSave();
      } else {
        setSelectedSaveEventId(events[0].id);
        setIsEventModalOpen(true);
      }
    } catch (error) {
      console.error('Error during submit:', error);
    }
  };

  const handleEventClick = (eventId) => {
    if (editingEventId) return;
    setSelectedEventId((prev) => (prev === eventId ? null : eventId));
  };

  const handleLoadSession = async (session) => {
    if (editingSessionId) return;
    const loadSession = confirm(`Would you like to load ${session.name}?`);
    if (loadSession) {
      const sessionPartsValues = await window.api.getSessionPartsValuesBySessionId(session.id);
      if (sessionPartsValues) {
        setValues(sessionPartsValues.values);
        setSessionTitle(session.name);
        setCurrentSessionId(session.id);
      }
    }
  };



  const handleEditingNameChange = (e) => {
    setEditingName(e.target.value);
  };

  const handleEditingNameBlur = async () => {
    try {
      if (editingEventId) {
        await window.api.updateEventName(editingEventId, editingName);
      } else if (editingSessionId) {
        await window.api.updateSessionName(editingSessionId, editingName);
      }
      setEditingEventId(null);
      setEditingSessionId(null);
      loadEventsWithSessions();
    } catch (error) {
      console.error('Error updating name:', error);
    }
  };

  const handleTitleContextMenu = (e) => {
    e.preventDefault();
    setEditingTitle(true);
    setEditingName(sessionTitle);
  };

  const handleTitleChange = (e) => {
    setEditingName(e.target.value);
  };

  const handleTitleBlur = () => {
    setSessionTitle(editingName);
    setEditingTitle(false);
  };

  const handleContextMenu = (e, item, type) => {
    e.preventDefault();
    contextMenu.show({
      id: type === 'event' ? 'event-menu' : 'session-menu',
      event: e,
      props: { item }
    });
  };

  const handleDeleteEvent = async ({ props }) => {
    try {
      await window.api.deleteEvent(props.item.id);
      loadEventsWithSessions();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleDeleteSession = async ({ props }) => {
    try {
      await window.api.deleteSession(props.item.id);
      loadEventsWithSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleRenameEvent = ({ props }) => {
    setEditingEventId(props.item.id);
    setEditingName(props.item.name);
  };

  const handleRenameSession = ({ props }) => {
    setEditingSessionId(props.item.id);
    setEditingName(props.item.name);
  };

  const closeModal = () => {
    setIsEventModalOpen(false);
  };

  const handleShowAll = () => {
    setShowAll(true);
  };

  const handleHideAll = () => {
    setShowAll(false);
  };

  return (
    <div className="garage">
      <ToastContainer />
      <div className="left-column">
        <h2>Garage Mode</h2>
        <p className="tip">Right click an event or session to rename or delete it.</p>
        {events.length > 0 ? (
          events.map((event, index) => (
            <div key={index} className="event-group">
              {editingEventId === event.id ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={handleEditingNameChange}
                  onBlur={handleEditingNameBlur}
                  autoFocus
                  className="editing-input"
                />
              ) : (
                <button
                  className={`accordion-button ${selectedEventId === event.id ? 'expanded' : ''}`}
                  onClick={() => handleEventClick(event.id)}
                  onContextMenu={(e) => handleContextMenu(e, event, 'event')}
                >
                  {event.name}
                </button>
              )}
              {selectedEventId === event.id && (
                <ul>
                  {event.Sessions && event.Sessions.length > 0 ? (
                    event.Sessions.map((session, index) => (
                      <li
                        key={index}
                        className="session-item"
                        onContextMenu={(e) => handleContextMenu(e, session, 'session')}
                      >
                        {editingSessionId === session.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={handleEditingNameChange}
                            onBlur={handleEditingNameBlur}
                            autoFocus
                            className="editing-input"
                          />
                        ) : (
                          <>
                            <span>{session.name}</span>
                            {currentSessionId === session.id ? (
                              <button className="load-btn" disabled>Loaded</button>
                            ) : (
                              <button className="load-btn" onClick={() => handleLoadSession(session)}>Load</button>
                            )}
                          </>
                        )}
                      </li>
                    ))
                  ) : (
                    <li>No sessions available for this event</li>
                  )}
                </ul>
              )}
            </div>
          ))
        ) : (
          <p>No events available. Save changes to initialize an event.</p>
        )}
      </div>
      <div className="right-column">
        {editingTitle ? (
          <input
            type="text"
            value={editingName}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            autoFocus
            className="editing-input"
          />
        ) : (
          <h2 onContextMenu={handleTitleContextMenu}>{sessionTitle}</h2>
        )}
        <p className="tip">Right click the title to edit.</p>
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
        <button className="save-notes" onClick={handleSubmit}>Save Notes</button>
        <div className="bottom-bar"></div>
      </div>
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
        isOpen={isEventModalOpen}
        onRequestClose={closeModal}
        contentLabel="Select Folder"
        className="modal event-modal"
        overlayClassName="overlay"
      >
        <h2>Select Folder</h2>
        <p>Choose a folder to save this setup to, or create a new folder.</p>
        <ul className="event-select-list">
          {events.map((ev) => (
            <li key={ev.id}>
              <label>
                <input
                  type="radio"
                  name="eventSelect"
                  value={ev.id}
                  checked={selectedSaveEventId === ev.id}
                  onChange={() => setSelectedSaveEventId(ev.id)}
                />
                {ev.name}
              </label>
            </li>
          ))}
        </ul>
        <div className="event-modal-buttons">
          <button onClick={async () => { await saveToEvent(selectedSaveEventId); closeModal(); }}>Save</button>
          <button onClick={async () => { await createNewEventAndSave(); closeModal(); }}>Create New Folder</button>
          <button onClick={closeModal}>Cancel</button>
        </div>
      </Modal>
      <Menu id="event-menu">
        <Item onClick={handleRenameEvent}>Rename Event</Item>
        <Item onClick={handleDeleteEvent}>Delete Event</Item>
      </Menu>
      <Menu id="session-menu">
        <Item onClick={handleRenameSession}>Rename Session</Item>
        <Item onClick={handleDeleteSession}>Delete Session</Item>
      </Menu>
    </div>
  );
};

export default Garage;
