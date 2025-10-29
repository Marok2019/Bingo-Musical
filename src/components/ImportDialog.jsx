import { useState } from 'react'
import SpotifyImporter from '../services/SpotifyImporter'
import YouTubeImporter from '../services/YouTubeImporter'

function ImportDialog({ onImportComplete, onClose }) {
    const [url, setUrl] = useState('')
    const [source, setSource] = useState('auto') // 'auto', 'spotify', 'youtube'
    const [isImporting, setIsImporting] = useState(false)
    const [progress, setProgress] = useState(null)
    const [error, setError] = useState(null)

    function detectSource(url) {
        if (url.includes('spotify.com')) return 'spotify'
        if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
        return null
    }

    async function handleImport() {
        if (!url.trim()) {
            setError('Por favor ingresa una URL')
            return
        }

        setIsImporting(true)
        setError(null)
        setProgress({ current: 0, total: 0 })

        try {
            let detectedSource = source === 'auto' ? detectSource(url) : source

            if (!detectedSource) {
                throw new Error('No se pudo detectar la fuente. Selecciona manualmente.')
            }

            let result

            if (detectedSource === 'spotify') {
                // Importar desde Spotify
                result = await SpotifyImporter.importPlaylist(url, {
                    autoDetectClip: true,
                    onProgress: (prog) => {
                        setProgress(prog)
                    }
                })
            } else if (detectedSource === 'youtube') {
                // Importar desde YouTube
                result = await YouTubeImporter.importPlaylist(url, {
                    onProgress: (prog) => {
                        setProgress(prog)
                    }
                })
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
                <h2 style={{ marginBottom: '20px' }}>📥 Importar Playlist</h2>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Fuente:
                    </label>
                    <select
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '5px',
                            fontSize: '14px'
                        }}
                        disabled={isImporting}
                    >
                        <option value="auto">🔍 Auto-detectar</option>
                        <option value="spotify">🎧 Spotify</option>
                        <option value="youtube">📺 YouTube</option>
                    </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        URL de la playlist:
                    </label>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://open.spotify.com/playlist/..."
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
                        Pega la URL completa de la playlist de Spotify o YouTube
                    </small>
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
                                backgroundColor: '#1DB954',
                                width: `${(progress.current / progress.total) * 100}%`,
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
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
                            backgroundColor: '#1DB954',
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