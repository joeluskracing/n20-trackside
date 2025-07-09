import React, { useState, useEffect } from 'react';
import { useCar } from '../context/CarContext';
import { useEvent } from '../context/EventContext';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import { Menu, Item, contextMenu } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import './TracksideWidget.css';

Modal.setAppElement('#root');

const TracksideWidget = () => {
  const { selectedCar: carId } = useCar();
  const { setCurrentEvent } = useEvent();
  const [events, setEvents] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessions, setSessions] = useState(['Practice', 'Heat', 'Feature']);
  const [newSessionName, setNewSessionName] = useState('');
  const [selectedSessions, setSelectedSessions] = useState(['Practice', 'Heat', 'Feature']);
  const [showForm, setShowForm] = useState(false);
  const [showCustomSessions, setShowCustomSessions] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCallback, setModalCallback] = useState(null);
  const [preTemplate, setPreTemplate] = useState([]);
  const [postTemplate, setPostTemplate] = useState([]);

  const navigate = useNavigate();

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
      const filteredTracks = fetchedTracks.filter(track => track.id !== 1);
      setTracks(filteredTracks);
    } catch (error) {
      console.error('Error loading tracks:', error);
    }
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
    const name = session.name || session;
    setSelectedSessions(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]);
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
    setShowForm(false);
    loadEvents();
    navigate('/trackside');
  };

  const toggleForm = () => setShowForm(!showForm);
  const toggleCustomSessions = () => setShowCustomSessions(!showCustomSessions);

  const handleContextMenu = (event, item) => {
    event.preventDefault();
    contextMenu.show({
      id: 'event-menu',
      event,
      props: { item }
    });
  };

  const handleDeleteEvent = async ({ props }) => {
    setIsModalOpen(true);
    setModalCallback(async (confirm) => {
      if (confirm) {
        try {
          await window.api.deleteEvent(props.item.id);
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
  };

  const handleModalOption = async (option) => {
    closeModal();
    if (modalCallback) {
      await modalCallback(option);
    }
  };

  const handleEventClick = (event) => {
    setCurrentEvent(event);
    navigate('/trackside');
  };

  const isEventRunning = (event) => {
    const eventDate = new Date(event.date);
    const now = new Date();
    const diff = Math.abs(now - eventDate);
    return diff <= 6 * 60 * 60 * 1000 && eventDate.toDateString() === now.toDateString();
  };

  return (
    <div className={`grid-box trackside-widget ${showForm ? 'expand' : ''}`}>
      <h2>Trackside Events</h2>
      <button className="create-event-button" onClick={toggleForm}>{showForm ? 'Cancel' : 'Create New Event'}</button>
      {events.length > 0 ? (
        <div className="event-list">
          {events.map((event, index) => {
            const track = tracks.find(t => t.id == event.trackId);
            const running = isEventRunning(event);
            return (
              <button
                key={index}
                className={`event-button${running ? ' running' : ''}`}
                style={{
                  filter: `saturate(${1 - index * 0.1})`,
                  '--track-photo': track && track.photo ? `url(${track.photo})` : 'none'
                }}
                onClick={() => handleEventClick(event)}
                onContextMenu={(e) => handleContextMenu(e, event)}
              >
                <span className="event-title">{event.name}</span>
                <span className="event-date">{new Date(event.date).toLocaleDateString()}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p>No trackside events available. Create a new event.</p>
      )}
      {showForm && (
        <div className="create-event">
          <h3>Create Event</h3>
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
              <input type="text" value={eventName} onChange={handleEventNameChange} />
            </label>
            <label>
              Event Date:
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
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
                {sessions.slice(3).map((session, index) => (
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
                <input type="text" value={newSessionName} onChange={(e) => setNewSessionName(e.target.value)} />
                <button type="button" onClick={handleAddSession}>+</button>
              </div>
            )}
            <button type="submit">Submit</button>
          </form>
        </div>
      )}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Confirm Deletion"
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Confirm Deletion</h2>
        <p>Are you sure you want to delete this event? This action cannot be undone and will remove all associated sessions and data.</p>
        <button onClick={() => handleModalOption(true)}>Yes</button>
        <button onClick={() => handleModalOption(false)}>No</button>
      </Modal>
      <Menu id="event-menu">
        <Item onClick={handleDeleteEvent}>Delete Event</Item>
      </Menu>
    </div>
  );
};

export default TracksideWidget;
