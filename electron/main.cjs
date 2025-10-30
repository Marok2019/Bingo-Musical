// main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')

// Variables para módulos ES que cargaremos dinámicamente
let InvidiousAPI, ValidationHelper, YouTubeImporter

// 🔥 Cargar módulos ES cuando la app esté lista
async function loadESModules() {
    try {
        console.log('📦 Cargando módulos ES...')

        InvidiousAPI = (await import('../src/services/InvidiousAPI.js')).default
        ValidationHelper = (await import('../src/services/ValidationHelper.js')).default
        YouTubeImporter = (await import('../src/services/YouTubeImporter.js')).default

        // 🔥 ACTIVAR MODO VALIDACIÓN
        InvidiousAPI.setValidationMode(true)

        console.log('✅ Módulos ES cargados correctamente')
        console.log('🔧 Modo validación: ACTIVADO')

        return true
    } catch (error) {
        console.error('❌ Error cargando módulos ES:', error)
        return false
    }
}

// 🔥 TEST DE VALIDACIÓN
async function testValidation() {
    if (!InvidiousAPI || !ValidationHelper || !YouTubeImporter) {
        console.error('❌ Módulos no cargados, no se puede ejecutar test')
        return
    }

    try {
        console.log('\n╔════════════════════════════════════════════════╗')
        console.log('║   🧪 INICIANDO TEST DE VALIDACIÓN INVIDIOUS   ║')
        console.log('╚════════════════════════════════════════════════╝\n')

        // Test 1: Buscar un video
        console.log('─── Test 1: Búsqueda de videos ───')
        const searchResults = await InvidiousAPI.searchVideos('despacito', 5)
        console.log(`✅ Encontrados ${searchResults.length} resultados\n`)

        // Test 2: Obtener info de video
        console.log('─── Test 2: Info de video ───')
        const videoInfo = await InvidiousAPI.getVideoInfo('kJQP7kiw5Fk')
        console.log(`✅ Video: ${videoInfo.title}`)
        console.log(`   Duración: ${videoInfo.duration}s\n`)

        // Test 3: Obtener playlist
        console.log('─── Test 3: Playlist ───')
        try {
            const playlistVideos = await InvidiousAPI.getPlaylistVideos('PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')
            console.log(`✅ Playlist con ${playlistVideos.length} videos\n`)
        } catch (error) {
            console.log(`⚠️  Test playlist falló: ${error.message}\n`)
        }

        // Test 4: Importar con YouTubeImporter
        console.log('─── Test 4: Importar video ───')
        const importedVideo = await YouTubeImporter.importVideo('https://www.youtube.com/watch?v=kJQP7kiw5Fk')
        console.log(`✅ Video importado: ${importedVideo.title}`)
        console.log(`   Artista: ${importedVideo.artist}`)
        console.log(`   Duración: ${importedVideo.duration}s\n`)

        // 🔥 MOSTRAR RESUMEN
        console.log('─── Generando resumen ───')
        ValidationHelper.showValidationSummary()

        // 🔥 VERIFICAR QUE NO SE USÓ YOUTUBE API
        const isValid = ValidationHelper.checkForYouTubeAPIUsage()

        if (isValid) {
            console.log('\n✅ ¡VALIDACIÓN EXITOSA!')
            console.log('🎉 Todas las solicitudes fueron por Invidious')
            console.log('🚫 NO se usó YouTube API oficial\n')
        } else {
            console.log('\n⚠️  ALERTA: Se detectó uso de YouTube API oficial\n')
        }

    } catch (error) {
        console.error('❌ Error en validación:', error)
        console.error(error.stack)
    }
}

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

app.whenReady().then(async () => {
    // 1. Cargar módulos ES
    const modulesLoaded = await loadESModules()

    if (!modulesLoaded) {
        console.error('❌ No se pudieron cargar los módulos, abortando...')
        app.quit()
        return
    }

    // 2. Crear ventana
    createWindow()

    // 3. 🔥 EJECUTAR TEST DE VALIDACIÓN (descomenta para probar)
    // setTimeout(() => {
    //     testValidation()
    // }, 3000) // Esperar 3s para que cargue la ventana
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

// ===== YOUTUBE HANDLERS (ahora usan Invidious) =====

ipcMain.handle('youtube:search', async (event, title, artist) => {
    if (!InvidiousAPI) {
        return { success: false, error: 'InvidiousAPI no inicializado' }
    }

    try {
        console.log(`🔍 Buscando: ${title} - ${artist}`)

        const query = `${title} ${artist} official audio`
        const results = await InvidiousAPI.searchVideos(query, 1)

        if (results && results.length > 0) {
            const videoId = results[0].id
            console.log(`✅ Encontrado: ${videoId}`)
            return { success: true, videoId }
        }

        console.log(`❌ No se encontró: ${title} - ${artist}`)
        return { success: false, error: 'No se encontró el video' }
    } catch (error) {
        console.error('Error en youtube:search:', error)
        return { success: false, error: error.message }
    }
})

ipcMain.handle('youtube:searchBatch', async (event, songs) => {
    if (!InvidiousAPI) {
        return { success: false, error: 'InvidiousAPI no inicializado' }
    }

    try {
        console.log(`\n🎵 Buscando ${songs.length} canciones en YouTube (Invidious)...`)

        const results = []
        let foundCount = 0

        for (let i = 0; i < songs.length; i++) {
            const song = songs[i]

            try {
                const query = `${song.title} ${song.artist} official audio`
                const searchResults = await InvidiousAPI.searchVideos(query, 1)

                if (searchResults && searchResults.length > 0) {
                    results.push({
                        ...song,
                        youtubeId: searchResults[0].id,
                        found: true
                    })
                    foundCount++
                    console.log(`✅ [${i + 1}/${songs.length}] ${song.title} → ${searchResults[0].id}`)
                } else {
                    results.push({
                        ...song,
                        found: false
                    })
                    console.log(`❌ [${i + 1}/${songs.length}] ${song.title} → No encontrado`)
                }

                // Pequeña pausa para no saturar (opcional con Invidious)
                await new Promise(resolve => setTimeout(resolve, 100))

            } catch (error) {
                console.error(`❌ Error buscando ${song.title}:`, error.message)
                results.push({
                    ...song,
                    found: false,
                    error: error.message
                })
            }
        }

        console.log(`\n✅ Búsqueda completada: ${foundCount}/${songs.length} encontradas\n`)

        return { success: true, songs: results }
    } catch (error) {
        console.error('Error en youtube:searchBatch:', error)
        return { success: false, error: error.message }
    }
})

// 🔥 HANDLERS DE VALIDACIÓN

ipcMain.handle('get-validation-stats', async () => {
    if (!InvidiousAPI) {
        return { stats: null, log: [] }
    }

    try {
        return {
            stats: InvidiousAPI.getStats(),
            log: InvidiousAPI.getRequestLog()
        }
    } catch (error) {
        console.error('Error obteniendo stats:', error)
        return { stats: null, log: [], error: error.message }
    }
})

ipcMain.handle('clear-validation-log', async () => {
    if (!InvidiousAPI) {
        return { success: false, error: 'InvidiousAPI no inicializado' }
    }

    try {
        InvidiousAPI.clearRequestLog()
        console.log('🧹 Log de validación limpiado')
        return { success: true }
    } catch (error) {
        console.error('Error limpiando log:', error)
        return { success: false, error: error.message }
    }
})

ipcMain.handle('export-validation-log', async () => {
    if (!ValidationHelper) {
        return '{}'
    }

    try {
        return ValidationHelper.exportLog()
    } catch (error) {
        console.error('Error exportando log:', error)
        return JSON.stringify({ error: error.message })
    }
})

ipcMain.handle('set-validation-mode', async (event, enabled) => {
    if (!InvidiousAPI) {
        return { success: false, error: 'InvidiousAPI no inicializado' }
    }

    try {
        InvidiousAPI.setValidationMode(enabled)
        console.log(`🔧 Modo validación: ${enabled ? 'ACTIVADO' : 'DESACTIVADO'}`)
        return { success: true, enabled }
    } catch (error) {
        console.error('Error configurando modo validación:', error)
        return { success: false, error: error.message }
    }
})

// 🔥 HANDLER PARA EJECUTAR TEST DESDE RENDERER
ipcMain.handle('run-validation-test', async () => {
    if (!InvidiousAPI || !ValidationHelper || !YouTubeImporter) {
        return {
            success: false,
            error: 'Módulos no inicializados'
        }
    }

    try {
        console.log('\n🚀 Ejecutando test de validación desde renderer...\n')
        await testValidation()
        return { success: true }
    } catch (error) {
        console.error('Error ejecutando test:', error)
        return { success: false, error: error.message }
    }
})

// 🔥 HANDLER PARA OBTENER RESUMEN
ipcMain.handle('get-validation-summary', async () => {
    if (!ValidationHelper || !InvidiousAPI) {
        return {
            success: false,
            error: 'Servicios no inicializados'
        }
    }

    try {
        const stats = InvidiousAPI.getStats()
        const isValid = ValidationHelper.checkForYouTubeAPIUsage()

        return {
            success: true,
            stats: stats,
            isValid: isValid,
            message: isValid
                ? 'Todas las solicitudes por Invidious ✅'
                : 'Se detectó uso de YouTube API ⚠️'
        }
    } catch (error) {
        console.error('Error obteniendo resumen:', error)
        return {
            success: false,
            error: error.message
        }
    }
})

console.log('🚀 Main process iniciado')