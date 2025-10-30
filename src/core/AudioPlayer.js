class AudioPlayer {
    constructor() {
        this.audio = new Audio();
        this.currentSong = null;
        this.isPlaying = false;
        this.duration = 15; // Duración del fragmento en segundos

        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
        });

        this.audio.addEventListener('error', (e) => {
            console.error('Error de reproducción:', e);
            this.isPlaying = false;
        });
    }

    async play(song) {
        try {
            this.currentSong = song;

            // Obtener URL de audio
            const audioUrl = await this.getAudioUrl(song);

            if (!audioUrl) {
                throw new Error('No se pudo obtener URL de audio');
            }

            this.audio.src = audioUrl;
            this.audio.currentTime = 0;

            await this.audio.play();
            this.isPlaying = true;

            // Detener después de 15 segundos
            setTimeout(() => {
                if (this.isPlaying) {
                    this.stop();
                }
            }, this.duration * 1000);

            return true;
        } catch (error) {
            console.error('Error al reproducir:', error);
            this.isPlaying = false;
            return false;
        }
    }

    async getAudioUrl(song) {
        // Intentar primero con Invidious
        try {
            const invidiousUrl = await this.getInvidiousUrl(song);
            if (invidiousUrl) return invidiousUrl;
        } catch (error) {
            console.warn('Invidious falló, intentando Spotify:', error);
        }

        // Respaldo con Spotify
        try {
            const spotifyUrl = await this.getSpotifyPreview(song);
            if (spotifyUrl) return spotifyUrl;
        } catch (error) {
            console.warn('Spotify falló:', error);
        }

        return null;
    }

    async getInvidiousUrl(song) {
        const query = `${song.title} ${song.artist}`;
        const invidiousInstance = 'https://invidious.jing.rocks'; // Instancia estable

        try {
            const searchUrl = `${invidiousInstance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
            const response = await fetch(searchUrl);

            if (!response.ok) throw new Error('Búsqueda falló');

            const results = await response.json();

            if (results.length === 0) throw new Error('No se encontraron resultados');

            const videoId = results[0].videoId;

            // Obtener streams de audio
            const videoUrl = `${invidiousInstance}/api/v1/videos/${videoId}`;
            const videoResponse = await fetch(videoUrl);

            if (!videoResponse.ok) throw new Error('No se pudo obtener video');

            const videoData = await videoResponse.json();

            // Buscar el formato de audio de mejor calidad
            const audioFormat = videoData.adaptiveFormats
                .filter(f => f.type.startsWith('audio/'))
                .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];

            if (!audioFormat) throw new Error('No se encontró formato de audio');

            return audioFormat.url;
        } catch (error) {
            console.error('Error en Invidious:', error);
            return null;
        }
    }

    async getSpotifyPreview(song) {
        try {
            const token = await this.getSpotifyToken();
            if (!token) throw new Error('No se pudo obtener token de Spotify');

            const query = `${song.title} ${song.artist}`;
            const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`;

            const response = await fetch(searchUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Búsqueda de Spotify falló');

            const data = await response.json();

            if (!data.tracks?.items?.length) throw new Error('No se encontraron canciones');

            const track = data.tracks.items[0];

            if (!track.preview_url) throw new Error('No hay preview disponible');

            return track.preview_url;
        } catch (error) {
            console.error('Error en Spotify:', error);
            return null;
        }
    }

    async getSpotifyToken() {
        // Usar el servicio SpotifyAPI.js existente
        const SpotifyAPI = require('../services/SpotifyAPI.js');
        return await SpotifyAPI.getAccessToken();
    }

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
    }

    resume() {
        if (!this.isPlaying) {
            this.audio.play();
            this.isPlaying = true;
        }
    }

    setVolume(volume) {
        this.audio.volume = Math.max(0, Math.min(1, volume));
    }

    getVolume() {
        return this.audio.volume;
    }

    getCurrentTime() {
        return this.audio.currentTime;
    }

    getDuration() {
        return this.duration;
    }
}

module.exports = new AudioPlayer();