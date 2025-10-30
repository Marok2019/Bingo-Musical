import SpotifyAPI from './SpotifyAPI'
import { v4 as uuidv4 } from 'uuid'

class SpotifyImporter {
    /**
     * Extraer playlist ID de una URL de Spotify
     */
    extractPlaylistId(url) {
        // Formatos soportados:
        // https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
        // https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=xxxxx
        // spotify:playlist:37i9dQZF1DXcBWIGoYBM5M

        const patterns = [
            /playlist\/([a-zA-Z0-9]+)/,  // URL normal
            /playlist:([a-zA-Z0-9]+)/     // URI
        ]

        for (const pattern of patterns) {
            const match = url.match(pattern)
            if (match) {
                return match[1]
            }
        }

        // Si ya es solo el ID
        if (/^[a-zA-Z0-9]+$/.test(url)) {
            return url
        }

        return null
    }

    /**
     * Importar playlist completa
     */
    async importPlaylist(playlistUrl, options = {}) {
        const playlistId = this.extractPlaylistId(playlistUrl)

        if (!playlistId) {
            throw new Error('URL de playlist inválida. Usa el formato: https://open.spotify.com/playlist/xxxxx')
        }

        console.log(`📥 Importando playlist ${playlistId}...`)

        try {
            // Obtener info de la playlist
            const playlistInfo = await SpotifyAPI.getPlaylistInfo(playlistId)
            console.log(`📋 Playlist: "${playlistInfo.name}" (${playlistInfo.tracks.total} canciones)`)

            // Obtener todas las canciones
            const items = await SpotifyAPI.getPlaylistTracks(playlistId)

            // Convertir a formato Song
            const songs = items
                .filter(item => item.track && item.track.preview_url) // Solo las que tienen preview
                .map(item => this.trackToSong(item.track, options))

            const withoutPreview = items.filter(item => !item.track || !item.track.preview_url).length

            console.log(`✅ ${songs.length} canciones importadas`)
            if (withoutPreview > 0) {
                console.log(`⚠️  ${withoutPreview} canciones sin preview disponible (se omitieron)`)
            }

            return {
                songs,
                playlistInfo: {
                    name: playlistInfo.name,
                    description: playlistInfo.description,
                    image: playlistInfo.images[0]?.url,
                    total: playlistInfo.tracks.total,
                    imported: songs.length,
                    skipped: withoutPreview
                }
            }

        } catch (error) {
            console.error('Error importando playlist:', error)
            throw error
        }
    }

    /**
     * Convertir track de Spotify a formato Song
     */
    trackToSong(track, options = {}) {
        const song = {
            id: uuidv4(),
            title: track.name,
            artist: track.artists.map(a => a.name).join(', '),
            album: track.album.name,
            year: track.album.release_date ? new Date(track.album.release_date).getFullYear() : null,
            duration: track.duration_ms / 1000, // Convertir a segundos

            // Fuente
            sourceType: 'SPOTIFY',
            sourcePath: track.uri,        // spotify:track:xxxxx
            spotifyId: track.id,          // ID corto
            previewUrl: track.preview_url, // ⭐ URL del preview MP3

            // Metadata
            coverImage: track.album.images[0]?.url,
            popularity: track.popularity,
            explicit: track.explicit,

            // Fragmento (por defecto, 30s completos del preview)
            cueIn: 0,
            cueOut: 30,  // Los previews son de 30s

            // Timestamps
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        // Si se especifica un fragmento personalizado
        if (options.cueIn !== undefined) {
            song.cueIn = options.cueIn
        }
        if (options.cueOut !== undefined) {
            song.cueOut = options.cueOut
        }

        return song
    }

    /**
     * Buscar canciones e importar
     */
    async searchAndImport(query, limit = 20) {
        console.log(`🔍 Buscando: "${query}"...`)

        try {
            const tracks = await SpotifyAPI.searchTracks(query, limit)

            // Filtrar solo las que tienen preview
            const withPreview = tracks.filter(t => t.preview_url)

            const songs = withPreview.map(track => this.trackToSong(track))

            console.log(`✅ ${songs.length} resultados con preview`)

            return songs

        } catch (error) {
            console.error('Error buscando canciones:', error)
            throw error
        }
    }

    /**
     * Importar múltiples playlists
     */
    async importMultiplePlaylists(playlistUrls) {
        const results = []

        for (const url of playlistUrls) {
            try {
                const result = await this.importPlaylist(url)
                results.push({
                    success: true,
                    url,
                    ...result
                })
            } catch (error) {
                results.push({
                    success: false,
                    url,
                    error: error.message
                })
            }
        }

        return results
    }
}

export default new SpotifyImporter()