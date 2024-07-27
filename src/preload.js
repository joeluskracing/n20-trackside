const { contextBridge, ipcRenderer } = require('electron');
const { Sequelize, Op, Car, Part, Event, Session, PartsValues, SessionPartsValues } = require('./database');

contextBridge.exposeInMainWorld('api', {
  getCars: async () => {
    try {
      const cars = await Car.findAll();
      return cars.map(car => car.toJSON());
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  },
  getParts: async (carId) => {
    try {
      const parts = await Part.findAll({ where: { carId } });
      return parts.map(part => part.toJSON());
    } catch (error) {
      console.error('Error fetching parts:', error);
    }
  },
  getEvents: async () => {
    return await Event.findAll();
  },
  getSessions: async (eventId) => {
    return await Session.findAll({ where: { eventId } });
  },
  getPartsValues: async () => {
    try {
      const partsValues = await PartsValues.findAll();
      return partsValues.map(partsValue => partsValue.toJSON());
    } catch (error) {
      console.error('Error fetching parts values:', error);
    }
  },
  getSessionPartsValues: async (sessionId) => {
    return await SessionPartsValues.findAll({ where: { sessionId } });
  },
  addCar: async (name) => {
    try {
      return await Car.create({ name });
    } catch (error) {
      console.error('Error adding car:', error);
    }
  },
  addPart: async (name, carId, unit, entryType, displayLocation, subheading, order) => {
    try {
      return await Part.create({ name, carId, unit, entryType, displayLocation, subheading, order });
    } catch (error) {
      console.error('Error adding part:', error);
    }
  },
  updatePartOrder: async (id, order) => {
    try {
      return await Part.update({ order }, { where: { id } });
    } catch (error) {
      console.error('Error updating part order:', error);
    }
  },
  deletePart: async (id) => {
    try {
      return await Part.destroy({ where: { id } });
    } catch (error) {
      console.error('Error deleting part:', error);
    }
  },
  addEvent: async (name, date) => {
    return await Event.create({ name, date });
  },
  getEventByDate: async (date) => {
    try {
      return await Event.findOne({ where: { date } });
    } catch (error) {
      console.error('Error fetching event by date:', error);
    }
  },
  getEventsInLast24Hours: async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    try {
      const events = await Event.findAll({
        where: {
          date: {
            [Op.gte]: yesterday,
            [Op.lte]: now
          }
        }
      });
      return events.map(event => event.toJSON());
    } catch (error) {
      console.error('Error fetching events from last 24 hours:', error);
    }
  },
  addSession: async (eventId, date, type, name) => {
    try {
      const session = await Session.create({ eventId, date, type, name });
      return session.toJSON();
    } catch (error) {
      console.error('Error adding session:', error);
    }
  },
  addPartValue: async (partId, value) => {
    try {
      return await PartsValues.create({ partId, value });
    } catch (error) {
      console.error('Error adding part value:', error);
    }
  },
  addSessionPartsValue: async (sessionId, values) => {
    try {
      const sessionPartsValue = await SessionPartsValues.create({ sessionId, values });
      return sessionPartsValue.toJSON();
    } catch (error) {
      console.error('Error adding session parts value:', error);
    }
  },
  setLastSelectedSession: async (sessionId) => {
    await Session.update({ lastSelected: false }, { where: {} });
    return await Session.update({ lastSelected: true }, { where: { id: sessionId } });
  },
  getLastSelectedSession: async () => {
    return await Session.findOne({ where: { lastSelected: true } });
  },
  updatePartValue: async (partId, value) => {
    try {
      const partValue = await PartsValues.findOne({ where: { partId } });
      if (partValue) {
        partValue.value = value;
        await partValue.save();
      } else {
        await PartsValues.create({ partId, value });
      }
    } catch (error) {
      console.error('Error updating part value:', error);
    }
  },
  getEventsWithSessions: async () => {
    try {
      const events = await Event.findAll({
        include: [
          {
            model: Session,
            as: 'Sessions'
          }
        ]
      });
      return events.map(event => event.toJSON());
    } catch (error) {
      console.error('Error fetching events with sessions:', error);
    }
  },
  getSessionPartsValuesBySessionId: async (sessionId) => {
    try {
      const sessionPartsValues = await SessionPartsValues.findOne({ where: { sessionId } });
      return sessionPartsValues ? sessionPartsValues.toJSON() : null;
    } catch (error) {
      console.error('Error fetching session parts values:', error);
    }
  },
  deleteEvent: async (eventId) => {
    try {
      await Event.destroy({ where: { id: eventId } });
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  },
  deleteSession: async (sessionId) => {
    try {
      await SessionPartsValues.destroy({ where: { sessionId: sessionId } });
      await Session.destroy({ where: { id: sessionId } });
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  },
  updateEventName: async (eventId, newName) => {
    try {
      await Event.update({ name: newName }, { where: { id: eventId } });
    } catch (error) {
      console.error('Error updating event name:', error);
    }
  },
  updateSessionName: async (sessionId, newName) => {
    try {
      await Session.update({ name: newName }, { where: { id: sessionId } });
    } catch (error) {
      console.error('Error updating session name:', error);
    }
  },
});
