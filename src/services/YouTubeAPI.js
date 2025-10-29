import { YOUTUBE_CONFIG } from '../config.js'

class YouTubeAPI {
    constructor() {
        this.apiKey = YOUTUBE_CONFIG.apiKey
    }

    // Extraer video ID de una URL
    extractVideoId(url) {
        // Soporta:
        // https://www.youtube.com/watch?v=dQw4w9WgXcQ
        // https://youtu.be/dQw4w9WgXcQ
        // https://www.youtube.com/embed/dQw4w9WgXcQ
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
            /^([a-zA-Z0-9_-]{11})$/ // ID directo
        ]

        for (const pattern of patterns) {
            const match = url.match(pattern)
            if (match) return match[1]
        }

        return null
    }

    // Extraer playlist ID
    extractPlaylistId(url) {
        // https://www.youtube.com/playlist?list=PLxxxxxx
        const match = url.match(/[?&]list=([^&]+)/)
        return match ? match[1] : null
    }

    // Obtener información de un video (con API Key)
    async getVideoInfo(videoId) {
        if (!this.apiKey) {
            // Sin API key, retornar info básica
            return {
                id: videoId,
                title: 'Video de YouTube',
                duration: 180, // 3 minutos por defecto
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
            }
        }

        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?` +
            `part=snippet,contentDetails&id=${videoId}&key=${this.apiKey}`
        )

        const data = await response.json()

        if (!data.items || data.items.length === 0) {
            throw new Error('Video no encontrado')
        }

        const video = data.items[0]

        return {
            id: videoId,
            title: video.snippet.title,
            artist: video.snippet.channelTitle,
            duration: this.parseDuration(video.contentDetails.duration),
            thumbnail: video.snippet.thumbnails.maxres?.url ||
                video.snippet.thumbnails.high?.url
        }
    }

    // Obtener videos de una playlist (con API Key)
    async getPlaylistVideos(playlistId) {
        if (!this.apiKey) {
            throw new Error('Se requiere API Key para importar playlists de YouTube')
        }

        let allVideos = []
        let pageToken = null

        do {
            const url = `https://www.googleapis.com/youtube/v3/playlistItems?` +
                `part=snippet,contentDetails&playlistId=${playlistId}&` +
                `maxResults=50&key=${this.apiKey}` +
                (pageToken ? `&pageToken=${pageToken}` : '')

            const response = await fetch(url)
            const data = await response.json()

            if (!data.items) {
                throw new Error('Playlist no encontrada o privada')
            }

            allVideos = allVideos.concat(data.items)
            pageToken = data.nextPageToken

        } while (pageToken)

        // Obtener información detallada de cada video
        const videoIds = allVideos.map(item => item.contentDetails.videoId)
        const videos = []

        // YouTube API permite hasta 50 IDs por request
        for (let i = 0; i < videoIds.length; i += 50) {
            const batch = videoIds.slice(i, i + 50)
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?` +
                `part=snippet,contentDetails&id=${batch.join(',')}&key=${this.apiKey}`
            )

            const data = await response.json()
            videos.push(...data.items)
        }

        return videos.map(video => ({
            id: video.id,
            title: video.snippet.title,
            artist: video.snippet.channelTitle,
            duration: this.parseDuration(video.contentDetails.duration),
            thumbnail: video.snippet.thumbnails.maxres?.url ||
                video.snippet.thumbnails.high?.url
        }))
    }

    // Convertir duración ISO 8601 a segundos
    parseDuration(duration) {
        // PT1H2M10S → 3730 segundos
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)

        if (!match) return 180 // Default 3 minutos

        const hours = parseInt(match[1] || 0)
        const minutes = parseInt(match[2] || 0)
        const seconds = parseInt(match[3] || 0)

        return hours * 3600 + minutes * 60 + seconds
    }

    // Buscar videos (con API Key)
    async searchVideos(query, maxResults = 20) {
        if (!this.apiKey) {
            throw new Error('Se requiere API Key para buscar en YouTube')
        }

        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?` +
            `part=snippet&q=${encodeURIComponent(query)}&` +
            `type=video&videoCategoryId=10&maxResults=${maxResults}&key=${this.apiKey}`
        )

        const data = await response.json()

        return data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.high?.url
        }))
    }
}

export default new YouTubeAPI()