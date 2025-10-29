class YouTubePlayer {
    constructor() {
        this.player = null
        this.isReady = false
        this.onClipEndCallback = null
        this.containerId = 'youtube-player'
    }

    // Inicializar API de YouTube
    async initialize() {
        return new Promise((resolve, reject) => {
            // Crear contenedor oculto para el player
            if (!document.getElementById(this.containerId)) {
                const container = document.createElement('div')
                container.id = this.containerId
                container.style.display = 'none'
                document.body.appendChild(container)
            }

            // Verificar si ya está cargada
            if (window.YT && window.YT.Player) {
                this.createPlayer(resolve, reject)
                return
            }

            // Cargar API de YouTube
            const tag = document.createElement('script')
            tag.src = 'https://www.youtube.com/iframe_api'
            const firstScriptTag = document.getElementsByTagName('script')[0]
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

            // Callback cuando la API esté lista
            window.onYouTubeIframeAPIReady = () => {
                this.createPlayer(resolve, reject)
            }

            // Timeout de 10 segundos
            setTimeout(() => {
                if (!this.isReady) {
                    reject(new Error('Timeout cargando YouTube API'))
                }
            }, 10000)
        })
    }

    createPlayer(resolve, reject) {
        try {
            this.player = new window.YT.Player(this.containerId, {
                height: '0',
                width: '0',
                videoId: '',
                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    modestbranding: 1,
                    playsinline: 1
                },
                events: {
                    onReady: () => {
                        console.log('✅ YouTube Player listo')
                        this.isReady = true
                        resolve()
                    },
                    onStateChange: (event) => this.onPlayerStateChange(event),
                    onError: (event) => {
                        console.error('Error en YouTube Player:', event.data)
                        if (reject) {
                            reject(new Error(`YouTube Player error: ${event.data}`))
                        }
                    }
                }
            })
        } catch (error) {
            console.error('Error creando player:', error)
            reject(error)
        }
    }

    onPlayerStateChange(event) {
        // YT.PlayerState.ENDED = 0
        if (event.data === 0) {
            console.log('🎵 Fragmento terminado')
            if (this.onClipEndCallback) {
                this.onClipEndCallback()
            }
        }
    }

    // Reproducir fragmento específico
    async playClip(videoId, startSeconds, durationSeconds) {
        if (!this.isReady) {
            throw new Error('Player no está listo')
        }

        console.log(`▶️ Reproduciendo: ${videoId} desde ${startSeconds}s por ${durationSeconds}s`)

        // Cargar y reproducir video
        this.player.loadVideoById({
            videoId: videoId,
            startSeconds: startSeconds,
            endSeconds: startSeconds + durationSeconds
        })
    }

    play() {
        if (this.player && this.isReady) {
            this.player.playVideo()
        }
    }

    pause() {
        if (this.player && this.isReady) {
            this.player.pauseVideo()
        }
    }

    stop() {
        if (this.player && this.isReady) {
            this.player.stopVideo()
        }
    }

    setVolume(volume) {
        if (this.player && this.isReady) {
            // Volume: 0-100
            this.player.setVolume(volume * 100)
        }
    }

    getCurrentTime() {
        if (this.player && this.isReady) {
            return this.player.getCurrentTime()
        }
        return 0
    }

    getPlayerState() {
        if (this.player && this.isReady) {
            return this.player.getPlayerState()
            // -1: sin iniciar
            // 0: finalizado
            // 1: reproduciendo
            // 2: pausado
            // 3: buffering
            // 5: video en cola
        }
        return -1
    }

    onClipEnd(callback) {
        this.onClipEndCallback = callback
    }

    destroy() {
        if (this.player) {
            this.player.destroy()
            this.player = null
            this.isReady = false
        }
    }
}

export default YouTubePlayer