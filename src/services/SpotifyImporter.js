import SpotifyAPI from './SpotifyAPI'
import YouTubeAPI from './YouTubeAPI'
import { v4 as uuidv4 } from 'uuid'


class SpotifyImporter {
    // Extraer playlist ID de una URL
    extractPlaylistId(url) {
        // Soporta múltiples formatos:
        // https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
        // spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
        const match = url.match(/playlist[\/:]([a-zA-Z0-9]+)/)
        return match ? match[1] : null
    }

    async findYouTubeVideo(title, artist) {
        try {
            const query = `${title} ${artist} official audio`
            const results = await YouTubeAPI.searchVideos(query, 1)

            if (results && results.length > 0) {
                return results[0].id
            }

            return null
        } catch (error) {
            console.warn(`No se encontró video de YouTube para: ${title} - ${artist}`)
            return null
        }
    }

    // Detectar mejor fragmento usando audio analysis
    async detectBestClip(trackId, duration) {
        try {
            const analysis = await SpotifyAPI.getAudioAnalysis(trackId)

            if (!analysis || !analysis.sections) {
                // Fallback: usar el medio de la canción
                const middle = duration / 2
                return {
                    cueIn: Math.max(0, middle - 7.5),
                    cueOut: Math.min(duration, middle + 7.5)
                }
            }

            // Buscar la sección más energética (generalmente el coro)
            const sections = analysis.sections
            const loudestSection = sections.reduce((prev, current) =>
                current.loudness > prev.loudness ? current : prev
            )

            const cueIn = Math.floor(loudestSection.start)
            const cueOut = Math.min(
                Math.floor(loudestSection.start + 15),
                duration
            )

            return { cueIn, cueOut }

        } catch (error) {
            console.warn('Could not get audio analysis:', error)

            // Fallback: fragmento del medio
            const middle = duration / 2
            return {
                cueIn: Math.max(0, middle - 7.5),
                cueOut: Math.min(duration, middle + 7.5)
            }
        }
    }

    // Importar playlist completa
    async importPlaylist(playlistUrl, options = {}) {
        const {
            autoDetectClip = true,
            onProgress = null
        } = options

        const playlistId = this.extractPlaylistId(playlistUrl)
        if (!playlistId) {
            throw new Error('URL de playlist inválida')
        }

        const playlist = await SpotifyAPI.getPlaylist(playlistId)
        const items = await SpotifyAPI.getPlaylistTracks(playlistId)

        const songs = []
        let processed = 0

        for (const item of items) {
            if (!item.track) continue

            const track = item.track
            const duration = track.duration_ms / 1000

            // 🔥 BUSCAR VIDEO EN YOUTUBE
            const youtubeId = await this.findYouTubeVideo(track.name, track.artists[0].name)

            // Detectar mejor fragmento
            let cueIn = 30
            let cueOut = 45

            if (autoDetectClip) {
                const clip = await this.detectBestClip(track.id, duration)
                cueIn = clip.cueIn
                cueOut = clip.cueOut
            }

            const song = {
                id: uuidv4(),
                title: track.name,
                artist: track.artists.map(a => a.name).join(', '),
                album: track.album.name,
                year: track.album.release_date ?
                    new Date(track.album.release_date).getFullYear() : null,
                duration: duration,
                sourceType: 'YOUTUBE', // 🔥 Cambiar a YOUTUBE
                sourcePath: youtubeId,  // 🔥 ID de YouTube
                youtubeId: youtubeId,
                spotifyId: track.id,    // Mantener para referencia
                coverImage: track.album.images[0]?.url,
                cueIn: cueIn,
                cueOut: cueOut,
                popularity: track.popularity,
                explicit: track.explicit,
                hasAudio: !!youtubeId,  // 🔥 Bandera si tiene audio
                createdAt: new Date().toISOString()
            }

            songs.push(song)
            processed++

            if (onProgress) {
                onProgress({
                    current: processed,
                    total: items.length,
                    song: song
                })
            }
        }

        return {
            playlistName: playlist.name,
            playlistDescription: playlist.description,
            songs: songs,
            stats: {
                total: songs.length,
                withAudio: songs.filter(s => s.hasAudio).length,
                withoutAudio: songs.filter(s => !s.hasAudio).length
            }
        }
    }
}

export default new SpotifyImporter()