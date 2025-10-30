// services/YouTubeImporter.js
class YouTubeImporter {
    constructor(youtubeAPI, database) {
        this.youtubeAPI = youtubeAPI;
        this.db = database;
    }

    async importFromSpotifyPlaylist(spotifyTracks) {
        const importedSongs = [];

        console.log(`📥 Importando ${spotifyTracks.length} canciones desde Spotify...`);

        for (let i = 0; i < spotifyTracks.length; i++) {
            const track = spotifyTracks[i];
            const query = `${track.name} ${track.artists[0].name} official audio`;

            try {
                console.log(`[${i + 1}/${spotifyTracks.length}] Buscando: ${query}`);

                // Usa el sistema híbrido de búsqueda
                const results = await this.youtubeAPI.searchSongs(query, 3);

                if (results.length > 0) {
                    const bestMatch = results[0];

                    const song = {
                        title: track.name,
                        artist: track.artists[0].name,
                        youtube_id: bestMatch.id.videoId,
                        duration: bestMatch.duration || track.duration_ms / 1000,
                        spotify_id: track.id,
                        thumbnail: bestMatch.snippet.thumbnails.high.url
                    };

                    importedSongs.push(song);

                    // Guarda en la base de datos
                    if (this.db) {
                        await this.db.addSong(song);
                    }
                } else {
                    console.warn(`⚠️ No se encontró: ${query}`);
                }

                // Pequeña pausa para no saturar
                await this.sleep(500);

            } catch (error) {
                console.error(`❌ Error importando "${query}":`, error.message);
            }
        }

        console.log(`✅ Importación completada: ${importedSongs.length}/${spotifyTracks.length} canciones`);
        return importedSongs;
    }

    async importFromYouTubePlaylist(playlistId) {
        // Este método puede quedarse usando YouTube API oficial
        // ya que las playlists requieren autenticación
        console.log(`📥 Importando playlist de YouTube: ${playlistId}`);

        // Implementación existente o nueva con Invidious si es posible
        // Invidious también soporta playlists:
        const instance = this.youtubeAPI.invidious.getCurrentInstance();
        const url = `${instance}/api/v1/playlists/${playlistId}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            return data.videos.map(video => ({
                title: video.title,
                artist: video.author,
                youtube_id: video.videoId,
                duration: video.lengthSeconds,
                thumbnail: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`
            }));
        } catch (error) {
            console.error('Error obteniendo playlist:', error);
            throw error;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = YouTubeImporter;