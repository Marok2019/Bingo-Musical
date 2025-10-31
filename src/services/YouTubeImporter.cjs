// src/services/YouTubeImporter.js
const InvidiousAPI = require('./InvidiousAPI')
const { v4: uuidv4 } = require('uuid')

class YouTubeImporter {
    async importVideo(videoUrl) {
        const videoId = InvidiousAPI.extractVideoId(videoUrl)

        if (!videoId) {
            throw new Error('URL de YouTube inválida')
        }

        try {
            const videoInfo = await InvidiousAPI.getVideoInfo(videoId)

            if (!videoInfo || !videoInfo.id) {
                throw new Error('No se pudo obtener información del video')
            }

            const duration = videoInfo.duration || 180
            const cueIn = Math.min(30, Math.max(0, duration - 15))
            const cueOut = Math.min(cueIn + 15, duration)

            return {
                id: uuidv4(),
                title: videoInfo.title || 'Video sin título',
                artist: videoInfo.artist || 'Artista desconocido',
                album: 'YouTube',
                duration: duration,
                sourceType: 'YOUTUBE',
                sourcePath: videoId,
                youtubeId: videoId,
                // ❌ REMOVIDO: coverImage
                cueIn: cueIn,
                cueOut: cueOut,
                hasAudio: true,
                createdAt: new Date().toISOString()
            }
        } catch (error) {
            console.error('Error al importar video:', error)
            throw error
        }
    }

    async importPlaylist(playlistUrl, options = {}) {
        const { onProgress = null } = options

        const playlistId = InvidiousAPI.extractPlaylistId(playlistUrl)

        if (!playlistId) {
            throw new Error('URL de playlist inválida')
        }

        try {
            const videos = await InvidiousAPI.getPlaylistVideos(playlistId)

            if (!videos || videos.length === 0) {
                throw new Error('La playlist está vacía o no se pudo acceder')
            }

            const songs = []
            let processed = 0

            for (const video of videos) {
                try {
                    if (!video || !video.id) {
                        console.warn('Video sin ID, saltando...')
                        continue
                    }

                    const duration = video.duration || 180
                    const cueIn = Math.min(30, Math.max(0, duration - 15))
                    const cueOut = Math.min(cueIn + 15, duration)

                    const song = {
                        id: uuidv4(),
                        title: video.title || 'Video sin título',
                        artist: video.artist || 'Artista desconocido',
                        album: 'YouTube',
                        duration: duration,
                        sourceType: 'YOUTUBE',
                        sourcePath: video.id,
                        youtubeId: video.id,
                        // ❌ REMOVIDO: coverImage
                        cueIn: cueIn,
                        cueOut: cueOut,
                        hasAudio: true,
                        createdAt: new Date().toISOString()
                    }

                    songs.push(song)
                    processed++

                    if (onProgress) {
                        onProgress({
                            current: processed,
                            total: videos.length,
                            song: song
                        })
                    }
                } catch (error) {
                    console.error('Error procesando video:', video, error)
                    continue
                }
            }

            return {
                playlistName: `Playlist de YouTube`,
                playlistDescription: 'Importada desde YouTube',
                songs: songs,
                stats: {
                    total: songs.length,
                    withAudio: songs.length,
                    withoutAudio: 0
                }
            }
        } catch (error) {
            console.error('Error al importar playlist:', error)
            throw error
        }
    }

    async searchAndImport(query) {
        try {
            const results = await InvidiousAPI.searchVideos(query, 10)

            if (!results || results.length === 0) {
                return []
            }

            return results.map(video => ({
                id: uuidv4(),
                title: video.title || 'Video sin título',
                artist: video.artist || 'Artista desconocido',
                album: 'YouTube',
                duration: video.duration || 180,
                sourceType: 'YOUTUBE',
                sourcePath: video.id,
                youtubeId: video.id,
                // ❌ REMOVIDO: coverImage
                cueIn: 30,
                cueOut: 45,
                hasAudio: true,
                createdAt: new Date().toISOString()
            }))
        } catch (error) {
            console.error('Error en búsqueda:', error)
            return []
        }
    }
}

module.exports = new YouTubeImporter()