import { useState } from 'react'
import YouTubeAPI from '../services/YouTubeAPI'

function EditSongDialog({ song, onSave, onClose }) {
    const [title, setTitle] = useState(song.title)
    const [artist, setArtist] = useState(song.artist)
    const [album, setAlbum] = useState(song.album || '')
    const [cueIn, setCueIn] = useState(song.cueIn)
    const [cueOut, setCueOut] = useState(song.cueOut)
    const [youtubeUrl, setYoutubeUrl] = useState(
        song.youtubeId ? `https://www.youtube.com/watch?v=${song.youtubeId}` : ''
    )

    function handleSave() {
        const youtubeId = youtubeUrl ? YouTubeAPI.extractVideoId(youtubeUrl) : null

        const updatedSong = {
            ...song,
            title: title.trim(),
            artist: artist.trim(),
            album: album.trim() || null,
            cueIn: parseFloat(cueIn),
            cueOut: parseFloat(cueOut),
            youtubeId: youtubeId,
            sourcePath: youtubeId,
            hasAudio: !!youtubeId,
            updatedAt: new Date().toISOString()
        }

        onSave(updatedSong)
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
                width: '90%'
            }}>
                <h2 style={{ marginBottom: '20px' }}>✏️ Editar Canción</h2>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Título
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
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
                        Artista
                    </label>
                    <input
                        type="text"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
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
                        Álbum
                    </label>
                    <input
                        type="text"
                        value={album}
                        onChange={(e) => setAlbum(e.target.value)}
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
                        URL de YouTube
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
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Inicio (segundos)
                        </label>
                        <input
                            type="number"
                            value={cueIn}
                            onChange={(e) => setCueIn(e.target.value)}
                            min="0"
                            step="0.5"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '5px'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Fin (segundos)
                        </label>
                        <input
                            type="number"
                            value={cueOut}
                            onChange={(e) => setCueOut(e.target.value)}
                            min="0"
                            step="0.5"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '5px'
                            }}
                        />
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px'
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
                        💾 Guardar cambios
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EditSongDialog