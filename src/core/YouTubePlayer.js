// src/services/YouTubePlayer.js
import InvidiousAPI from './InvidiousAPI'

class YouTubePlayer {
    constructor() {
        this.currentAudio = null
    }

    async play(videoId, startTime = 0, duration = 15) {
        try {
            // Obtener URL de audio directo
            const audioData = await InvidiousAPI.getAudioUrl(videoId)

            // Crear elemento de audio
            if (this.currentAudio) {
                this.currentAudio.pause()
                this.currentAudio = null
            }

            this.currentAudio = new Audio(audioData.url)
            this.currentAudio.currentTime = startTime

            // Detener después de X segundos
            setTimeout(() => {
                if (this.currentAudio) {
                    this.currentAudio.pause()
                }
            }, duration * 1000)

            await this.currentAudio.play()

            return this.currentAudio

        } catch (error) {
            console.error('Error reproduciendo audio:', error)
            throw error
        }
    }

    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause()
            this.currentAudio = null
        }
    }
}

export default new YouTubePlayer()