import { useState, useEffect, useRef } from 'react'

function AudioPreview({ song, onClose }) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(15)
    const playerRef = useRef(null)
    const intervalRef = useRef(null)

    useEffect(() => {
        // Cargar YouTube IFrame API
        if (!window.YT) {
            const tag = document.createElement('script')
            tag.src = 'https://www.youtube.com/iframe_api'
            document.body.appendChild(tag)

            window.onYouTubeIframeAPIReady = () => {
                initPlayer()
            }
        } else {
            initPlayer()
        }

        return () => {
            if (playerRef.current) {
                playerRef.current.destroy()
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [])

    function initPlayer() {
        const clipDuration = song.cueOut - song.cueIn
        setDuration(clipDuration)

        playerRef.current = new window.YT.Player('youtube-player', {
            height: '0',
            width: '0',
            videoId: song.youtubeId,
            playerVars: {
                autoplay: 1,
                start: Math.floor(song.cueIn),
                end: Math.floor(song.cueOut)
            },
            events: {
                onReady: (event) => {
                    event.target.playVideo()
                    setIsPlaying(true)
                    startProgressTracking()
                },
                onStateChange: (event) => {
                    if (event.data === window.YT.PlayerState.ENDED) {
                        setIsPlaying(false)
                        setCurrentTime(duration)
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current)
                        }
                    } else if (event.data === window.YT.PlayerState.PLAYING) {
                        setIsPlaying(true)
                        startProgressTracking()
                    } else if (event.data === window.YT.PlayerState.PAUSED) {
                        setIsPlaying(false)
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current)
                        }
                    }
                }
            }
        })
    }

    function startProgressTracking() {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }

        intervalRef.current = setInterval(() => {
            if (playerRef.current && playerRef.current.getCurrentTime) {
                const current = playerRef.current.getCurrentTime() - song.cueIn
                setCurrentTime(Math.max(0, Math.min(current, duration)))
            }
        }, 100)
    }

    function handlePlayPause() {
        if (!playerRef.current) return

        if (isPlaying) {
            playerRef.current.pauseVideo()
        } else {
            playerRef.current.playVideo()
        }
    }

    function handleReplay() {
        if (!playerRef.current) return
        playerRef.current.seekTo(song.cueIn)
        playerRef.current.playVideo()
        setCurrentTime(0)
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${String(secs).padStart(2, '0')}`
    }

    const progress = (currentTime / duration) * 100

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '40px',
                maxWidth: '500px',
                width: '90%',
                textAlign: 'center'
            }}>
                {/* Portada */}
                {song.coverImage && (
                    <img
                        src={song.coverImage}
                        alt="Cover"
                        style={{
                            width: '200px',
                            height: '200px',
                            borderRadius: '12px',
                            objectFit: 'cover',
                            marginBottom: '20px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                        }}
                    />
                )}

                {/* Info de la canción */}
                <h2 style={{ marginBottom: '5px', fontSize: '24px' }}>{song.title}</h2>
                <p style={{ color: '#666', marginBottom: '30px', fontSize: '18px' }}>{song.artist}</p>

                {/* Progreso */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{
                        height: '6px',
                        backgroundColor: '#eee',
                        borderRadius: '3px',
                        overflow: 'hidden',
                        marginBottom: '10px'
                    }}>
                        <div style={{
                            height: '100%',
                            backgroundColor: '#1DB954',
                            width: `${progress}%`,
                            transition: 'width 0.1s linear'
                        }} />
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '14px',
                        color: '#666'
                    }}>
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Controles */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '15px',
                    marginBottom: '20px'
                }}>
                    <button
                        onClick={handleReplay}
                        style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: '#f0f0f0',
                            cursor: 'pointer',
                            fontSize: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Repetir"
                    >
                        🔁
                    </button>

                    <button
                        onClick={handlePlayPause}
                        style={{
                            width: '70px',
                            height: '70px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: '#1DB954',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(29, 185, 84, 0.3)'
                        }}
                    >
                        {isPlaying ? '⏸' : '▶️'}
                    </button>
                </div>

                {/* Botón cerrar */}
                <button
                    onClick={onClose}
                    style={{
                        padding: '10px 30px',
                        border: '1px solid #ddd',
                        borderRadius: '25px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    Cerrar
                </button>

                {/* Player oculto */}
                <div id="youtube-player" style={{ display: 'none' }}></div>
            </div>
        </div>
    )
}

export default AudioPreview