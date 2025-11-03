// src/hooks/useYouTubePlayer.js
import { useCallback, useEffect, useState } from 'react';

export const useYouTubePlayer = () => {
    const [player, setPlayer] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        // Obtener referencia al player global
        const interval = setInterval(() => {
            if (window.currentYouTubePlayer) {
                setPlayer(window.currentYouTubePlayer);
                clearInterval(interval);
            }
        }, 100);

        return () => clearInterval(interval);
    }, []);

    // Actualizar estado cada segundo
    useEffect(() => {
        if (!player) return;

        const interval = setInterval(() => {
            try {
                if (player.getCurrentTime) {
                    setCurrentTime(player.getCurrentTime());
                }
                if (player.getDuration) {
                    setDuration(player.getDuration());
                }
                if (player.getPlayerState) {
                    const state = player.getPlayerState();
                    setIsPlaying(state === 1); // 1 = PLAYING
                }
            } catch (e) {
                // Player no está listo todavía
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [player]);

    const play = useCallback(() => {
        if (player?.playVideo) {
            player.playVideo();
        }
    }, [player]);

    const pause = useCallback(() => {
        if (player?.pauseVideo) {
            player.pauseVideo();
        }
    }, [player]);

    const stop = useCallback(() => {
        if (player?.stopVideo) {
            player.stopVideo();
        }
    }, [player]);

    const seekTo = useCallback((seconds) => {
        if (player?.seekTo) {
            player.seekTo(seconds, true);
        }
    }, [player]);

    const setVolume = useCallback((volume) => {
        if (player?.setVolume) {
            player.setVolume(volume);
        }
    }, [player]);

    const getVolume = useCallback(() => {
        if (player?.getVolume) {
            return player.getVolume();
        }
        return 100;
    }, [player]);

    return {
        player,
        isPlaying,
        currentTime,
        duration,
        play,
        pause,
        stop,
        seekTo,
        setVolume,
        getVolume
    };
};