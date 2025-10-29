import { useState, useEffect } from 'react'
import Database from '../core/Database'
import ImportDialog from '../components/ImportDialog'
import AddSongDialog from '../components/AddSongDialog'
import EditSongDialog from '../components/EditSongDialog'
import AudioPreview from '../components/AudioPreview'

function LibraryView() {
    const [songs, setSongs] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [filteredSongs, setFilteredSongs] = useState([])
    const [selectedSongs, setSelectedSongs] = useState([])
    const [showImportDialog, setShowImportDialog] = useState(false)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [editingSong, setEditingSong] = useState(null)
    const [previewingSong, setPreviewingSong] = useState(null)

    // Cargar canciones al montar
    useEffect(() => {
        loadSongs()
    }, [])

    // Filtrar cuando cambia la búsqueda
    useEffect(() => {
        if (searchQuery.trim()) {
            const results = Database.search(searchQuery)
            setFilteredSongs(results)
        } else {
            setFilteredSongs(songs)
        }
    }, [searchQuery, songs])

    function loadSongs() {
        const allSongs = Database.findAll()
        setSongs(allSongs)
        setFilteredSongs(allSongs)
    }

    function handleImportComplete(result) {
        Database.insertMany(result.songs)
        loadSongs()
        setShowImportDialog(false)

        alert(
            `✅ Importadas ${result.songs.length} canciones\n\n` +
            `Con audio: ${result.stats.withAudio}\n` +
            `Sin audio: ${result.stats.withoutAudio}`
        )
    }

    function handleAddSong(song) {
        Database.insert(song)
        loadSongs()
        setShowAddDialog(false)
    }

    function handleEditSong(updatedSong) {
        Database.update(updatedSong.id, updatedSong)
        loadSongs()
        setEditingSong(null)
    }

    function handleDeleteSong(id) {
        if (confirm('¿Eliminar esta canción?')) {
            Database.delete(id)
            loadSongs()
        }
    }

    function handleDeleteSelected() {
        if (confirm(`¿Eliminar ${selectedSongs.length} canciones seleccionadas?`)) {
            Database.deleteMany(selectedSongs)
            setSelectedSongs([])
            loadSongs()
        }
    }

    function toggleSelection(id) {
        setSelectedSongs(prev =>
            prev.includes(id)
                ? prev.filter(songId => songId !== id)
                : [...prev, id]
        )
    }

    function toggleSelectAll() {
        if (selectedSongs.length === filteredSongs.length) {
            setSelectedSongs([])
        } else {
            setSelectedSongs(filteredSongs.map(s => s.id))
        }
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ marginBottom: '10px' }}>🎵 Biblioteca de Canciones</h1>
                <p style={{ color: '#666' }}>
                    {songs.length} canción{songs.length !== 1 ? 'es' : ''} •
                    {selectedSongs.length > 0 && ` ${selectedSongs.length} seleccionada${selectedSongs.length !== 1 ? 's' : ''}`}
                </p>
            </div>

            {/* Barra de acciones */}
            <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px',
                flexWrap: 'wrap'
            }}>
                <button
                    onClick={() => setShowImportDialog(true)}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#1DB954',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    📥 Importar Playlist
                </button>

                <button
                    onClick={() => setShowAddDialog(true)}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#0066cc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    ➕ Añadir Canción
                </button>

                {selectedSongs.length > 0 && (
                    <button
                        onClick={handleDeleteSelected}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        🗑️ Eliminar ({selectedSongs.length})
                    </button>
                )}
            </div>

            {/* Barra de búsqueda */}
            <input
                type="text"
                placeholder="🔍 Buscar por título, artista o álbum..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px',
                    marginBottom: '20px'
                }}
            />

            {/* Tabla de canciones */}
            {filteredSongs.length > 0 ? (
                <div style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: 'white'
                }}>
                    {/* Header de tabla */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 60px 1fr 1fr 150px 100px 150px',
                        padding: '12px',
                        backgroundColor: '#f5f5f5',
                        fontWeight: 'bold',
                        borderBottom: '2px solid #ddd',
                        alignItems: 'center'
                    }}>
                        <input
                            type="checkbox"
                            checked={selectedSongs.length === filteredSongs.length && filteredSongs.length > 0}
                            onChange={toggleSelectAll}
                        />
                        <span></span>
                        <span>Título</span>
                        <span>Artista</span>
                        <span>Álbum</span>
                        <span>Duración</span>
                        <span>Acciones</span>
                    </div>

                    {/* Filas */}
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        {filteredSongs.map(song => (
                            <div
                                key={song.id}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '40px 60px 1fr 1fr 150px 100px 150px',
                                    padding: '12px',
                                    borderBottom: '1px solid #eee',
                                    alignItems: 'center',
                                    backgroundColor: selectedSongs.includes(song.id) ? '#f0f8ff' : 'white'
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedSongs.includes(song.id)}
                                    onChange={() => toggleSelection(song.id)}
                                />

                                {song.coverImage ? (
                                    <img
                                        src={song.coverImage}
                                        alt="Cover"
                                        style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '4px',
                                            objectFit: 'cover'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        backgroundColor: '#ddd',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        🎵
                                    </div>
                                )}

                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{song.title}</div>
                                    {!song.hasAudio && (
                                        <small style={{ color: '#dc3545' }}>⚠️ Sin audio</small>
                                    )}
                                </div>

                                <div>{song.artist}</div>

                                <div style={{ color: '#666' }}>{song.album || '-'}</div>

                                <div style={{ color: '#666' }}>
                                    {Math.floor(song.duration / 60)}:{String(Math.floor(song.duration % 60)).padStart(2, '0')}
                                </div>

                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button
                                        onClick={() => setPreviewingSong(song)}
                                        disabled={!song.hasAudio}
                                        style={{
                                            padding: '5px 10px',
                                            backgroundColor: song.hasAudio ? '#0066cc' : '#ccc',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: song.hasAudio ? 'pointer' : 'not-allowed',
                                            fontSize: '12px'
                                        }}
                                        title="Previsualizar"
                                    >
                                        ▶️
                                    </button>

                                    <button
                                        onClick={() => setEditingSong(song)}
                                        style={{
                                            padding: '5px 10px',
                                            backgroundColor: '#ffc107',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                        title="Editar"
                                    >
                                        ✏️
                                    </button>

                                    <button
                                        onClick={() => handleDeleteSong(song.id)}
                                        style={{
                                            padding: '5px 10px',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                        title="Eliminar"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '60px',
                    color: '#999',
                    border: '2px dashed #ddd',
                    borderRadius: '8px'
                }}>
                    {searchQuery ? (
                        <>
                            <p style={{ fontSize: '48px', margin: '0 0 10px 0' }}>🔍</p>
                            <p>No se encontraron canciones con "{searchQuery}"</p>
                        </>
                    ) : (
                        <>
                            <p style={{ fontSize: '48px', margin: '0 0 10px 0' }}>🎵</p>
                            <p>No hay canciones en la biblioteca</p>
                            <p style={{ fontSize: '14px', marginTop: '10px' }}>
                                Importa una playlist o añade canciones manualmente
                            </p>
                        </>
                    )}
                </div>
            )}

            {/* Diálogos */}
            {showImportDialog && (
                <ImportDialog
                    onImportComplete={handleImportComplete}
                    onClose={() => setShowImportDialog(false)}
                />
            )}

            {showAddDialog && (
                <AddSongDialog
                    onSave={handleAddSong}
                    onClose={() => setShowAddDialog(false)}
                />
            )}

            {editingSong && (
                <EditSongDialog
                    song={editingSong}
                    onSave={handleEditSong}
                    onClose={() => setEditingSong(null)}
                />
            )}

            {previewingSong && (
                <AudioPreview
                    song={previewingSong}
                    onClose={() => setPreviewingSong(null)}
                />
            )}
        </div>
    )
}

export default LibraryView