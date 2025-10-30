const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')

// Servicios
const YouTubeService = require('./YouTubeService')

// Variables globales
let mainWindow
let Store
let store

// Importación dinámica de electron-store (ESM module)
async function initializeStore() {
    const module = await import('electron-store')
    Store = module.default
    store = new Store()
    console.log('✅ electron-store inicializado correctamente')
    return store
}

// Servicios que dependen de Store (se cargarán después)
let InvidiousAPI
let SpotifyAPI
let BingoEngine

async function initializeServices() {
    // Asegurarse de que store esté inicializado
    if (!store) {
        await initializeStore()
    }

    // Ahora cargar servicios que dependen de store
    InvidiousAPI = require('../src/services/InvidiousAPI')
    SpotifyAPI = require('../src/services/SpotifyAPI')
    BingoEngine = require('../src/core/BingoEngine')

    // Configurar fuente de audio inicial
    const audioSource = store.get('audio.source', 'invidious')
    BingoEngine.setAudioSource(audioSource)
    console.log(`🎵 Fuente de audio configurada: ${audioSource}`)

    // Configurar eventos del motor de Bingo
    setupBingoEngineEvents()

    return { InvidiousAPI, SpotifyAPI, BingoEngine }
}

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

// Función para configurar eventos del motor de Bingo
function setupBingoEngineEvents() {
    if (!BingoEngine) return

    BingoEngine.on('songDrawn', (data) => {
        if (mainWindow) {
            mainWindow.webContents.send('bingo:songDrawn', data)
        }
    })

    BingoEngine.on('playbackStarted', (song) => {
        if (mainWindow) {
            mainWindow.webContents.send('bingo:playbackStarted', song)
        }
    })

    BingoEngine.on('playbackEnded', (song) => {
        if (mainWindow) {
            mainWindow.webContents.send('bingo:playbackEnded', song)
        }
    })

    BingoEngine.on('playbackError', (data) => {
        if (mainWindow) {
            mainWindow.webContents.send('bingo:playbackError', data)
        }
    })

    BingoEngine.on('playbackPaused', () => {
        if (mainWindow) {
            mainWindow.webContents.send('bingo:playbackPaused')
        }
    })

    BingoEngine.on('playbackResumed', () => {
        if (mainWindow) {
            mainWindow.webContents.send('bingo:playbackResumed')
        }
    })

    BingoEngine.on('bingoFinished', () => {
        if (mainWindow) {
            mainWindow.webContents.send('bingo:finished')
        }
    })
}

app.whenReady().then(async () => {
    // Inicializar store y servicios antes de crear la ventana
    await initializeServices()

    createWindow()

    // Verificar salud de instancias de Invidious al iniciar
    if (InvidiousAPI) {
        InvidiousAPI.updateHealthyInstances()
            .then(() => console.log('✅ Instancias de Invidious verificadas'))
            .catch(err => console.warn('⚠️ Error verificando instancias:', err))
    }

    console.log(`
╔═══════════════════════════════════════╗
║   🎵 BINGO MUSICAL - Sistema Iniciado ║
╚═══════════════════════════════════════╝
📍 Modo: ${app.isPackaged ? 'Producción' : 'Desarrollo'}
🎵 Fuente de audio: ${store.get('audio.source', 'invidious')}
🔧 Electron: ${process.versions.electron}
🔧 Node: ${process.versions.node}
`)
})

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

// ===== YOUTUBE HANDLERS (Deprecados - mantener para compatibilidad) =====

ipcMain.handle('youtube:search', async (event, title, artist) => {
    try {
        console.warn('⚠️ youtube:search está deprecado. Usa invidious:search o spotify:search')
        const videoId = await YouTubeService.searchVideo(title, artist)
        return { success: true, videoId }
    } catch (error) {
        console.error('Error en youtube:search:', error)
        return { success: false, error: error.message }
    }
})

ipcMain.handle('youtube:searchBatch', async (event, songs) => {
    try {
        console.warn('⚠️ youtube:searchBatch está deprecado. Usa invidious:searchBatch')
        console.log(`🎵 Buscando ${songs.length} canciones en YouTube...`)
        const results = await YouTubeService.searchVideoBatch(songs)
        return { success: true, songs: results }
    } catch (error) {
        console.error('Error en youtube:searchBatch:', error)
        return { success: false, error: error.message }
    }
})

// ===== INVIDIOUS HANDLERS =====

ipcMain.handle('invidious:search', async (event, title, artist) => {
    try {
        if (!InvidiousAPI) {
            throw new Error('InvidiousAPI no está inicializado')
        }
        console.log(`🔍 Buscando en Invidious: ${title} - ${artist}`)
        const result = await InvidiousAPI.getAudioUrl(title, artist)
        return { success: true, data: result }
    } catch (error) {
        console.error('Error en invidious:search:', error)
        return { success: false, error: error.message }
    }
})

ipcMain.handle('invidious:searchBatch', async (event, songs) => {
    try {
        if (!InvidiousAPI) {
            throw new Error('InvidiousAPI no está inicializado')
        }
        console.log(`🎵 Buscando ${songs.length} canciones en Invidious...`)

        const results = []
        let successCount = 0
        let failCount = 0

        for (let i = 0; i < songs.length; i++) {
            const song = songs[i]

            try {
                const audioData = await InvidiousAPI.getAudioUrl(song.title, song.artist)

                results.push({
                    ...song,
                    videoId: audioData.url,
                    audioUrl: audioData.url,
                    duration: audioData.duration,
                    found: true,
                    source: 'invidious'
                })

                successCount++
                console.log(`✅ [${i + 1}/${songs.length}] ${song.title} - ${song.artist}`)
            } catch (error) {
                console.warn(`❌ [${i + 1}/${songs.length}] ${song.title} - ${song.artist}: ${error.message}`)

                results.push({
                    ...song,
                    found: false,
                    error: error.message,
                    source: 'invidious'
                })

                failCount++
            }

            if (i < songs.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500))
            }

            if (mainWindow) {
                mainWindow.webContents.send('search:progress', {
                    current: i + 1,
                    total: songs.length,
                    song: song.title
                })
            }
        }

        console.log(`✅ Búsqueda completada: ${successCount} éxitos, ${failCount} fallos`)

        return {
            success: true,
            songs: results,
            stats: { success: successCount, failed: failCount }
        }
    } catch (error) {
        console.error('Error en invidious:searchBatch:', error)
        return { success: false, error: error.message }
    }
})

ipcMain.handle('invidious:updateInstances', async () => {
    try {
        if (!InvidiousAPI) {
            throw new Error('InvidiousAPI no está inicializado')
        }
        await InvidiousAPI.updateHealthyInstances()
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
})

// ===== SPOTIFY HANDLERS =====

ipcMain.handle('spotify:search', async (event, title, artist) => {
    try {
        if (!SpotifyAPI) {
            throw new Error('SpotifyAPI no está inicializado')
        }
        console.log(`🔍 Buscando en Spotify: ${title} - ${artist}`)
        const result = await SpotifyAPI.getPreviewUrl(title, artist)

        if (!result) {
            return { success: false, error: 'No se encontró preview en Spotify' }
        }

        return { success: true, data: result }
    } catch (error) {
        console.error('Error en spotify:search:', error)
        return { success: false, error: error.message }
    }
})

ipcMain.handle('spotify:searchBatch', async (event, songs) => {
    try {
        if (!SpotifyAPI) {
            throw new Error('SpotifyAPI no está inicializado')
        }
        console.log(`🎵 Buscando ${songs.length} canciones en Spotify...`)

        const results = []
        let successCount = 0
        let failCount = 0
        let noPreviewCount = 0

        for (let i = 0; i < songs.length; i++) {
            const song = songs[i]

            try {
                const previewData = await SpotifyAPI.getPreviewUrl(song.title, song.artist)

                if (previewData) {
                    results.push({
                        ...song,
                        previewUrl: previewData.url,
                        audioUrl: previewData.url,
                        duration: previewData.duration,
                        found: true,
                        hasPreview: true,
                        source: 'spotify'
                    })
                    successCount++
                    console.log(`✅ [${i + 1}/${songs.length}] ${song.title} - ${song.artist}`)
                } else {
                    results.push({
                        ...song,
                        found: true,
                        hasPreview: false,
                        source: 'spotify'
                    })
                    noPreviewCount++
                    console.log(`⚠️ [${i + 1}/${songs.length}] ${song.title} - ${song.artist} (sin preview)`)
                }
            } catch (error) {
                console.warn(`❌ [${i + 1}/${songs.length}] ${song.title} - ${song.artist}: ${error.message}`)

                results.push({
                    ...song,
                    found: false,
                    error: error.message,
                    source: 'spotify'
                })

                failCount++
            }

            if (i < songs.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 300))
            }

            if (mainWindow) {
                mainWindow.webContents.send('search:progress', {
                    current: i + 1,
                    total: songs.length,
                    song: song.title
                })
            }
        }

        console.log(`✅ Búsqueda completada: ${successCount} con preview, ${noPreviewCount} sin preview, ${failCount} fallos`)

        return {
            success: true,
            songs: results,
            stats: {
                success: successCount,
                noPreview: noPreviewCount,
                failed: failCount
            }
        }
    } catch (error) {
        console.error('Error en spotify:searchBatch:', error)
        return { success: false, error: error.message }
    }
})

ipcMain.handle('spotify:importPlaylist', async (event, playlistUrl) => {
    try {
        if (!SpotifyAPI) {
            throw new Error('SpotifyAPI no está inicializado')
        }
        console.log(`📋 Importando playlist de Spotify: ${playlistUrl}`)
        const songs = await SpotifyAPI.importPlaylist(playlistUrl)
        return { success: true, songs }
    } catch (error) {
        console.error('Error en spotify:importPlaylist:', error)
        return { success: false, error: error.message }
    }
})

ipcMain.handle('spotify:testConnection', async () => {
    try {
        if (!SpotifyAPI) {
            throw new Error('SpotifyAPI no está inicializado')
        }
        const token = await SpotifyAPI.getAccessToken()
        return { success: true, hasToken: !!token }
    } catch (error) {
        return { success: false, error: error.message }
    }
})

// ===== AUDIO SOURCE CONFIGURATION =====

ipcMain.handle('get-audio-source', async () => {
    if (!store) {
        await initializeStore()
    }
    return store.get('audio.source', 'invidious')
})

ipcMain.handle('set-audio-source', async (event, source) => {
    try {
        if (!store) {
            await initializeStore()
        }
        if (!BingoEngine) {
            await initializeServices()
        }

        if (!['invidious', 'spotify'].includes(source)) {
            return { success: false, error: 'Fuente de audio inválida' }
        }

        store.set('audio.source', source)
        BingoEngine.setAudioSource(source)

        console.log(`🔄 Fuente de audio cambiada a: ${source}`)

        return { success: true, source }
    } catch (error) {
        return { success: false, error: error.message }
    }
})

// ===== SPOTIFY CREDENTIALS =====

ipcMain.handle('get-spotify-credentials', async () => {
    if (!store) {
        await initializeStore()
    }
    return {
        clientId: store.get('spotify.clientId', ''),
        clientSecret: store.get('spotify.clientSecret', '')
    }
})

ipcMain.handle('set-spotify-credentials', async (event, credentials) => {
    try {
        if (!store) {
            await initializeStore()
        }
        if (!SpotifyAPI) {
            await initializeServices()
        }

        if (!credentials.clientId || !credentials.clientSecret) {
            return { success: false, error: 'Credenciales incompletas' }
        }

        SpotifyAPI.setCredentials(credentials.clientId, credentials.clientSecret)

        const token = await SpotifyAPI.getAccessToken()

        if (!token) {
            return { success: false, error: 'Credenciales inválidas' }
        }

        console.log('✅ Credenciales de Spotify configuradas correctamente')

        return { success: true }
    } catch (error) {
        console.error('Error configurando credenciales de Spotify:', error)
        return { success: false, error: error.message }
    }
})

// ===== BINGO ENGINE HANDLERS =====

ipcMain.handle('bingo:loadSongs', async (event, songs) => {
    try {
        if (!BingoEngine) {
            await initializeServices()
        }
        BingoEngine.loadSongs(songs)
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
})

ipcMain.handle('bingo:drawNext', async () => {
    try {
        if (!BingoEngine) {
            throw new Error('BingoEngine no está inicializado')
        }
        const song = await BingoEngine.drawNextSong()
        return { success: true, song }
    } catch (error) {
        return { success: false, error: error.message }
    }
})

ipcMain.handle('bingo:play', async () => {
    try {
        if (!BingoEngine) {
            throw new Error('BingoEngine no está inicializado')
        }
        const result = await BingoEngine.playCurrentSong()
        return { success: result }
    } catch (error) {
        return { success: false, error: error.message }
    }
})

ipcMain.handle('bingo:pause', async () => {
    if (!BingoEngine) {
        throw new Error('BingoEngine no está inicializado')
    }
    BingoEngine.pausePlayback()
    return { success: true }
})

ipcMain.handle('bingo:resume', async () => {
    if (!BingoEngine) {
        throw new Error('BingoEngine no está inicializado')
    }
    BingoEngine.resumePlayback()
    return { success: true }
})

ipcMain.handle('bingo:stop', async () => {
    if (!BingoEngine) {
        throw new Error('BingoEngine no está inicializado')
    }
    BingoEngine.stopPlayback()
    return { success: true }
})

ipcMain.handle('bingo:setAutoPlay', async (event, enabled) => {
    if (!BingoEngine) {
        throw new Error('BingoEngine no está inicializado')
    }
    BingoEngine.setAutoPlay(enabled)
    return { success: true }
})

ipcMain.handle('bingo:getState', async () => {
    if (!BingoEngine) {
        await initializeServices()
    }
    return BingoEngine.getState()
})

ipcMain.handle('bingo:reset', async () => {
    if (!BingoEngine) {
        throw new Error('BingoEngine no está inicializado')
    }
    BingoEngine.reset()
    return { success: true }
})

// ===== FILE DIALOGS =====

ipcMain.handle('dialog:openFile', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        ...options
    })
    return result
})

ipcMain.handle('dialog:saveFile', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'PDF Files', extensions: ['pdf'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        ...options
    })
    return result
})

// ===== UTILIDADES =====

ipcMain.handle('app:getVersion', async () => {
    return app.getVersion()
})

ipcMain.handle('app:getPlatform', async () => {
    return process.platform
})