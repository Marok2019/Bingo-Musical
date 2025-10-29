const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const YouTubeService = require('./YouTubeService')

let mainWindow

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    // Auto-detectar modo desarrollo/producción
    const isDev = !app.isPackaged

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173')
        mainWindow.webContents.openDevTools()

        mainWindow.webContents.on('did-fail-load', () => {
            console.log('⚠️ Esperando a que Vite esté listo...')
            setTimeout(() => {
                mainWindow.loadURL('http://localhost:5173')
            }, 2000)
        })
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    }

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

// ===== IPC HANDLERS =====

ipcMain.handle('test:message', async (event, message) => {
    console.log('Mensaje recibido desde renderer:', message)
    return { success: true, message: 'Hola desde main process' }
})

// ===== YOUTUBE HANDLERS =====

ipcMain.handle('youtube:search', async (event, title, artist) => {
    try {
        const videoId = await YouTubeService.searchVideo(title, artist)
        return { success: true, videoId }
    } catch (error) {
        console.error('Error en youtube:search:', error)
        return { success: false, error: error.message }
    }
})

ipcMain.handle('youtube:searchBatch', async (event, songs) => {
    try {
        console.log(`🎵 Buscando ${songs.length} canciones en YouTube...`)
        const results = await YouTubeService.searchVideoBatch(songs)
        return { success: true, songs: results }
    } catch (error) {
        console.error('Error en youtube:searchBatch:', error)
        return { success: false, error: error.message }
    }
})