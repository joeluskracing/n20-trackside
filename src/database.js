const { Sequelize, DataTypes } = require('sequelize');
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
  type: {
    type: DataTypes.STRING,
    allowNull: false
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
    type: DataTypes.STRING,
    allowNull: false
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

// Define relationships
Car.hasMany(Part, { foreignKey: 'carId' });
Part.belongsTo(Car, { foreignKey: 'carId' });

Event.hasMany(Session, { foreignKey: 'eventId' });
Session.belongsTo(Event, { foreignKey: 'eventId' });

Part.hasMany(PartsValues, { foreignKey: 'partId' });
PartsValues.belongsTo(Part, { foreignKey: 'partId' });

Session.hasMany(SessionPartsValues, { foreignKey: 'sessionId' });
SessionPartsValues.belongsTo(Session, { foreignKey: 'sessionId' });

// Sync database
sequelize.sync().then(() => {
  console.log("Database & tables synchronized!");
});

module.exports = {
  sequelize,
  Car,
  Part,
  Event,
  Session,
  PartsValues,
  SessionPartsValues
};
