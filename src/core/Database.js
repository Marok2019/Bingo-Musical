// Base de datos local simulada (localStorage)
class Database {
    constructor() {
        this.storageKey = 'bingo_musical_songs'
        this.loadData()
    }

    loadData() {
        const data = localStorage.getItem(this.storageKey)
        this.songs = data ? JSON.parse(data) : []
    }

    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.songs))
    }

    // CREATE
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

    // READ
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

    // UPDATE
    update(id, updates) {
        const index = this.songs.findIndex(song => song.id === id)
        if (index === -1) {
            throw new Error('Canción no encontrada')
        }

        this.songs[index] = { ...this.songs[index], ...updates, updatedAt: new Date().toISOString() }
        this.saveData()
        return this.songs[index]
    }

    // DELETE
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

    // CLEAR
    clear() {
        this.songs = []
        this.saveData()
    }

    // STATS
    count() {
        return this.songs.length
    }
}

export default new Database()