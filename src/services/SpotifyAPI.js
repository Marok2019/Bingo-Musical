import { SPOTIFY_CONFIG } from '../config'

class SpotifyAPI {
    constructor() {
        this.clientId = SPOTIFY_CONFIG.clientId
        this.clientSecret = SPOTIFY_CONFIG.clientSecret
        this.accessToken = null
        this.tokenExpiration = null
    }

    // Autenticación con Client Credentials
    async authenticate() {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(this.clientId + ':' + this.clientSecret)
            },
            body: 'grant_type=client_credentials'
        })

        if (!response.ok) {
            throw new Error('Failed to authenticate with Spotify')
        }

        const data = await response.json()
        this.accessToken = data.access_token
        this.tokenExpiration = Date.now() + (data.expires_in * 1000)

        // Auto-renovar 5 minutos antes de expirar
        setTimeout(() => {
            this.authenticate()
        }, (data.expires_in - 300) * 1000)

        return this.accessToken
    }

    async ensureAuthenticated() {
        if (!this.accessToken || Date.now() >= this.tokenExpiration) {
            await this.authenticate()
        }
    }

    // Obtener información de una playlist
    async getPlaylist(playlistId) {
        await this.ensureAuthenticated()

        const response = await fetch(
            `https://api.spotify.com/v1/playlists/${playlistId}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            }
        )

        if (!response.ok) {
            throw new Error('Failed to fetch playlist')
        }

        return await response.json()
    }

    // Obtener todas las canciones de una playlist
    async getPlaylistTracks(playlistId) {
        await this.ensureAuthenticated()

        let allTracks = []
        let offset = 0
        let hasMore = true

        while (hasMore) {
            const response = await fetch(
                `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=100`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            )

            if (!response.ok) {
                throw new Error('Failed to fetch playlist tracks')
            }

            const data = await response.json()
            allTracks = allTracks.concat(data.items)

            hasMore = data.next !== null
            offset += 100
        }

        return allTracks
    }

    // Buscar canciones
    async searchTracks(query, limit = 20) {
        await this.ensureAuthenticated()

        const response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            }
        )

        if (!response.ok) {
            throw new Error('Search failed')
        }

        const data = await response.json()
        return data.tracks.items
    }

    // Obtener análisis de audio (para detectar mejor fragmento)
    async getAudioAnalysis(trackId) {
        await this.ensureAuthenticated()

        const response = await fetch(
            `https://api.spotify.com/v1/audio-analysis/${trackId}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            }
        )

        if (!response.ok) {
            return null // No todas las canciones tienen análisis
        }

        return await response.json()
    }
}

export default new SpotifyAPI()