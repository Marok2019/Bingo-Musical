const fetch = require('electron-fetch').default;
const Store = require('electron-store');

class SpotifyAPI {
    constructor() {
        this.store = new Store();
        this.clientId = this.store.get('spotify.clientId', '');
        this.clientSecret = this.store.get('spotify.clientSecret', '');
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    setCredentials(clientId, clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.store.set('spotify.clientId', clientId);
        this.store.set('spotify.clientSecret', clientSecret);
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    hasCredentials() {
        return !!(this.clientId && this.clientSecret);
    }

    async getAccessToken() {
        // Verificar si el token actual es válido
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        if (!this.hasCredentials()) {
            throw new Error('Credenciales de Spotify no configuradas');
        }

        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + Buffer.from(this.clientId + ':' + this.clientSecret).toString('base64')
                },
                body: 'grant_type=client_credentials'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            this.accessToken = data.access_token;
            // Establecer expiración con 5 minutos de margen
            this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

            return this.accessToken;
        } catch (error) {
            console.error('Error obteniendo token de Spotify:', error);
            throw error;
        }
    }

    async searchTrack(query) {
        try {
            const token = await this.getAccessToken();

            const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`;

            const response = await fetch(searchUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (!data.tracks?.items?.length) {
                return null;
            }

            return data.tracks.items;
        } catch (error) {
            console.error('Error buscando en Spotify:', error);
            return null;
        }
    }

    async getPreviewUrl(songTitle, artistName) {
        try {
            const query = `${songTitle} ${artistName}`;
            const tracks = await this.searchTrack(query);

            if (!tracks || tracks.length === 0) {
                return null;
            }

            // Buscar la primera canción con preview disponible
            for (const track of tracks) {
                if (track.preview_url) {
                    return {
                        url: track.preview_url,
                        duration: 30, // Los previews de Spotify son de 30 segundos
                        title: track.name,
                        artist: track.artists[0]?.name
                    };
                }
            }

            return null;
        } catch (error) {
            console.error('Error obteniendo preview de Spotify:', error);
            return null;
        }
    }

    async importPlaylist(playlistUrl) {
        try {
            const token = await this.getAccessToken();

            // Extraer ID de la playlist
            const playlistId = this.extractPlaylistId(playlistUrl);

            if (!playlistId) {
                throw new Error('URL de playlist inválida');
            }

            const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            const songs = data.items.map(item => ({
                title: item.track.name,
                artist: item.track.artists[0]?.name || 'Artista Desconocido',
                hasPreview: !!item.track.preview_url
            }));

            return songs;
        } catch (error) {
            console.error('Error importando playlist de Spotify:', error);
            throw error;
        }
    }

    extractPlaylistId(url) {
        const regex = /playlist\/([a-zA-Z0-9]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }
}

module.exports = new SpotifyAPI();