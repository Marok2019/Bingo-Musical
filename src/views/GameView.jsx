import { useState, useEffect, useRef } from 'react'
import Database from '../core/Database'
import { formatSongForBingo } from '../utils/songFormatter'
import { useBingo } from '../core/BingoContext'
import loadingImage from '../assets/loading-screen.png' // 🔥 Importar tu imagen

function GameView() {
    const {
        historialCanciones,
        agregarCancion,
        totalCanciones,
        ultimaCancion,
        limpiarTodo,
        cartones
    } = useBingo()

    const [songs, setSongs] = useState([])
    const [currentSong, setCurrentSong] = useState(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [volume, setVolume] = useState(70)
    const [gameStarted, setGameStarted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showLoadingScreen, setShowLoadingScreen] = useState(false)
    const [loadingCountdown, setLoadingCountdown] = useState(15)
    const playerRef = useRef(null)
    const apiReadyRef = useRef(false)
    const loadingTimerRef = useRef(null)

    // Cargar canciones al montar
    useEffect(() => {
        loadSongs()
        loadYouTubeAPI()

        return () => {
            if (playerRef.current) {
                try {
                    playerRef.current.destroy()
                } catch (e) {
                    console.log('Error destroying player:', e)
                }
            }
            if (loadingTimerRef.current) {
                clearInterval(loadingTimerRef.current)
            }
        }
    }, [])

    useEffect(() => {
        console.log('📜 Historial actualizado:', historialCanciones.length, 'canciones')
    }, [historialCanciones])

    function loadYouTubeAPI() {
        if (window.YT && window.YT.Player) {
            apiReadyRef.current = true
            return
        }

        if (window.YT) {
            window.onYouTubeIframeAPIReady = () => {
                apiReadyRef.current = true
            }
            return
        }

        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

        window.onYouTubeIframeAPIReady = () => {
            apiReadyRef.current = true
            console.log('✅ YouTube API Ready')
        }
    }

    function loadSongs() {
        const allSongs = Database.findAll()
        const songsWithAudio = allSongs.filter(s => s.hasAudio)
        setSongs(songsWithAudio)
        console.log('Canciones cargadas:', songsWithAudio.length)
    }

    function getRandomSong() {
        const playedIds = historialCanciones.map(c => c.id || c.videoId)
        const unplayedSongs = songs.filter(s => !playedIds.includes(s.id))

        if (unplayedSongs.length === 0) {
            alert('🎉 ¡Todas las canciones han sido reproducidas!')
            return null
        }

        const randomIndex = Math.floor(Math.random() * unplayedSongs.length)
        return unplayedSongs[randomIndex]
    }

    async function handlePlayNext() {
        if (!apiReadyRef.current) {
            alert('⏳ Esperando que cargue YouTube API...')
            return
        }

        if (!gameStarted) {
            setGameStarted(true)
        }

        const nextSong = getRandomSong()

        if (!nextSong) {
            return
        }

        setIsLoading(true)

        if (playerRef.current) {
            try {
                playerRef.current.destroy()
            } catch (e) {
                console.log('Error destroying previous player:', e)
            }
            playerRef.current = null
        }

        agregarCancion(nextSong)
        setCurrentSong(nextSong)

        console.log('🎵 Reproduciendo:', nextSong.title)

        // 🔥 MOSTRAR PANTALLA DE CARGA CON IMAGEN
        setShowLoadingScreen(true)
        setLoadingCountdown(15)

        let countdown = 15
        loadingTimerRef.current = setInterval(() => {
            countdown--
            setLoadingCountdown(countdown)

            if (countdown <= 0) {
                clearInterval(loadingTimerRef.current)
                setShowLoadingScreen(false)
            }
        }, 1000)

        setTimeout(() => {
            initPlayer(nextSong)
        }, 100)
    }

    function initPlayer(song) {
        try {
            let container = document.getElementById('game-youtube-player')
            if (!container) {
                container = document.createElement('div')
                container.id = 'game-youtube-player'
                container.style.display = 'none'
                document.body.appendChild(container)
            }

            playerRef.current = new window.YT.Player('game-youtube-player', {
                height: '0',
                width: '0',
                videoId: song.youtubeId,
                playerVars: {
                    autoplay: 1,
                    start: Math.floor(song.cueIn),
                    end: Math.floor(song.cueOut),
                    controls: 0
                },
                events: {
                    onReady: (event) => {
                        console.log('✅ Player ready')
                        setIsLoading(false)
                        event.target.setVolume(volume)
                        event.target.playVideo()
                        setIsPlaying(true)
                    },
                    onStateChange: (event) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            console.log('🏁 Canción terminada')
                            setIsPlaying(false)
                            setCurrentSong(null)

                            if (loadingTimerRef.current) {
                                clearInterval(loadingTimerRef.current)
                            }
                            setShowLoadingScreen(false)
                        } else if (event.data === window.YT.PlayerState.PLAYING) {
                            setIsPlaying(true)
                        } else if (event.data === window.YT.PlayerState.PAUSED) {
                            setIsPlaying(false)
                        }
                    },
                    onError: (event) => {
                        console.error('❌ Player error:', event.data)
                        setIsLoading(false)
                        setIsPlaying(false)
                        setShowLoadingScreen(false)
                        if (loadingTimerRef.current) {
                            clearInterval(loadingTimerRef.current)
                        }
                        alert('❌ Error al reproducir la canción')
                    }
                }
            })
        } catch (error) {
            console.error('Error creating player:', error)
            setIsLoading(false)
            setShowLoadingScreen(false)
            if (loadingTimerRef.current) {
                clearInterval(loadingTimerRef.current)
            }
            alert('❌ Error al inicializar el reproductor')
        }
    }

    function handlePause() {
        if (playerRef.current && playerRef.current.pauseVideo) {
            playerRef.current.pauseVideo()
        }
    }

    function handleResume() {
        if (playerRef.current && playerRef.current.playVideo) {
            playerRef.current.playVideo()
        }
    }

    function handleStop() {
        if (playerRef.current) {
            try {
                playerRef.current.stopVideo()
                playerRef.current.destroy()
            } catch (e) {
                console.log('Error stopping player:', e)
            }
            playerRef.current = null
        }
        setCurrentSong(null)
        setIsPlaying(false)
        setShowLoadingScreen(false)
        if (loadingTimerRef.current) {
            clearInterval(loadingTimerRef.current)
        }
    }

    function handleRepeat() {
        if (!currentSong || !playerRef.current) return

        console.log('🔁 Repitiendo canción:', currentSong.title)

        try {
            playerRef.current.seekTo(currentSong.cueIn)
            playerRef.current.playVideo()
            setIsPlaying(true)
        } catch (error) {
            console.error('Error al repetir:', error)
            alert('❌ Error al repetir la canción')
        }
    }

    function handleVolumeChange(e) {
        const newVolume = parseInt(e.target.value)
        setVolume(newVolume)
        if (playerRef.current && playerRef.current.setVolume) {
            playerRef.current.setVolume(newVolume)
        }
    }

    function handleRestart() {
        if (confirm('¿Reiniciar el juego? Se limpiarán todos los cartones y el historial.')) {
            handleStop()
            limpiarTodo()
            setGameStarted(false)
            setCurrentSong(null)
        }
    }

    const formatted = currentSong ? formatSongForBingo(currentSong) : null
    const remainingSongs = songs.length - historialCanciones.length

    return (
        <div style={{
            padding: '20px',
            fontFamily: 'Arial, sans-serif',
            maxWidth: '1200px',
            margin: '0 auto',
            position: 'relative'
        }}>
            {/* 🔥 PANTALLA DE CARGA CON TU IMAGEN PERSONALIZADA */}
            {/* 🔥 PANTALLA DE CARGA CON TU IMAGEN PERSONALIZADA */}
            {showLoadingScreen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundImage: `url(${loadingImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    animation: 'fadeIn 0.3s ease-in'
                }}>
                    {/* Overlay oscuro opcional */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        zIndex: 1
                    }} />

                    {/* 🔥 CONTADOR EN ESQUINA SUPERIOR IZQUIERDA */}
                    <div style={{
                        position: 'absolute',
                        top: '30px',
                        left: '30px',
                        zIndex: 2,
                        fontSize: '120px',
                        fontWeight: 'bold',
                        color: '#fff',
                        textShadow: '0 0 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(102, 126, 234, 0.8)',
                        animation: 'pulse 1s infinite',
                        lineHeight: 1
                    }}>
                        {loadingCountdown}
                    </div>

                    {/* Barra de progreso opcional (abajo) */}
                    <div style={{
                        position: 'absolute',
                        bottom: '50px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '600px',
                        height: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        zIndex: 2
                    }}>
                        <div style={{
                            height: '100%',
                            backgroundColor: '#667eea',
                            width: `${((15 - loadingCountdown) / 15) * 100}%`,
                            transition: 'width 1s linear',
                            boxShadow: '0 0 10px rgba(102, 126, 234, 0.8)'
                        }} />
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '10px' }}>🎮 Panel de Juego</h1>
                <p style={{ color: '#666', fontSize: '18px' }}>
                    {songs.length} canciones disponibles •
                    {remainingSongs} sin reproducir •
                    {cartones.length} cartones activos
                </p>
            </div>

            {/* Mensaje si no hay canciones */}
            {songs.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '60px',
                    color: '#999',
                    border: '2px dashed #ddd',
                    borderRadius: '8px',
                    marginBottom: '20px'
                }}>
                    <p style={{ fontSize: '48px', margin: '0 0 10px 0' }}>🎵</p>
                    <p>No hay canciones con audio disponibles</p>
                    <p style={{ fontSize: '14px', marginTop: '10px' }}>
                        Ve a la biblioteca e importa canciones primero
                    </p>
                </div>
            )}

            {songs.length > 0 && (
                <>
                    {/* Canción actual */}
                    <div style={{
                        backgroundColor: 'white',
                        border: '2px solid #ddd',
                        borderRadius: '12px',
                        padding: '30px',
                        marginBottom: '30px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        {isLoading ? (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '48px', marginBottom: '15px' }}>
                                    ⏳
                                </div>
                                <p style={{ fontSize: '18px', color: '#666' }}>
                                    Cargando canción...
                                </p>
                            </div>
                        ) : currentSong ? (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontSize: '48px',
                                    marginBottom: '15px',
                                    animation: isPlaying ? 'pulse 1.5s infinite' : 'none'
                                }}>
                                    {isPlaying ? '🎵' : '⏸️'}
                                </div>
                                <h2 style={{
                                    margin: '0 0 10px 0',
                                    fontSize: '28px',
                                    color: '#000'
                                }}>
                                    {formatted.title}
                                </h2>
                                <p style={{
                                    fontSize: '20px',
                                    color: '#666',
                                    margin: '0'
                                }}>
                                    {formatted.artist}
                                </p>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '48px', marginBottom: '15px' }}>
                                    🎲
                                </div>
                                <p style={{ fontSize: '18px', color: '#666' }}>
                                    {gameStarted ? 'Canción finalizada' : 'Presiona "Reproducir Siguiente" para comenzar'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Controles */}
                    <div style={{
                        backgroundColor: 'white',
                        border: '2px solid #ddd',
                        borderRadius: '12px',
                        padding: '25px',
                        marginBottom: '30px'
                    }}>
                        <h3 style={{ marginTop: '0', marginBottom: '20px' }}>🎮 Controles</h3>

                        <div style={{
                            display: 'flex',
                            gap: '10px',
                            flexWrap: 'wrap',
                            marginBottom: '20px'
                        }}>
                            <button
                                onClick={handlePlayNext}
                                disabled={remainingSongs === 0 || isLoading || showLoadingScreen}
                                style={{
                                    padding: '15px 30px',
                                    backgroundColor: (remainingSongs > 0 && !isLoading && !showLoadingScreen) ? '#1DB954' : '#ccc',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: (remainingSongs > 0 && !isLoading && !showLoadingScreen) ? 'pointer' : 'not-allowed',
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    flex: '1',
                                    minWidth: '200px'
                                }}
                            >
                                {isLoading ? '⏳ Cargando...' : showLoadingScreen ? '⏳ En pantalla...' : '⏭️ Reproducir Siguiente'}
                            </button>

                            {currentSong && !isLoading && !showLoadingScreen && (
                                <>
                                    {isPlaying ? (
                                        <button
                                            onClick={handlePause}
                                            style={{
                                                padding: '15px 30px',
                                                backgroundColor: '#ffc107',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                fontSize: '16px'
                                            }}
                                        >
                                            ⏸️ Pausar
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleResume}
                                            style={{
                                                padding: '15px 30px',
                                                backgroundColor: '#0066cc',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                fontSize: '16px'
                                            }}
                                        >
                                            ▶️ Reanudar
                                        </button>
                                    )}

                                    <button
                                        onClick={handleRepeat}
                                        style={{
                                            padding: '15px 30px',
                                            backgroundColor: '#17a2b8',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '16px'
                                        }}
                                    >
                                        🔁 Repetir
                                    </button>

                                    <button
                                        onClick={handleStop}
                                        style={{
                                            padding: '15px 30px',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '16px'
                                        }}
                                    >
                                        ⏹️ Detener
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Control de volumen */}
                        <div style={{ marginTop: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '10px',
                                fontWeight: 'bold'
                            }}>
                                🔊 Volumen: {volume}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={volume}
                                onChange={handleVolumeChange}
                                style={{
                                    width: '100%',
                                    height: '8px',
                                    cursor: 'pointer'
                                }}
                            />
                        </div>

                        {/* Botón reiniciar */}
                        {gameStarted && (
                            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                <button
                                    onClick={handleRestart}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    🔄 Reiniciar Juego Completo
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Historial */}
                    {historialCanciones.length > 0 && (
                        <div style={{
                            backgroundColor: 'white',
                            border: '2px solid #ddd',
                            borderRadius: '12px',
                            padding: '25px'
                        }}>
                            <h3 style={{ marginTop: '0', marginBottom: '15px' }}>
                                📜 Historial ({totalCanciones})
                            </h3>
                            <div style={{
                                maxHeight: '300px',
                                overflowY: 'auto',
                                display: 'grid',
                                gap: '10px'
                            }}>
                                {historialCanciones.map((cancion, index) => {
                                    const fmt = formatSongForBingo(cancion)

                                    return (
                                        <div
                                            key={`${cancion.id || cancion.videoId}-${index}`}
                                            style={{
                                                padding: '12px',
                                                backgroundColor: '#f8f9fa',
                                                borderRadius: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px'
                                            }}
                                        >
                                            <div style={{
                                                width: '30px',
                                                height: '30px',
                                                backgroundColor: '#0066cc',
                                                color: 'white',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 'bold',
                                                fontSize: '12px'
                                            }}>
                                                {cancion.orden || (index + 1)}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 'bold' }}>
                                                    {fmt.title}
                                                </div>
                                                <div style={{ fontSize: '14px', color: '#666' }}>
                                                    {fmt.artist}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#999' }}>
                                                {new Date(cancion.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* CSS para animaciones */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    )
}

export default GameView