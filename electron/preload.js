const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
    // Test
    testMessage: (message) => ipcRenderer.invoke('test:message', message),

    // YouTube (Deprecado)
    youtube: {
        search: (title, artist) => ipcRenderer.invoke('youtube:search', title, artist),
        searchBatch: (songs) => ipcRenderer.invoke('youtube:searchBatch', songs)
    },

    // Invidious
    invidious: {
        search: (title, artist) => ipcRenderer.invoke('invidious:search', title, artist),
        searchBatch: (songs) => ipcRenderer.invoke('invidious:searchBatch', songs),
        updateInstances: () => ipcRenderer.invoke('invidious:updateInstances')
    },

    // Spotify
    spotify: {
        search: (title, artist) => ipcRenderer.invoke('spotify:search', title, artist),
        searchBatch: (songs) => ipcRenderer.invoke('spotify:searchBatch', songs),
        importPlaylist: (url) => ipcRenderer.invoke('spotify:importPlaylist', url),
        testConnection: () => ipcRenderer.invoke('spotify:testConnection')
    },

    // Configuración de audio
    audioSource: {
        get: () => ipcRenderer.invoke('get-audio-source'),
        set: (source) => ipcRenderer.invoke('set-audio-source', source)
    },

    // Credenciales de Spotify
    spotifyCredentials: {
        get: () => ipcRenderer.invoke('get-spotify-credentials'),
        set: (credentials) => ipcRenderer.invoke('set-spotify-credentials', credentials)
    },

    // Motor de Bingo
    bingo: {
        loadSongs: (songs) => ipcRenderer.invoke('bingo:loadSongs', songs),
        drawNext: () => ipcRenderer.invoke('bingo:drawNext'),
        play: () => ipcRenderer.invoke('bingo:play'),
        pause: () => ipcRenderer.invoke('bingo:pause'),
        resume: () => ipcRenderer.invoke('bingo:resume'),
        stop: () => ipcRenderer.invoke('bingo:stop'),
        setAutoPlay: (enabled) => ipcRenderer.invoke('bingo:setAutoPlay', enabled),
        getState: () => ipcRenderer.invoke('bingo:getState'),
        reset: () => ipcRenderer.invoke('bingo:reset')
    },

    // Eventos
    on: (channel, callback) => {
        const validChannels = [
            'search:progress',
            'bingo:songDrawn',
            'bingo:playbackStarted',
            'bingo:playbackEnded',
            'bingo:playbackError',
            'bingo:playbackPaused',
            'bingo:playbackResumed',
            'bingo:finished'
        ]

        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => callback(...args))
        }
    },

    removeListener: (channel, callback) => {
        ipcRenderer.removeListener(channel, callback)
    },

    // Diálogos
    dialog: {
        openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
        saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options)
    },

    // Utilidades
    app: {
        getVersion: () => ipcRenderer.invoke('app:getVersion'),
        getPlatform: () => ipcRenderer.invoke('app:getPlatform')
    }
})