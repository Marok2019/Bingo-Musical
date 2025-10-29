import YouTubeAPI from './YouTubeAPI'
import { v4 as uuidv4 } from 'uuid'

class YouTubeImporter {
    // Importar un solo video
    async importVideo(videoUrl) {
        const videoId = YouTubeAPI.extractVideoId(videoUrl)

        if (!videoId) {
            throw new Error('URL de YouTube inválida')
        }

        const videoInfo = await YouTubeAPI.getVideoInfo(videoId)

        // Calcular fragmento por defecto (del segundo 30 al 45)
        const cueIn = Math.min(30, videoInfo.duration - 15)
        const cueOut = Math.min(cueIn + 15, videoInfo.duration)

        return {
            id: uuidv4(),
            title: videoInfo.title,
            artist: videoInfo.artist,
            album: 'YouTube',
            duration: videoInfo.duration,
            sourceType: 'YOUTUBE',
            sourcePath: videoId,
            youtubeId: videoId,
            coverImage: videoInfo.thumbnail,
            cueIn: cueIn,
            cueOut: cueOut,
            createdAt: new Date().toISOString()
        }
    }

    // Importar playlist completa
    async importPlaylist(playlistUrl, options = {}) {
        const { onProgress = null } = options

        const playlistId = YouTubeAPI.extractPlaylistId(playlistUrl)

        if (!playlistId) {
            throw new Error('URL de playlist inválida')
        }

        const videos = await YouTubeAPI.getPlaylistVideos(playlistId)

        const songs = []
        let processed = 0

        for (const video of videos) {
            const cueIn = Math.min(30, video.duration - 15)
            const cueOut = Math.min(cueIn + 15, video.duration)

            const song = {
                id: uuidv4(),
                title: video.title,
                artist: video.artist,
                album: 'YouTube',
                duration: video.duration,
                sourceType: 'YOUTUBE',
                sourcePath: video.id,
                youtubeId: video.id,
                coverImage: video.thumbnail,
                cueIn: cueIn,
                cueOut: cueOut,
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
        }

        return {
            playlistName: `Playlist de YouTube`,
            songs: songs,
            stats: {
                total: songs.length
            }
        }
    }

    // Buscar y añadir
    async searchAndImport(query) {
        const results = await YouTubeAPI.searchVideos(query, 10)

        return results.map(video => ({
            id: uuidv4(),
            title: video.title,
            artist: video.artist,
            album: 'YouTube',
            duration: 180, // Estimado
            sourceType: 'YOUTUBE',
            sourcePath: video.id,
            youtubeId: video.id,
            coverImage: video.thumbnail,
            cueIn: 30,
            cueOut: 45,
            createdAt: new Date().toISOString()
        }))
    }
}

export default new YouTubeImporter()