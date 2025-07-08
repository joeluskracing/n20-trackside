import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCar } from '../context/CarContext';
import { useEvent } from '../context/EventContext';
import './TracksideNotice.css';

const TracksideNotice = () => {
  const { selectedCar } = useCar();
  const { setCurrentEvent } = useEvent();
  const [todayEvent, setTodayEvent] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchEvent = async () => {
      if (!selectedCar) return;
      try {
        const event = await window.api.getTodayTracksideEvent(selectedCar);
        setTodayEvent(event);
      } catch (error) {
        console.error('Error fetching today\'s event:', error);
      }
    };
    fetchEvent();
  }, [selectedCar]);

  if (location.pathname === '/trackside' || !todayEvent) {
    return null;
  }

  const handleClick = () => {
    setCurrentEvent(todayEvent);
    navigate('/trackside');
  };

  return (
    <div className="trackside-notice-container">
      <button className="reopen-trackside-button" onClick={handleClick}>
        CLICK TO RE-OPEN TRACKSIDE FOR {todayEvent.name}
      </button>
    </div>
  );
};

export default TracksideNotice;
