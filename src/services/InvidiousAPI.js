class InvidiousAPI {
    constructor() {
        // Lista de instancias públicas de Invidious
        this.instances = [
            'https://invidious.jing.rocks',
            'https://invidious.lunar.icu',
            'https://iv.ggtyler.dev',
            'https://invidious.privacyredirect.com',
            'https://invidious.protokolla.fi'
        ];
        this.currentInstanceIndex = 0;
    }

    getCurrentInstance() {
        return this.instances[this.currentInstanceIndex];
    }

    rotateInstance() {
        this.currentInstanceIndex = (this.currentInstanceIndex + 1) % this.instances.length;
        console.log('Rotando a instancia:', this.getCurrentInstance());
    }

    async searchVideo(query, retries = 3) {
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const instance = this.getCurrentInstance();
                const searchUrl = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort_by=relevance`;

                const response = await fetch(searchUrl, {
                    timeout: 10000
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const results = await response.json();

                if (results.length === 0) {
                    throw new Error('No se encontraron resultados');
                }

                return results[0];
            } catch (error) {
                console.warn(`Intento ${attempt + 1} falló:`, error.message);

                if (attempt < retries - 1) {
                    this.rotateInstance();
                    await this.delay(1000); // Esperar 1 segundo antes de reintentar
                }
            }
        }

        throw new Error('No se pudo buscar el video después de varios intentos');
    }

    async getVideoStreams(videoId, retries = 3) {
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const instance = this.getCurrentInstance();
                const videoUrl = `${instance}/api/v1/videos/${videoId}`;

                const response = await fetch(videoUrl, {
                    timeout: 10000
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const videoData = await response.json();

                return videoData;
            } catch (error) {
                console.warn(`Intento ${attempt + 1} falló:`, error.message);

                if (attempt < retries - 1) {
                    this.rotateInstance();
                    await this.delay(1000);
                }
            }
        }

        throw new Error('No se pudo obtener streams del video');
    }

    async getAudioUrl(songTitle, artistName) {
        try {
            const query = `${songTitle} ${artistName}`;

            // Buscar video
            const video = await this.searchVideo(query);

            if (!video || !video.videoId) {
                throw new Error('No se encontró video');
            }

            // Obtener streams
            const videoData = await this.getVideoStreams(video.videoId);

            // Filtrar formatos de audio y ordenar por calidad
            const audioFormats = videoData.adaptiveFormats
                ?.filter(f => f.type?.startsWith('audio/'))
                .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

            if (!audioFormats || audioFormats.length === 0) {
                throw new Error('No se encontraron formatos de audio');
            }

            // Devolver el de mejor calidad
            return {
                url: audioFormats[0].url,
                duration: videoData.lengthSeconds,
                title: videoData.title
            };
        } catch (error) {
            console.error('Error en InvidiousAPI:', error);
            throw error;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Verificar salud de las instancias
    async checkInstanceHealth(instance) {
        try {
            const response = await fetch(`${instance}/api/v1/stats`, {
                timeout: 5000
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    async updateHealthyInstances() {
        const healthChecks = await Promise.all(
            this.instances.map(instance => this.checkInstanceHealth(instance))
        );

        const healthyInstances = this.instances.filter((_, index) => healthChecks[index]);

        if (healthyInstances.length > 0) {
            this.instances = healthyInstances;
            this.currentInstanceIndex = 0;
            console.log(`Instancias saludables: ${healthyInstances.length}`);
        }
    }
}

module.exports = new InvidiousAPI();