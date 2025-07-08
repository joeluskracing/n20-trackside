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
  const [editingName, setEditingName] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [clickTimer, setClickTimer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCallback, setModalCallback] = useState(null);
  const navigate = useNavigate();

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

  const handleSubmit = async () => {
    try {
      // Update all part values
      for (const partId in values) {
        await window.api.updatePartValue(partId, values[partId]);
      }

      // Check for events in the last 24 hours
      let eventId;
      const garageTrackId = 1; // ID of the "Garage" track

      const recentEvents = await window.api.getEventsInLast24Hours();
      const recentEvent = recentEvents.find(event => event.carId == carId && event.trackId == 1);
      if (recentEvent) {
        setIsModalOpen(true);
        setModalCallback(() => async (option) => {
          if (option === 'yes') {
            eventId = recentEvent.id;
          } else if (option === 'no') {
            const newEvent = await window.api.addEvent(`Garage session on ${new Date().toISOString().split('T')[0]}`, new Date(), garageTrackId, carId);
            eventId = newEvent.id;
          }
          if (eventId) {
            // Fetch existing sessions for the event
            const existingSessions = await window.api.getSessions(eventId);
            const sessionCount = existingSessions.length;

            // Add new session with the current title
            const newSession = await window.api.addSession(eventId, new Date(), 'garage', sessionTitle);

            // Add session parts values
            await window.api.addSessionPartsValue(newSession.id, values);

            // Update session list
            loadEventsWithSessions();
          }
        });
      } else {
        const newEvent = await window.api.addEvent(`Garage session on ${new Date().toISOString().split('T')[0]}`, new Date(), garageTrackId, carId);
        eventId = newEvent.id;
      }

      if (!isModalOpen && eventId) {
        // Fetch existing sessions for the event
        const existingSessions = await window.api.getSessions(eventId);
        const sessionCount = existingSessions.length;

        // Add new session with the current title
        const newSession = await window.api.addSession(eventId, new Date(), 'garage', sessionTitle);

        // Add session parts values
        await window.api.addSessionPartsValue(newSession.id, values);

        // Update session list
        loadEventsWithSessions();
      }
    } catch (error) {
      console.error('Error during submit:', error);
    }
  };

  const handleEventClick = (eventId) => {
    setSelectedEventId(eventId);
  };

  const handleSessionClick = async (session) => {
    const loadSession = confirm(`Would you like to load ${session.name}?`);
    if (loadSession) {
      const sessionPartsValues = await window.api.getSessionPartsValuesBySessionId(session.id);
      if (sessionPartsValues) {
        setValues(sessionPartsValues.values);
        setSessionTitle(session.name);
      }
    }
  };

  const handleSingleClick = (session) => {
    if (!clickTimer) {
      setClickTimer(setTimeout(() => {
        handleSessionClick(session);
        setClickTimer(null);
      }, 200)); // Adjust delay as needed
    }
  };

  const handleDoubleClick = (session) => {
    if (clickTimer) {
      clearTimeout(clickTimer);
      setClickTimer(null);
    }
    handleSessionDoubleClick(session);
  };

  const handleSessionDoubleClick = (session) => {
    setEditingSessionId(session.id);
    setEditingName(session.name);
  };

  const handleEventDoubleClick = (event) => {
    setEditingEventId(event.id);
    setEditingName(event.name);
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

  const handleTitleDoubleClick = () => {
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

  const closeModal = () => {
    setIsModalOpen(false);
    setModalCallback(null);
  };

  const handleModalOption = async (option) => {
    closeModal();
    if (modalCallback) {
      await modalCallback(option)();
    }
  };

  return (
    <div className="garage">
      <div className="left-column">
        <h2>Garage Mode</h2>
        <p className="tip">Right click a session to delete it.</p>
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
                <h3
                  onClick={() => handleEventClick(event.id)}
                  onDoubleClick={() => handleEventDoubleClick(event)}
                  onContextMenu={(e) => handleContextMenu(e, event, 'event')}
                >
                  {event.name}
                </h3>
              )}
              {selectedEventId === event.id && (
                <ul>
                  {event.Sessions && event.Sessions.length > 0 ? (
                    event.Sessions.map((session, index) => (
                      <li
                        key={index}
                        onClick={() => handleSingleClick(session)}
                        onDoubleClick={() => handleDoubleClick(session)}
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
                          session.name
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
          <h2 onDoubleClick={handleTitleDoubleClick}>{sessionTitle}</h2>
        )}
        <p className="tip">Double click the title to edit.</p>
        <button onClick={handleSubmit} disabled={parts.length === 0}>Submit</button>
        <PartsGrid
          gridLayout={gridLayout}
          groupedParts={groupedParts}
          values={values}
          handleChange={handleChange}
          handleIncrement={handleIncrement}
          handleDecrement={handleDecrement}
          handleTableLinkClick={handleTableLinkClick}
          showAll={true}
          searchTerm={''}
        />
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
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Select Event Option"
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Select Event Option</h2>
        <p>Would you like to add log entries to the most recent event, create a new event, or cancel?</p>
        <button onClick={() => handleModalOption('yes')}>Add to Last Event</button>
        <button onClick={() => handleModalOption('no')}>Create New Event</button>
        <button onClick={() => handleModalOption('cancel')}>Cancel</button>
      </Modal>
      <Menu id="event-menu">
        <Item onClick={handleDeleteEvent}>Delete Event</Item>
      </Menu>
      <Menu id="session-menu">
        <Item onClick={handleDeleteSession}>Delete Session</Item>
      </Menu>
    </div>
  );
};

export default Garage;
