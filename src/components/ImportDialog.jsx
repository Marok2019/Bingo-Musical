import { useState } from 'react'
import YouTubeImporter from '../services/YouTubeImporter'

function ImportDialog({ onImportComplete, onClose }) {
    const [url, setUrl] = useState('')
    const [isImporting, setIsImporting] = useState(false)
    const [progress, setProgress] = useState(null)
    const [error, setError] = useState(null)

    function isValidYouTubeUrl(url) {
        return url.includes('youtube.com') || url.includes('youtu.be')
    }

    async function handleImport() {
        if (!url.trim()) {
            setError('Por favor ingresa una URL')
            return
        }

        if (!isValidYouTubeUrl(url)) {
            setError('Por favor ingresa una URL válida de YouTube')
            return
        }

        setIsImporting(true)
        setError(null)
        setProgress({ current: 0, total: 0 })

        try {
            let result

            // Detectar si es video individual o playlist
            const isPlaylist = url.includes('list=')

            if (isPlaylist) {
                // Importar playlist
                result = await YouTubeImporter.importPlaylist(url, {
                    onProgress: (prog) => {
                        setProgress(prog)
                    }
                })
            } else {
                // Importar video individual
                const song = await YouTubeImporter.importVideo(url)
                result = {
                    playlistName: 'Video Individual',
                    playlistDescription: 'Importado desde YouTube',
                    songs: [song],
                    stats: {
                        total: 1,
                        withAudio: 1,
                        withoutAudio: 0
                    }
                }
            }

            // Callback con las canciones importadas
            if (onImportComplete) {
                onImportComplete(result)
            }

            // Cerrar diálogo
            if (onClose) {
                onClose()
            }

        } catch (err) {
            setError(err.message)
            console.error('Error al importar:', err)
        } finally {
            setIsImporting(false)
        }
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
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
            }}>
                <h2 style={{ marginBottom: '20px' }}>📥 Importar desde YouTube</h2>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        URL de YouTube:
                    </label>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=... o playlist URL"
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '5px',
                            fontSize: '14px'
                        }}
                        disabled={isImporting}
                    />
                    <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                        Puedes importar videos individuales o playlists completas
                    </small>
                </div>

                <div style={{
                    padding: '12px',
                    backgroundColor: '#f0f8ff',
                    border: '1px solid #b3d9ff',
                    borderRadius: '5px',
                    marginBottom: '15px',
                    fontSize: '13px'
                }}>
                    <strong>💡 Ejemplos:</strong>
                    <div style={{ marginTop: '5px' }}>
                        • Video: <code>youtube.com/watch?v=...</code>
                    </div>
                    <div>
                        • Playlist: <code>youtube.com/playlist?list=...</code>
                    </div>
                </div>

                {error && (
                    <div style={{
                        padding: '10px',
                        backgroundColor: '#fee',
                        border: '1px solid #fcc',
                        borderRadius: '5px',
                        color: '#c00',
                        marginBottom: '15px'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                {progress && progress.total > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '5px',
                            fontSize: '14px'
                        }}>
                            <span>Importando...</span>
                            <span>{progress.current} / {progress.total}</span>
                        </div>
                        <div style={{
                            height: '8px',
                            backgroundColor: '#eee',
                            borderRadius: '4px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                height: '100%',
                                backgroundColor: '#FF0000',
                                width: `${(progress.current / progress.total) * 100}%`,
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                        {progress.song && (
                            <div style={{
                                marginTop: '8px',
                                fontSize: '12px',
                                color: '#666'
                            }}>
                                Importando: {progress.song.title}
                            </div>
                        )}
                    </div>
                )}

                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px'
                }}>
                    <button
                        onClick={onClose}
                        disabled={isImporting}
                        style={{
                            padding: '10px 20px',
                            border: '1px solid #ddd',
                            borderRadius: '5px',
                            backgroundColor: 'white',
                            cursor: isImporting ? 'not-allowed' : 'pointer',
                            opacity: isImporting ? 0.5 : 1
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={isImporting || !url.trim()}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '5px',
                            backgroundColor: '#FF0000',
                            color: 'white',
                            cursor: (isImporting || !url.trim()) ? 'not-allowed' : 'pointer',
                            opacity: (isImporting || !url.trim()) ? 0.5 : 1
                        }}
                    >
                        {isImporting ? '⏳ Importando...' : '📥 Importar'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ImportDialog