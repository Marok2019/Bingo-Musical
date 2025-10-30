// core/Database.js
class Database {
    constructor() {
        this.storageKey = 'bingo_musical_songs'
        this.cacheKey = 'bingo_youtube_cache'
        this.loadData()
    }

    loadData() {
        const data = localStorage.getItem(this.storageKey)
        this.songs = data ? JSON.parse(data) : []

        const cacheData = localStorage.getItem(this.cacheKey)
        this.cache = cacheData ? JSON.parse(cacheData) : {}
    }

    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.songs))
    }

    saveCache() {
        localStorage.setItem(this.cacheKey, JSON.stringify(this.cache))
    }

    // ===== CACHE METHODS =====

    getCachedSearch(query) {
        const normalizedQuery = query.toLowerCase().trim()
        const cached = this.cache[normalizedQuery]

        if (!cached) return null

        // Verifica si expiró (7 días)
        const now = Date.now()
        const maxAge = 7 * 24 * 60 * 60 * 1000

        if (now - cached.timestamp > maxAge) {
            delete this.cache[normalizedQuery]
            this.saveCache()
            return null
        }

        console.log('💾 Resultado desde caché:', normalizedQuery)
        return cached.results
    }

    cacheSearch(query, results, source = 'invidious') {
        const normalizedQuery = query.toLowerCase().trim()
        this.cache[normalizedQuery] = {
            results,
            timestamp: Date.now(),
            source
        }
        this.saveCache()
    }

    clearExpiredCache() {
        const now = Date.now()
        const maxAge = 7 * 24 * 60 * 60 * 1000
        let cleared = 0

        Object.keys(this.cache).forEach(key => {
            if (now - this.cache[key].timestamp > maxAge) {
                delete this.cache[key]
                cleared++
            }
        })

        if (cleared > 0) {
            this.saveCache()
            console.log(`🧹 Limpiados ${cleared} registros de caché expirados`)
        }

        return cleared
    }

    getCacheStats() {
        const entries = Object.keys(this.cache).length
        const sizeInBytes = new Blob([JSON.stringify(this.cache)]).size
        const sizeInKB = (sizeInBytes / 1024).toFixed(2)

        return {
            entries,
            sizeKB: sizeInKB,
            maxSizeMB: 5 // localStorage tiene ~5-10MB límite
        }
    }

    // ===== ORIGINAL METHODS =====

    insert(song) {
        this.songs.push(song)
        this.saveData()
        return song
    }

    insertMany(songs) {
        this.songs.push(...songs)
        this.saveData()
        return songs
    }

    findAll() {
        return [...this.songs]
    }

    findById(id) {
        return this.songs.find(song => song.id === id)
    }

    search(query) {
        const lowerQuery = query.toLowerCase()
        return this.songs.filter(song =>
            song.title.toLowerCase().includes(lowerQuery) ||
            song.artist.toLowerCase().includes(lowerQuery) ||
            (song.album && song.album.toLowerCase().includes(lowerQuery))
        )
    }

    update(id, updates) {
        const index = this.songs.findIndex(song => song.id === id)
        if (index === -1) {
            throw new Error('Canción no encontrada')
        }

        this.songs[index] = {
            ...this.songs[index],
            ...updates,
            updatedAt: new Date().toISOString()
        }
        this.saveData()
        return this.songs[index]
    }

    delete(id) {
        const index = this.songs.findIndex(song => song.id === id)
        if (index === -1) {
            throw new Error('Canción no encontrada')
        }

        this.songs.splice(index, 1)
        this.saveData()
        return true
    }

    deleteMany(ids) {
        this.songs = this.songs.filter(song => !ids.includes(song.id))
        this.saveData()
        return true
    }

    clear() {
        this.songs = []
        this.saveData()
    }

    count() {
        return this.songs.length
    }
}

export default new Database()