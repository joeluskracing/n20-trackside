const { contextBridge, ipcRenderer } = require('electron');
const { Sequelize, Op, Car, Track, Part, Event, EventInfo, Session, PartsValues, SessionPartsValues, NotesTemplate, PreSessionNotes, PostSessionNotes, ChecklistNote, CarTemplate} = require('./database');
const fs = require('fs');
const path = require('path');

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
    try {
      const sessions = await Session.findAll({ where: { eventId } });
      return sessions.map(session => session.toJSON()); // Convert to plain JavaScript objects
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
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
      const car = await Car.create({ name });
      return car.toJSON();
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
  updatePart: async (id, updates) => {
    try {
      return await Part.update(updates, { where: { id } });
    } catch (error) {
      console.error('Error updating part:', error);
    }
  },
  deletePart: async (id) => {
    try {
      return await Part.destroy({ where: { id } });
    } catch (error) {
      console.error('Error deleting part:', error);
    }
  },
  getPartUsage: async (partId) => {
    try {
      const spvs = await SessionPartsValues.findAll({ include: [{ model: Session, include: [Event] }] });
      const usage = [];
      for (const spv of spvs) {
        if (spv.values && Object.prototype.hasOwnProperty.call(spv.values, partId)) {
          if (spv.Session && spv.Session.Event) {
            usage.push({
              event: spv.Session.Event.name,
              date: spv.Session.Event.date,
              session: spv.Session.name || spv.Session.type
            });
          }
        }
      }
      return usage;
    } catch (error) {
      console.error('Error fetching part usage:', error);
      return [];
    }
  },
  addEvent: async (name, date, trackId, carId) => {
    try {
      const event = await Event.create({ name, date, trackId, carId });
      return event.toJSON(); // Return the full event object including its ID
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
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
  getTodayTracksideEvent: async (carId) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    try {
      const event = await Event.findOne({
        where: {
          carId,
          trackId: { [Op.ne]: 1 },
          date: {
            [Op.gte]: start,
            [Op.lte]: end
          }
        }
      });
      return event ? event.toJSON() : null;
    } catch (error) {
      console.error("Error fetching today's event:", error);
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
  addSessionPartsValue2: async (sessionId, values) => {
    try {
      const existingEntry = await SessionPartsValues.findOne({ where: { sessionId } });
      if (existingEntry) {
        await SessionPartsValues.update({ values }, { where: { sessionId } });
      } else {
        await SessionPartsValues.create({ sessionId, values });
      }
    } catch (error) {
      console.error('Error adding/updating session parts value:', error);
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
  updateEvent: async (eventId, data) => {
    try {
      await Event.update(data, { where: { id: eventId } });
    } catch (error) {
      console.error('Error updating event:', error);
    }
  },
  getEventInfo: async (eventId) => {
    try {
      const info = await EventInfo.findOne({ where: { eventId } });
      return info ? info.toJSON() : null;
    } catch (error) {
      console.error('Error fetching event info:', error);
    }
  },
  updateEventInfo: async (eventId, temperature, humidity, notes) => {
    try {
      const existing = await EventInfo.findOne({ where: { eventId } });
      if (existing) {
        await EventInfo.update({ temperature, humidity, notes }, { where: { eventId } });
      } else {
        await EventInfo.create({ eventId, temperature, humidity, notes });
      }
    } catch (error) {
      console.error('Error updating event info:', error);
    }
  },
  updateSessionName: async (sessionId, newName) => {
    try {
      await Session.update({ name: newName }, { where: { id: sessionId } });
    } catch (error) {
      console.error('Error updating session name:', error);
    }
  },
  getTracks: async () => {
    try {
      const tracks = await Track.findAll();
      return tracks.map(track => track.toJSON());
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
  },
  addTrack: async (name) => {
    try {
      const track = await Track.create({ name });
      return track.toJSON();
    } catch (error) {
      console.error('Error adding track:', error);
    }
  },
  getSession: async (sessionId) => {
    try {
      const session = await Session.findByPk(sessionId);
      return session ? session.toJSON() : null;
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  },
  addPreSessionNotes: async (sessionId, notes) => {
    try {
      const preSessionNotes = await PreSessionNotes.create({ sessionId, notes });
      return preSessionNotes.toJSON();
    } catch (error) {
      console.error('Error adding pre-session notes:', error);
    }
  },
  addPostSessionNotes: async (sessionId, notes) => {
    try {
      const postSessionNotes = await PostSessionNotes.create({ sessionId, notes });
      return postSessionNotes.toJSON();
    } catch (error) {
      console.error('Error adding post-session notes:', error);
    }
  },
  getPreSessionNotesBySessionId: async (sessionId) => {
    try {
      const preSessionNotes = await PreSessionNotes.findOne({ where: { sessionId } });
      return preSessionNotes ? preSessionNotes.toJSON() : null;
    } catch (error) {
      console.error('Error fetching pre-session notes:', error);
    }
  },
  getPostSessionNotesBySessionId: async (sessionId) => {
    try {
      const postSessionNotes = await PostSessionNotes.findOne({ where: { sessionId } });
      return postSessionNotes ? postSessionNotes.toJSON() : null;
    } catch (error) {
      console.error('Error fetching post-session notes:', error);
    }
  },
  updatePreSessionNotes: async (sessionId, notes) => {
    try {
      const existingEntry = await PreSessionNotes.findOne({ where: { sessionId } });
      if (existingEntry) {
        await PreSessionNotes.update({ notes }, { where: { sessionId } });
      } else {
        await PreSessionNotes.create({ sessionId, notes });
      }
    } catch (error) {
      console.error('Error updating pre-session notes:', error);
    }
  },
  updatePostSessionNotes: async (sessionId, notes) => {
    try {
      const existingEntry = await PostSessionNotes.findOne({ where: { sessionId } });
      if (existingEntry) {
        await PostSessionNotes.update({ notes }, { where: { sessionId } });
      } else {
        await PostSessionNotes.create({ sessionId, notes });
      }
    } catch (error) {
      console.error('Error updating post-session notes:', error);
    }
  },
  getNotesTemplates: async () => {
    try {
      const templates = await NotesTemplate.findAll();
      return templates.map(t => t.toJSON());
    } catch (error) {
      console.error('Error fetching notes templates:', error);
      return [];
    }
  },
  updateNotesTemplate: async (name, fields) => {
    try {
      const existing = await NotesTemplate.findOne({ where: { name } });
      if (existing) {
        await NotesTemplate.update({ fields }, { where: { name } });
      } else {
        await NotesTemplate.create({ name, fields });
      }
    } catch (error) {
      console.error('Error updating notes template:', error);
    }
  },
  getCarTemplates: async () => {
    try {
      const templates = await CarTemplate.findAll();
      return templates.map(t => t.toJSON());
    } catch (error) {
      console.error('Error fetching car templates:', error);
      return [];
    }
  },
  addCarTemplate: async (carId, name) => {
    try {
      const parts = await Part.findAll({ where: { carId } });
      const partsData = parts.map(p => ({
        name: p.name,
        unit: p.unit,
        entryType: p.entryType,
        displayLocation: p.displayLocation,
        subheading: p.subheading,
        order: p.order
      }));
      const tmpl = await CarTemplate.create({ carId, name, parts: partsData });
      return tmpl.toJSON();
    } catch (error) {
      console.error('Error adding car template:', error);
    }
  },
  applyTemplateToCar: async (templateId, carId) => {
    try {
      const tmpl = await CarTemplate.findByPk(templateId);
      if (!tmpl) return;
      for (const part of tmpl.parts || []) {
        await Part.create({ ...part, carId });
      }
    } catch (error) {
      console.error('Error applying template to car:', error);
    }
  },
  deleteSessionPartsValuesBySessionId: async (sessionId) => {
    try {
      await SessionPartsValues.destroy({ where: { sessionId } });
    } catch (error) {
      console.error('Error deleting session parts values:', error);
    }
  },
  getStatsByYear: async (carId) => {
    try {
      const events = await Event.findAll({
        where: { carId, trackId: { [Op.ne]: 1 } },
        include: [{
          model: Session,
          as: 'Sessions',
          include: [PreSessionNotes, PostSessionNotes]
        }]
      });

      const stats = {};
      for (const event of events) {
        const year = new Date(event.date).getFullYear();
        if (!stats[year]) {
          stats[year] = {
            bestFeatureFinish: null,
            featureTopFives: 0,
            featureTopTens: 0,
            bestImprovement: null,
            totalFinish: 0,
            featureCount: 0,
            heatWins: 0
          };
        }

        for (const session of event.Sessions) {
          const pre = session.PreSessionNotes?.[0]?.notes || [];
          const post = session.PostSessionNotes?.[0]?.notes || [];
          const startNote = pre.find(n => n.title === 'Starting Position');
          const finishNote = post.find(n => n.title === 'Finishing Position');
          const startPos = startNote ? parseInt(startNote.value) : NaN;
          const finishPos = finishNote ? parseInt(finishNote.value) : NaN;
          const name = (session.name || '').toLowerCase();

          if (name.includes('feature')) {
            if (!isNaN(finishPos)) {
              if (stats[year].bestFeatureFinish === null || finishPos < stats[year].bestFeatureFinish) {
                stats[year].bestFeatureFinish = finishPos;
              }
              if (finishPos <= 5) stats[year].featureTopFives++;
              if (finishPos <= 10) stats[year].featureTopTens++;
              stats[year].totalFinish += finishPos;
              stats[year].featureCount++;
            }
            if (!isNaN(startPos) && !isNaN(finishPos)) {
              const improvement = startPos - finishPos;
              if (stats[year].bestImprovement === null || improvement > stats[year].bestImprovement) {
                stats[year].bestImprovement = improvement;
              }
            }
          } else if (name.includes('heat')) {
            if (!isNaN(finishPos) && finishPos === 1) {
              stats[year].heatWins++;
            }
          }
        }
      }

      for (const year of Object.keys(stats)) {
        const s = stats[year];
        if (s.featureCount > 0) {
          s.averageFinish = parseFloat((s.totalFinish / s.featureCount).toFixed(2));
        } else {
          s.averageFinish = null;
        }
        delete s.totalFinish;
        delete s.featureCount;
      }

      return stats;
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {};
    }
  },
  getChecklistNotes: async () => {
    try {
      const notes = await ChecklistNote.findAll({ order: [['createdAt', 'DESC']] });
      return notes.map(n => n.toJSON());
    } catch (error) {
      console.error('Error fetching checklist notes:', error);
      return [];
    }
  },
  addChecklistNote: async (title, content) => {
    try {
      const note = await ChecklistNote.create({ title, content });
      return note.toJSON();
    } catch (error) {
      console.error('Error adding checklist note:', error);
    }
  },
  updateChecklistNote: async (id, title, content) => {
    try {
      await ChecklistNote.update({ title, content }, { where: { id } });
    } catch (error) {
      console.error('Error updating checklist note:', error);
    }
  },
  deleteChecklistNote: async (id) => {
    try {
      await ChecklistNote.destroy({ where: { id } });
    } catch (error) {
      console.error('Error deleting checklist note:', error);
    }
  },
  exportCarData: async (carId) => {
    try {
      return await ipcRenderer.invoke('export-car-data', carId);
    } catch (error) {
      console.error('Error exporting car data:', error);
      throw error;
    }
  },
  importCarData: async (filePath) => {
    try {
      const data = JSON.parse(fs.readFileSync(filePath));
      const newCar = await Car.create({ name: data.name });

      if (data.NotesTemplates) {
        for (const tmpl of data.NotesTemplates) {
          const { name, fields } = tmpl;
          const existing = await NotesTemplate.findOne({ where: { name } });
          if (existing) {
            await NotesTemplate.update({ fields }, { where: { name } });
          } else {
            await NotesTemplate.create({ name, fields });
          }
        }
      }

      const partIdMap = {};
      if (data.Parts) {
        for (const part of data.Parts) {
          const { id, PartsValues: pv = [], ...partData } = part;
          const newPart = await Part.create({ ...partData, carId: newCar.id });
          partIdMap[id] = newPart.id;
          if (pv.length > 0) {
            await PartsValues.create({ partId: newPart.id, value: pv[0].value });
          }
        }
      }

      if (data.Events) {
        for (const event of data.Events) {
          let trackId = 1;
          if (event.Track) {
            let track = await Track.findOne({ where: { name: event.Track.name } });
            if (!track) {
              track = await Track.create({ name: event.Track.name });
            }
            trackId = track.id;
          }
          const newEvent = await Event.create({
            name: event.name,
            date: event.date,
            trackId,
            carId: newCar.id
          });
          for (const session of event.Sessions || []) {
            const { SessionPartsValues: spv = [], PreSessionNotes: pre = [], PostSessionNotes: post = [], ...sessData } = session;
            const newSession = await Session.create({ ...sessData, eventId: newEvent.id });

            if (spv.length > 0) {
              const values = {};
              for (const [oldId, val] of Object.entries(spv[0].values || {})) {
                if (partIdMap[oldId]) values[partIdMap[oldId]] = val;
              }
              await SessionPartsValues.create({ sessionId: newSession.id, values });
            }

            if (pre.length > 0) {
              await PreSessionNotes.create({ sessionId: newSession.id, notes: pre[0].notes });
            }

            if (post.length > 0) {
              await PostSessionNotes.create({ sessionId: newSession.id, notes: post[0].notes });
            }
          }
        }
      }

      return newCar.toJSON();
    } catch (error) {
      console.error('Error importing car data:', error);
      throw error;
    }
  }
});
