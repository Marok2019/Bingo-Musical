import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import YouTubeAPI from '../services/InvidiousAPI'

function AddSongDialog({ onSave, onClose }) {
    const [title, setTitle] = useState('')
    const [artist, setArtist] = useState('')
    const [album, setAlbum] = useState('')
    const [youtubeUrl, setYoutubeUrl] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [error, setError] = useState(null)

    async function handleAutoSearch() {
        if (!title || !artist) {
            setError('Ingresa título y artista primero')
            return
        }

        setIsSearching(true)
        setError(null)

        try {
            const query = `${title} ${artist} official audio`
            const results = await YouTubeAPI.searchVideos(query, 1)

            if (results && results.length > 0) {
                const videoId = results[0].id
                setYoutubeUrl(`https://www.youtube.com/watch?v=${videoId}`)
                alert('✅ Video encontrado automáticamente')
            } else {
                setError('No se encontró ningún video')
            }
        } catch (err) {
            setError('Error al buscar: ' + err.message)
        } finally {
            setIsSearching(false)
        }
    }

    async function handleSave() {
        if (!title.trim() || !artist.trim()) {
            setError('Título y artista son obligatorios')
            return
        }

        let youtubeId = null
        let duration = 180

        if (youtubeUrl.trim()) {
            youtubeId = YouTubeAPI.extractVideoId(youtubeUrl)

            if (!youtubeId) {
                setError('URL de YouTube inválida')
                return
            }

            try {
                const videoInfo = await YouTubeAPI.getVideoInfo(youtubeId)
                duration = videoInfo.duration
            } catch (err) {
                console.warn('No se pudo obtener info del video:', err)
            }
        }

        const song = {
            id: uuidv4(),
            title: title.trim(),
            artist: artist.trim(),
            album: album.trim() || null,
            duration: duration,
            sourceType: 'YOUTUBE',
            sourcePath: youtubeId,
            youtubeId: youtubeId,
            coverImage: youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : null,
            cueIn: 30,
            cueOut: 45,
            hasAudio: !!youtubeId,
            createdAt: new Date().toISOString()
        }

        onSave(song)
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '30px',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <h2 style={{ marginBottom: '20px' }}>➕ Añadir Canción</h2>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Título *
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Bohemian Rhapsody"
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '5px'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Artista *
                    </label>
                    <input
                        type="text"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                        placeholder="Queen"
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '5px'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Álbum (opcional)
                    </label>
                    <input
                        type="text"
                        value={album}
                        onChange={(e) => setAlbum(e.target.value)}
                        placeholder="A Night at the Opera"
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '5px'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        URL de YouTube (opcional)
                    </label>
                    <input
                        type="text"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '5px'
                        }}
                    />
                    <button
                        onClick={handleAutoSearch}
                        disabled={isSearching || !title || !artist}
                        style={{
                            marginTop: '8px',
                            padding: '8px 16px',
                            backgroundColor: '#0066cc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: isSearching ? 'wait' : 'pointer',
                            opacity: (!title || !artist) ? 0.5 : 1
                        }}
                    >
                        {isSearching ? '🔍 Buscando...' : '🔍 Buscar automáticamente'}
                    </button>
                </div>

                {error && (
                    <div style={{
                        padding: '10px',
                        backgroundColor: '#fee',
                        border: '1px solid #fcc',
                        borderRadius: '5px',
                        color: '#c00',
                        marginBottom: '15px',
                        fontSize: '14px'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px',
                    marginTop: '20px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            border: '1px solid #ddd',
                            borderRadius: '5px',
                            backgroundColor: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '5px',
                            backgroundColor: '#1DB954',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        💾 Guardar
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AddSongDialog