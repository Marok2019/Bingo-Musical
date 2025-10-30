import { useState, useEffect } from 'react'
import SpotifyImporter from '../services/SpotifyImporter'
import AudioPlayer from '../core/AudioPlayer'

function LibraryView() {
    const [songs, setSongs] = useState([])
    const [loading, setLoading] = useState(false)
    const [currentSong, setCurrentSong] = useState(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')

    const [audioPlayer] = useState(() => {
        const player = new AudioPlayer()

        player.onStateChange = ({ to }) => {
            setIsPlaying(to === 'PLAYING')
        }

        player.onProgress = ({ percentage }) => {
            setProgress(percentage)
        }

        player.onComplete = () => {
            setCurrentSong(null)
            setProgress(0)
        }

        player.onError = (error) => {
            alert('Error al reproducir: ' + error.message)
        }

        return player
    })

    // Cargar canciones guardadas al iniciar
    useEffect(() => {
        loadSongsFromStorage()
    }, [])

    // Guardar canciones en localStorage cuando cambien
    useEffect(() => {
        if (songs.length > 0) {
            localStorage.setItem('bingo-songs', JSON.stringify(songs))
        }
    }, [songs])

    function loadSongsFromStorage() {
        const saved = localStorage.getItem('bingo-songs')
        if (saved) {
            setSongs(JSON.parse(saved))
        }
    }

    async function handleImportPlaylist() {
        const url = prompt('Ingresa la URL de la playlist de Spotify:\n\nEjemplo:\nhttps://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M')
        if (!url) return

        setLoading(true)

        try {
            const result = await SpotifyImporter.importPlaylist(url)

            // Agregar nuevas canciones (evitar duplicados)
            const existingIds = new Set(songs.map(s => s.spotifyId))
            const newSongs = result.songs.filter(s => !existingIds.has(s.spotifyId))

            setSongs([...songs, ...newSongs])

            alert(
                `✅ Playlist importada\n\n` +
                `• ${newSongs.length} canciones nuevas\n` +
                `• ${result.songs.length - newSongs.length} duplicadas (omitidas)\n` +
                `• ${result.playlistInfo.skipped} sin preview`
            )

        } catch (error) {
            alert('❌ Error al importar:\n\n' + error.message)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function handlePlaySong(song) {
        if (!song.previewUrl) {
            alert('Esta canción no tiene preview disponible')
            return
        }

        try {
            setCurrentSong(song)
            setProgress(0)

            await audioPlayer.loadFromURL(
                song.previewUrl,
                song.cueIn,
                15
            )

            audioPlayer.play()

        } catch (error) {
            alert('Error al reproducir: ' + error.message)
            setCurrentSong(null)
        }
    }

    function handlePause() {
        if (isPlaying) {
            audioPlayer.pause()
        } else {
            audioPlayer.play()
        }
    }

    function handleStop() {
        audioPlayer.stop()
        setCurrentSong(null)
        setProgress(0)
    }

    function handleDeleteSong(songId) {
        if (confirm('¿Eliminar esta canción?')) {
            setSongs(songs.filter(s => s.id !== songId))
            if (currentSong?.id === songId) {
                handleStop()
            }
        }
    }

    function handleClearAll() {
        if (confirm('¿Eliminar TODAS las canciones?\n\nEsta acción no se puede deshacer.')) {
            setSongs([])
            handleStop()
            localStorage.removeItem('bingo-songs')
        }
    }

    // Filtrar canciones por búsqueda
    const filteredSongs = songs.filter(song => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            song.title.toLowerCase().includes(query) ||
            song.artist.toLowerCase().includes(query) ||
            song.album.toLowerCase().includes(query)
        )
    })

    return (
        <div style={{ padding: '40px' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px'
            }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '32px' }}>📚 Biblioteca de Canciones</h1>
                    <p style={{ margin: '8px 0 0 0', color: '#666' }}>
                        {songs.length} canciones en total
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handleImportPlaylist}
                        disabled={loading}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#1DB954',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            opacity: loading ? 0.6 : 1
                        }}
                    >
                        {loading ? '⏳ Importando...' : '📥 Importar Playlist'}
                    </button>

                    {songs.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            🗑️ Limpiar Todo
                        </button>
                    )}
                </div>
            </div>

            {/* Barra de búsqueda */}
            {songs.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <input
                        type="text"
                        placeholder="🔍 Buscar por título, artista o álbum..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 20px',
                            fontSize: '16px',
                            border: '2px solid #ddd',
                            borderRadius: '8px',
                            outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                </div>
            )}

            {/* Reproductor actual */}
            {currentSong && (
                <div style={{
                    padding: '20px',
                    backgroundColor: '#2a2a2a',
                    color: 'white',
                    borderRadius: '12px',
                    marginBottom: '30px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <img
                            src={currentSong.coverImage}
                            alt="Album cover"
                            style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '8px',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                            }}
                        />

                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '20px' }}>
                                {currentSong.title}
                            </h3>
                            <p style={{ margin: '0 0 12px 0', color: '#aaa', fontSize: '14px' }}>
                                {currentSong.artist} • {currentSong.album}
                            </p>

                            {/* Barra de progreso */}
                            <div style={{
                                width: '100%',
                                height: '6px',
                                backgroundColor: '#444',
                                borderRadius: '3px',
                                overflow: 'hidden',
                                marginBottom: '12px'
                            }}>
                                <div style={{
                                    width: `${progress}%`,
                                    height: '100%',
                                    backgroundColor: '#1DB954',
                                    transition: 'width 0.1s linear'
                                }} />
                            </div>

                            {/* Controles */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={handlePause}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#1DB954',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {isPlaying ? '⏸️ Pausar' : '▶️ Continuar'}
                                </button>

                                <button
                                    onClick={() => audioPlayer.replay()}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#555',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🔁 Repetir
                                </button>

                                <button
                                    onClick={handleStop}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#e74c3c',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ⏹️ Detener
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista de canciones */}
            {filteredSongs.length > 0 ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                    {filteredSongs.map(song => (
                        <div
                            key={song.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '16px',
                                backgroundColor: currentSong?.id === song.id ? '#e8f5e9' : 'white',
                                borderRadius: '12px',
                                border: currentSong?.id === song.id ? '2px solid #1DB954' : '1px solid #e0e0e0',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (currentSong?.id !== song.id) {
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'
                            }}
                        >
                            <img
                                src={song.coverImage}
                                alt="Cover"
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '6px',
                                    objectFit: 'cover'
                                }}
                            />

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    marginBottom: '4px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {song.title}
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    color: '#666',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {song.artist}
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#999',
                                    marginTop: '2px'
                                }}>
                                    {song.album} • {song.year || 'N/A'}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => handlePlaySong(song)}
                                    disabled={currentSong?.id === song.id && isPlaying}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#1DB954',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: currentSong?.id === song.id && isPlaying ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold',
                                        opacity: currentSong?.id === song.id && isPlaying ? 0.6 : 1,
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {currentSong?.id === song.id && isPlaying ? '▶️ Reproduciendo' : '▶️ Reproducir'}
                                </button>

                                <button
                                    onClick={() => handleDeleteSong(song.id)}
                                    style={{
                                        padding: '10px 16px',
                                        backgroundColor: '#e74c3c',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                    title="Eliminar canción"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : songs.length > 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px',
                    color: '#999'
                }}>
                    <p style={{ fontSize: '18px' }}>
                        No se encontraron canciones que coincidan con "{searchQuery}"
                    </p>
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '80px 20px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '2px dashed #ddd'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎵</div>
                    <h2 style={{ margin: '0 0 12px 0', color: '#333' }}>
                        No hay canciones en la biblioteca
                    </h2>
                    <p style={{ margin: '0 0 24px 0', color: '#666' }}>
                        Importa una playlist de Spotify para comenzar
                    </p>
                    <button
                        onClick={handleImportPlaylist}
                        style={{
                            padding: '14px 28px',
                            backgroundColor: '#1DB954',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '16px'
                        }}
                    >
                        📥 Importar Primera Playlist
                    </button>
                </div>
            )}
        </div>
    )
}

export default LibraryView