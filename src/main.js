const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const {
  Car,
  Track,
  Part,
  Event,
  Session,
  PartsValues,
  SessionPartsValues,
  PreSessionNotes,
  PostSessionNotes
} = require('./database');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox:false,
    },
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('export-car-data', async (event, carId) => {
  try {
    const car = await Car.findByPk(carId, {
      include: [
        { model: Part, include: [PartsValues] },
        {
          model: Event,
          include: [
            { model: Track },
            {
              model: Session,
              as: 'Sessions',
              include: [SessionPartsValues, PreSessionNotes, PostSessionNotes]
            }
          ]
        }
      ]
    });
    if (!car) return null;

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save Car Data',
      defaultPath: `car_${car.name.replace(/\s+/g, '_')}_${car.id}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (canceled || !filePath) {
      return null;
    }

    fs.writeFileSync(filePath, JSON.stringify(car.toJSON(), null, 2));
    return filePath;
  } catch (error) {
    console.error('Error exporting car data:', error);
    throw error;
  }
});
