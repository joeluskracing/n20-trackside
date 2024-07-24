const { contextBridge } = require('electron');
const { Car, Part, Event, Session, PartsValues, SessionPartsValues } = require('./database');

contextBridge.exposeInMainWorld('api', {
  getCars: async () => {
    try {
      const cars = await Car.findAll();
      return cars.map(car => car.toJSON()); // Convert to plain objects
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  },
  getParts: async (carId) => {
    try {
      const parts = await Part.findAll({ where: { carId } });
      return parts.map(part => part.toJSON()); // Convert to plain objects
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
  getPartsValues: async (partId) => {
    return await PartsValues.findAll({ where: { partId } });
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
  addSession: async (eventId, date, type) => {
    return await Session.create({ eventId, date, type });
  },
  addPartsValue: async (partId, value) => {
    return await PartsValues.create({ partId, value });
  },
  addSessionPartsValue: async (sessionId, values) => {
    return await SessionPartsValues.create({ sessionId, values });
  },
  setLastSelectedSession: async (sessionId) => {
    await Session.update({ lastSelected: false }, { where: {} });
    return await Session.update({ lastSelected: true }, { where: { id: sessionId } });
  },
  getLastSelectedSession: async () => {
    return await Session.findOne({ where: { lastSelected: true } });
  }
});
