const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // Permite usar Node.js en la ventana de Electron
      contextIsolation: false, // Desactiva el aislamiento del contexto (para más facilidad en acceso)
    }
  });

  // Ruta al archivo index.html de la aplicación React construida
  const htmlPath = path.join(__dirname, 'build', 'index.html');

  win.loadFile(htmlPath).catch((err) => {
    console.error('Error al cargar la aplicación:', err);
  });

  // Abre las herramientas de desarrollo para depuración
 // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
