const { Sequelize, Op, DataTypes } = require('sequelize');
const path = require('path');

// Initialize SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

// Define models
const Car = sequelize.define('Car', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true  // Enable timestamps (createdAt, updatedAt)
});

const Track = sequelize.define('Track', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  photo: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

const Part = sequelize.define('Part', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  carId: {
    type: DataTypes.INTEGER,
    references: {
      model: Car,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false
  },
  entryType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  displayLocation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  subheading: {
    type: DataTypes.STRING,
    allowNull: true
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 100
  }
}, {
  timestamps: true
});

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  trackId: {
    type: DataTypes.INTEGER,
    references: {
      model: Track,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  carId: {
    type: DataTypes.INTEGER,
    references: {
      model: Car,
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  timestamps: true
});

const EventInfo = sequelize.define('EventInfo', {
  eventId: {
    type: DataTypes.INTEGER,
    references: {
      model: Event,
      key: 'id'
    },
    onDelete: 'CASCADE',
    primaryKey: true
  },
  temperature: {
    type: DataTypes.STRING,
    allowNull: true
  },
  humidity: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  eventId: {
    type: DataTypes.INTEGER,
    references: {
      model: Event,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  name:{
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastSelected: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: true
});

const PartsValues = sequelize.define('PartsValues', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  partId: {
    type: DataTypes.INTEGER,
    references: {
      model: Part,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

const SessionPartsValues = sequelize.define('SessionPartsValues', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  sessionId: {
    type: DataTypes.INTEGER,
    references: {
      model: Session,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  values: {
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  timestamps: true
});

const NotesTemplate = sequelize.define('NotesTemplate', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fields: {
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  timestamps: true
});

const CarTemplate = sequelize.define('CarTemplate', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  carId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  parts: {
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  timestamps: true
});

const PreSessionNotes = sequelize.define('PreSessionNotes', {
  sessionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  notes: {
    type: DataTypes.JSON,
    allowNull: false,
  }
});

const PostSessionNotes = sequelize.define('PostSessionNotes', {
  sessionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  notes: {
    type: DataTypes.JSON,
    allowNull: false,
  }
});

const ChecklistNote = sequelize.define('ChecklistNote', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  timestamps: true
});

// Define relationships
Car.hasMany(Part, { foreignKey: 'carId', onDelete: 'CASCADE' });
Part.belongsTo(Car, { foreignKey: 'carId', onDelete: 'CASCADE' });

Track.hasMany(Event, { foreignKey: 'trackId', onDelete: 'CASCADE' });
Event.belongsTo(Track, { foreignKey: 'trackId', onDelete: 'CASCADE' });

Car.hasMany(Event, { foreignKey: 'carId', onDelete: 'CASCADE' });
Event.belongsTo(Car, { foreignKey: 'carId', onDelete: 'CASCADE' });

Event.hasMany(Session, { as: 'Sessions', foreignKey: 'eventId', onDelete: 'CASCADE' });
Session.belongsTo(Event, { foreignKey: 'eventId', onDelete: 'CASCADE' });

Part.hasMany(PartsValues, { foreignKey: 'partId', onDelete: 'CASCADE' });
PartsValues.belongsTo(Part, { foreignKey: 'partId', onDelete: 'CASCADE' });

Session.hasMany(SessionPartsValues, { foreignKey: 'sessionId', onDelete: 'CASCADE' });
SessionPartsValues.belongsTo(Session, { foreignKey: 'sessionId', onDelete: 'CASCADE' });

Session.hasMany(PreSessionNotes, { foreignKey: 'sessionId', onDelete: 'CASCADE' });
PreSessionNotes.belongsTo(Session, { foreignKey: 'sessionId', onDelete: 'CASCADE' });

Session.hasMany(PostSessionNotes, { foreignKey: 'sessionId', onDelete: 'CASCADE' });
PostSessionNotes.belongsTo(Session, { foreignKey: 'sessionId', onDelete: 'CASCADE' });

Event.hasOne(EventInfo, { foreignKey: 'eventId', onDelete: 'CASCADE' });
EventInfo.belongsTo(Event, { foreignKey: 'eventId', onDelete: 'CASCADE' });

// Sync database and prepopulate with the "Garage" track
sequelize.sync({ alter: true }).then(async () => {  // Do not use force: true in production as it drops and recreates the tables
  console.log("Database & tables synchronized!");

  // Prepopulate the "Garage" track
  const [garageTrack, created] = await Track.findOrCreate({
    where: { id: 1 },
    defaults: { name: 'Garage' }
  });

  if (created) {
    console.log('Garage track created');
  } else {
    console.log('Garage track already exists');
  }

  const preDefault = [
    { title: 'Starting Position', type: 'Text', value: '' },
    { title: 'Starting Fuel', type: 'Text', value: '' },
    { title: 'LF Tire Compound', type: 'Text', value: '' },
    { title: 'RF Tire Compound', type: 'Text', value: '' },
    { title: 'LR Tire Compound', type: 'Text', value: '' },
    { title: 'RR Tire Compound', type: 'Text', value: '' },
    { title: 'LF Tire Pressure', type: 'Text', value: '' },
    { title: 'RF Tire Pressure', type: 'Text', value: '' },
    { title: 'LR Tire Pressure', type: 'Text', value: '' },
    { title: 'RR Tire Pressure', type: 'Text', value: '' },
    { title: 'Notes', type: 'Paragraph', value: '' }
  ];

  const postDefault = [
    { title: 'Finishing Position', type: 'Text', value: '' },
    { title: 'Finishing Fuel', type: 'Text', value: '' },
    { title: 'LF Tire Pressure', type: 'Text', value: '' },
    { title: 'RF Tire Pressure', type: 'Text', value: '' },
    { title: 'LR Tire Pressure', type: 'Text', value: '' },
    { title: 'RR Tire Pressure', type: 'Text', value: '' },
    { title: 'Notes', type: 'Paragraph', value: '' },
    { title: 'Driver Feedback', type: 'Paragraph', value: '' }
  ];

  await NotesTemplate.findOrCreate({
    where: { name: 'pre' },
    defaults: { fields: preDefault }
  });

  await NotesTemplate.findOrCreate({
    where: { name: 'post' },
    defaults: { fields: postDefault }
  });
});

module.exports = {
  sequelize,
  Car,
  Track,
  Part,
  Event,
  Session,
  PartsValues,
  SessionPartsValues,
  NotesTemplate,
  PreSessionNotes,
  PostSessionNotes,
  EventInfo,
  CarTemplate,
  ChecklistNote,
  Op
};
