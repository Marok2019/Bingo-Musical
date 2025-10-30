const EventEmitter = require('events');
const AudioPlayer = require('./AudioPlayer');
const InvidiousAPI = require('../services/InvidiousAPI');
const SpotifyAPI = require('../services/SpotifyAPI');

class BingoEngine extends EventEmitter {
  constructor() {
    super();
    this.songs = [];
    this.drawnSongs = [];
    this.currentSong = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.autoPlayEnabled = true;
    this.audioSource = 'invidious'; // 'invidious' o 'spotify'
  }

  loadSongs(songs) {
    this.songs = [...songs];
    this.drawnSongs = [];
    this.currentSong = null;
    this.emit('songsLoaded', this.songs.length);
  }

  setAudioSource(source) {
    if (['invidious', 'spotify'].includes(source)) {
      this.audioSource = source;
      this.emit('audioSourceChanged', source);
    }
  }

  async drawNextSong() {
    if (this.songs.length === 0) {
      this.emit('bingoFinished');
      return null;
    }

    const randomIndex = Math.floor(Math.random() * this.songs.length);
    const song = this.songs.splice(randomIndex, 1)[0];

    this.drawnSongs.push(song);
    this.currentSong = song;

    this.emit('songDrawn', {
      song,
      remaining: this.songs.length,
      drawn: this.drawnSongs.length
    });

    // Reproducir automáticamente si está habilitado
    if (this.autoPlayEnabled) {
      await this.playCurrentSong();
    }

    return song;
  }

  async playCurrentSong() {
    if (!this.currentSong) {
      console.warn('No hay canción actual para reproducir');
      return false;
    }

    try {
      this.isPlaying = true;
      this.isPaused = false;

      this.emit('playbackStarted', this.currentSong);

      let audioUrl;

      if (this.audioSource === 'invidious') {
        const audioData = await InvidiousAPI.getAudioUrl(
          this.currentSong.title,
          this.currentSong.artist
        );
        audioUrl = audioData?.url;
      } else if (this.audioSource === 'spotify') {
        const audioData = await SpotifyAPI.getPreviewUrl(
          this.currentSong.title,
          this.currentSong.artist
        );
        audioUrl = audioData?.url;
      }

      if (!audioUrl) {
        // Intentar con el otro servicio como respaldo
        console.warn(`No se pudo obtener audio de ${this.audioSource}, intentando respaldo...`);

        const backupSource = this.audioSource === 'invidious' ? 'spotify' : 'invidious';

        if (backupSource === 'spotify') {
          const audioData = await SpotifyAPI.getPreviewUrl(
            this.currentSong.title,
            this.currentSong.artist
          );
          audioUrl = audioData?.url;
        } else {
          const audioData = await InvidiousAPI.getAudioUrl(
            this.currentSong.title,
            this.currentSong.artist
          );
          audioUrl = audioData?.url;
        }
      }

      if (!audioUrl) {
        throw new Error('No se pudo obtener URL de audio de ninguna fuente');
      }

      const success = await AudioPlayer.play({
        ...this.currentSong,
        audioUrl
      });

      if (!success) {
        throw new Error('Falló la reproducción');
      }

      // Monitorear fin de reproducción
      setTimeout(() => {
        this.isPlaying = false;
        this.emit('playbackEnded', this.currentSong);
      }, AudioPlayer.getDuration() * 1000);

      return true;
    } catch (error) {
      console.error('Error reproduciendo canción:', error);
      this.isPlaying = false;
      this.emit('playbackError', { song: this.currentSong, error: error.message });
      return false;
    }
  }

  pausePlayback() {
    if (this.isPlaying && !this.isPaused) {
      AudioPlayer.pause();
      this.isPaused = true;
      this.emit('playbackPaused');
    }
  }

  resumePlayback() {
    if (this.isPlaying && this.isPaused) {
      AudioPlayer.resume();
      this.isPaused = false;
      this.emit('playbackResumed');
    }
  }

  stopPlayback() {
    AudioPlayer.stop();
    this.isPlaying = false;
    this.isPaused = false;
    this.emit('playbackStopped');
  }

  setAutoPlay(enabled) {
    this.autoPlayEnabled = enabled;
    this.emit('autoPlayChanged', enabled);
  }

  reset() {
    this.stopPlayback();
    this.songs = [];
    this.drawnSongs = [];
    this.currentSong = null;
    this.emit('reset');
  }

  getState() {
    return {
      totalSongs: this.songs.length + this.drawnSongs.length,
      remainingSongs: this.songs.length,
      drawnSongs: this.drawnSongs.length,
      currentSong: this.currentSong,
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      autoPlayEnabled: this.autoPlayEnabled,
      audioSource: this.audioSource
    };
  }
}

module.exports = new BingoEngine();