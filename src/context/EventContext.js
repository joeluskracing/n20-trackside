import React, { createContext, useContext, useState } from 'react';

const EventContext = createContext();

export const useEvent = () => {
  return useContext(EventContext);
};

export const EventProvider = ({ children }) => {
  const [currentEvent, setCurrentEvent] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);

  return (
    <EventContext.Provider value={{ currentEvent, setCurrentEvent, currentSession, setCurrentSession }}>
      {children}
    </EventContext.Provider>
  );
};
