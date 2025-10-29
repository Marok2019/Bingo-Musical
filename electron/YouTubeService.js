const fetch = require('node-fetch')

class YouTubeService {
    async searchVideo(title, artist) {
        const query = `${title} ${artist} official audio`

        try {
            console.log(`🔍 Buscando en YouTube: ${query}`)

            const response = await fetch(
                `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                }
            )

            const html = await response.text()

            // Extraer videoId del HTML
            const match = html.match(/"videoId":"([^"]{11})"/)

            if (match && match[1]) {
                const videoId = match[1]
                console.log(`✅ Encontrado: ${videoId}`)
                return videoId
            }

            console.warn(`⚠️ No se encontró video para: ${title}`)
            return null

        } catch (error) {
            console.error('❌ Error buscando en YouTube:', error.message)
            return null
        }
    }

    async searchVideoBatch(songs) {
        const results = []

        for (let i = 0; i < songs.length; i++) {
            const song = songs[i]
            console.log(`[${i + 1}/${songs.length}] Buscando: ${song.title}`)

            const videoId = await this.searchVideo(song.title, song.artist)

            results.push({
                ...song,
                youtubeId: videoId,
                sourceType: videoId ? 'YOUTUBE' : (song.previewUrl ? 'SPOTIFY' : 'NONE')
            })

            // Delay para no saturar
            if (i < songs.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500))
            }
        }

        return results
    }
}

module.exports = new YouTubeService()