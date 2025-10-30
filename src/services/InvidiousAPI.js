// src/services/InvidiousAPI.js

class InvidiousAPI {
    constructor() {
        this.instances = [
            'https://inv.nadeko.net',
            'https://invidious.fdn.fr',
            'https://invidious.privacyredirect.com',
            'https://invidious.protokolla.fi',
            'https://inv.riverside.rocks',
            'https://yt.artemislena.eu',
            'https://invidious.flokinet.to',
            'https://invidious.kavin.rocks'
        ]
        this.currentInstanceIndex = 0
        this.maxRetries = 3

        // 🔥 SISTEMA DE LOGGING
        this.requestLog = []
        this.isValidationMode = true // Se puede desactivar después
    }

    // 🔥 MÉTODO PARA LOGGING
    logRequest(endpoint, method, success, instance) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            method: method,
            endpoint: endpoint,
            instance: instance,
            success: success,
            source: 'INVIDIOUS' // 🎯 IDENTIFICADOR CLAVE
        }

        this.requestLog.push(logEntry)

        // Log en consola con colores
        const emoji = success ? '✅' : '❌'
        const color = success ? '\x1b[32m' : '\x1b[31m' // Verde o Rojo
        const reset = '\x1b[0m'

        console.log(`${emoji} ${color}[INVIDIOUS]${reset} ${method} → ${endpoint}`)
        console.log(`   Instancia: ${instance}`)
        console.log(`   Hora: ${new Date().toLocaleTimeString()}`)

        if (this.isValidationMode) {
            console.log(`   🎯 CONFIRMADO: Usando Invidious (NO YouTube API)`)
        }
    }

    // 🔥 OBTENER LOG DE SOLICITUDES
    getRequestLog() {
        return this.requestLog
    }

    // 🔥 LIMPIAR LOG
    clearRequestLog() {
        this.requestLog = []
        console.log('🧹 Log de solicitudes limpiado')
    }

    // 🔥 OBTENER ESTADÍSTICAS
    getStats() {
        const total = this.requestLog.length
        const successful = this.requestLog.filter(r => r.success).length
        const failed = this.requestLog.filter(r => !r.success).length

        const instanceUsage = {}
        this.requestLog.forEach(log => {
            instanceUsage[log.instance] = (instanceUsage[log.instance] || 0) + 1
        })

        return {
            totalRequests: total,
            successful: successful,
            failed: failed,
            successRate: total > 0 ? ((successful / total) * 100).toFixed(2) + '%' : '0%',
            instanceUsage: instanceUsage,
            source: 'INVIDIOUS' // 🎯 CONFIRMACIÓN
        }
    }

    getCurrentInstance() {
        return this.instances[this.currentInstanceIndex]
    }

    rotateInstance() {
        this.currentInstanceIndex = (this.currentInstanceIndex + 1) % this.instances.length
        console.log(`🔄 Rotando a instancia: ${this.getCurrentInstance()}`)
    }

    async fetchWithRetry(endpoint, options = {}) {
        let lastError = null
        const method = options.method || 'GET'

        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                const instance = this.getCurrentInstance()
                const url = `${instance}${endpoint}`

                console.log(`\n🔍 Intento ${attempt + 1}/${this.maxRetries}`)
                console.log(`   URL: ${url}`)

                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        ...options.headers
                    }
                })

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                }

                const data = await response.json()

                // 🔥 LOG DE ÉXITO
                this.logRequest(endpoint, method, true, instance)

                return data

            } catch (error) {
                console.warn(`❌ Intento ${attempt + 1} falló:`, error.message)
                lastError = error

                // 🔥 LOG DE FALLO
                this.logRequest(endpoint, method, false, this.getCurrentInstance())

                this.rotateInstance()

                if (attempt < this.maxRetries - 1) {
                    const waitTime = 1000 * (attempt + 1)
                    console.log(`⏳ Esperando ${waitTime}ms antes de reintentar...`)
                    await new Promise(resolve => setTimeout(resolve, waitTime))
                }
            }
        }

        throw new Error(`Falló después de ${this.maxRetries} intentos: ${lastError.message}`)
    }

    extractVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
            /^([a-zA-Z0-9_-]{11})$/
        ]

        for (const pattern of patterns) {
            const match = url.match(pattern)
            if (match) return match[1]
        }

        return null
    }

    extractPlaylistId(url) {
        const match = url.match(/[?&]list=([^&]+)/)
        return match ? match[1] : null
    }

    async getVideoInfo(videoId) {
        console.log(`\n📹 Obteniendo info del video: ${videoId}`)

        try {
            const data = await this.fetchWithRetry(`/api/v1/videos/${videoId}`)

            return {
                id: videoId,
                title: data.title || 'Video sin título',
                artist: data.author || 'Canal desconocido',
                duration: data.lengthSeconds || 180,
                thumbnail: data.videoThumbnails?.[0]?.url ||
                    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                description: data.description,
                viewCount: data.viewCount,
                published: data.published
            }
        } catch (error) {
            console.error('❌ Error obteniendo info del video:', error)

            return {
                id: videoId,
                title: 'Video de YouTube',
                artist: 'Canal desconocido',
                duration: 180,
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
            }
        }
    }

    async getPlaylistVideos(playlistId) {
        console.log(`\n📋 Obteniendo playlist: ${playlistId}`)

        try {
            const data = await this.fetchWithRetry(`/api/v1/playlists/${playlistId}`)

            if (!data.videos || data.videos.length === 0) {
                throw new Error('Playlist vacía o no encontrada')
            }

            console.log(`✅ Playlist obtenida: ${data.videos.length} videos`)

            return data.videos.map(video => ({
                id: video.videoId,
                title: video.title || 'Video sin título',
                artist: video.author || 'Canal desconocido',
                duration: video.lengthSeconds || 180,
                thumbnail: video.videoThumbnails?.[0]?.url ||
                    `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`
            }))

        } catch (error) {
            console.error('❌ Error obteniendo playlist:', error)
            throw error
        }
    }

    async searchVideos(query, maxResults = 20) {
        console.log(`\n🔎 Buscando: "${query}" (máx: ${maxResults})`)

        try {
            const data = await this.fetchWithRetry(
                `/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort_by=relevance`
            )

            if (!data || data.length === 0) {
                console.log('⚠️ No se encontraron resultados')
                return []
            }

            const results = data.slice(0, maxResults)
            console.log(`✅ Encontrados ${results.length} resultados`)

            return results.map(item => ({
                id: item.videoId,
                title: item.title || 'Video sin título',
                artist: item.author || 'Canal desconocido',
                duration: item.lengthSeconds || 180,
                thumbnail: item.videoThumbnails?.[0]?.url ||
                    `https://img.youtube.com/vi/${item.videoId}/maxresdefault.jpg`,
                viewCount: item.viewCount,
                published: item.published
            }))

        } catch (error) {
            console.error('❌ Error en búsqueda:', error)
            return []
        }
    }

    async getAudioUrl(videoId) {
        console.log(`\n🎵 Obteniendo URL de audio: ${videoId}`)

        try {
            const data = await this.fetchWithRetry(`/api/v1/videos/${videoId}`)

            if (!data.adaptiveFormats) {
                throw new Error('No hay formatos de audio disponibles')
            }

            const audioFormats = data.adaptiveFormats.filter(
                format => format.type?.startsWith('audio/')
            )

            if (audioFormats.length === 0) {
                throw new Error('No se encontró formato de audio')
            }

            audioFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))

            const bestAudio = audioFormats[0]

            console.log(`✅ Audio encontrado: ${bestAudio.type} (${bestAudio.bitrate} bps)`)

            return {
                url: bestAudio.url,
                type: bestAudio.type,
                bitrate: bestAudio.bitrate,
                container: bestAudio.container
            }

        } catch (error) {
            console.error('❌ Error obteniendo URL de audio:', error)
            throw error
        }
    }

    parseDuration(duration) {
        if (typeof duration === 'number') {
            return duration
        }

        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
        if (match) {
            const hours = parseInt(match[1] || 0)
            const minutes = parseInt(match[2] || 0)
            const seconds = parseInt(match[3] || 0)
            return hours * 3600 + minutes * 60 + seconds
        }

        return 180
    }

    // 🔥 ACTIVAR/DESACTIVAR MODO VALIDACIÓN
    setValidationMode(enabled) {
        this.isValidationMode = enabled
        console.log(`🔧 Modo validación: ${enabled ? 'ACTIVADO' : 'DESACTIVADO'}`)
    }
}

export default new InvidiousAPI()