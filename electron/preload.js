const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    test: {
        sendMessage: (message) => ipcRenderer.invoke('test:message', message)
    },

    youtube: {
        search: (title, artist) => ipcRenderer.invoke('youtube:search', title, artist),
        searchBatch: (songs) => ipcRenderer.invoke('youtube:searchBatch', songs)
    }
})