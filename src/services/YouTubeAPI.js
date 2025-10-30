// services/YouTubeAPI.js
const InvidiousAPI = require('./InvidiousAPI');

class YouTubeAPI {
    constructor(database) {
        this.apiKey = process.env.YOUTUBE_API_KEY;
        this.db = database;
        this.invidious = new InvidiousAPI();
        this.useInvidiousFirst = true; // Prioriza Invidious
        this.quotaLimit = 9000; // Límite de seguridad diario
        this.quotaUsed = 0;
    }

    async searchSongs(query, maxResults = 10) {
        // 1. Verifica caché primero
        if (this.db) {
            const cached = await this.db.getCachedSearch(query);
            if (cached) {
                console.log('💾 Resultado desde caché');
                return cached;
            }
        }

        let results;

        // 2. Intenta con Invidious primero
        if (this.useInvidiousFirst) {
            try {
                results = await this.invidious.searchSongs(query, maxResults);

                // Guarda en caché si hay DB
                if (this.db && results.length > 0) {
                    await this.db.cacheSearch(query, results);
                }

                return results;

            } catch (error) {
                console.warn('⚠️ Invidious falló, intentando con YouTube API oficial...');
                // Si falla, intenta con YouTube API oficial
            }
        }

        // 3. Fallback a YouTube API oficial
        if (this.quotaUsed < this.quotaLimit) {
            try {
                results = await this._makeYouTubeAPIRequest(query, maxResults);
                this.quotaUsed += 100; // Costo de una búsqueda

                if (this.db && results.length > 0) {
                    await this.db.cacheSearch(query, results);
                }

                return results;

            } catch (error) {
                console.error('❌ YouTube API también falló:', error.message);
                throw new Error('No se pudo buscar en ningún servicio');
            }
        }

        throw new Error('Cuota de YouTube API agotada por hoy');
    }

    async _makeYouTubeAPIRequest(query, maxResults) {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=${maxResults}&key=${this.apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            throw new Error(`YouTube API Error: ${data.error.message}`);
        }

        console.log('🔑 Usando YouTube API oficial');
        return data.items;
    }

    async getVideoUrl(videoId) {
        // Invidious no proporciona URLs directas, YouTube player sigue siendo necesario
        return `https://www.youtube.com/watch?v=${videoId}`;
    }

    // Mantiene compatibilidad con tu código existente
    resetQuota() {
        this.quotaUsed = 0;
        console.log('🔄 Cuota reiniciada');
    }

    getQuotaStatus() {
        return {
            used: this.quotaUsed,
            limit: this.quotaLimit,
            remaining: this.quotaLimit - this.quotaUsed,
            percentage: ((this.quotaUsed / this.quotaLimit) * 100).toFixed(2)
        };
    }
}

module.exports = YouTubeAPI;