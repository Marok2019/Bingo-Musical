/**
 * Limpia el título de una canción removiendo texto innecesario
 * @param {string} title - Título original de la canción
 * @returns {string} - Título limpio
 */
export function cleanSongTitle(title) {
    if (!title) return '';

    let cleaned = title;

    // Remover contenido entre paréntesis y corchetes
    cleaned = cleaned.replace(/[\(\[][^\)\]]*[\)\]]/g, '');

    // Remover palabras específicas en inglés (case insensitive)
    const removePatterns = [
        /official\s*music\s*video/gi,
        /official\s*video/gi,
        /official\s*audio/gi,
        /lyric\s*video/gi,
        /official\s*lyric\s*video/gi,
        /music\s*video/gi,
        /visualizer/gi,
        /\bofficial\b/gi,
        /\bvideo\b/gi,
        /\baudio\b/gi,
        /\blyrics?\b/gi,
        /\bremix\b/gi,
        /\bremastered\b/gi,
        /\blive\b/gi,
        /\bperformance\b/gi,
        /\bfeat\.?\b/gi,
        /\bft\.?\b/gi,
    ];

    // Remover palabras específicas en español (case insensitive)
    const removeSpanishPatterns = [
        /v[íi]deo\s*oficial/gi,
        /audio\s*oficial/gi,
        /letra\s*oficial/gi,
        /con\s*letra/gi,
        /\boficial\b/gi,
        /\bv[íi]deo\b/gi,
        /\baudio\b/gi,
        /\bletra\b/gi,
        /\bletras\b/gi,
        /\ben\s*vivo\b/gi,
        /\bpresentaci[óo]n\b/gi,
        /\bpart\.?\s*\d+\b/gi,
    ];

    // Aplicar patrones en inglés
    removePatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
    });

    // Aplicar patrones en español
    removeSpanishPatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
    });

    // Limpiar espacios múltiples
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Remover guiones y espacios al inicio y final
    cleaned = cleaned.replace(/^[\s\-\|]+|[\s\-\|]+$/g, '');

    // Remover pipes (|) solos
    cleaned = cleaned.replace(/\s*\|\s*/g, ' ');

    return cleaned.trim();
}

/**
 * Formatea una canción para mostrar en el cartón de bingo
 * @param {Object} song - Objeto canción con title y artist
 * @returns {Object} - Objeto con title y artist formateados
 */
export function formatSongForBingo(song) {
    if (!song) return { title: '', artist: '' };

    let title = song.title || '';
    let artist = song.artist || '';

    // Si el título contiene el artista con guión, separar
    if (title.includes(' - ')) {
        const parts = title.split(' - ');
        // Solo tomar como artista si no está vacío y es el primer elemento
        if (parts[0].trim() && !artist) {
            artist = parts[0].trim();
            title = parts.slice(1).join(' - ').trim();
        }
    }

    // Limpiar el título
    const cleanedTitle = cleanSongTitle(title);

    // Si después de limpiar no queda nada o es muy corto, usar el título original
    if (!cleanedTitle.trim() || cleanedTitle.length < 3) {
        title = song.title;
    } else {
        title = cleanedTitle;
    }

    // Truncar si es muy largo (para que quepa en el cartón)
    const maxTitleLength = 60;
    const maxArtistLength = 40;

    if (title.length > maxTitleLength) {
        title = title.substring(0, maxTitleLength - 3) + '...';
    }

    if (artist.length > maxArtistLength) {
        artist = artist.substring(0, maxArtistLength - 3) + '...';
    }

    return {
        title: title,
        artist: artist
    };
}

/**
 * Obtiene el título limpio de una canción
 * @param {Object} song - Objeto canción
 * @returns {string} - Título limpio
 */
export function getCleanTitle(song) {
    const formatted = formatSongForBingo(song);
    return formatted.title;
}

/**
 * Obtiene el artista limpio de una canción
 * @param {Object} song - Objeto canción
 * @returns {string} - Artista limpio
 */
export function getCleanArtist(song) {
    const formatted = formatSongForBingo(song);
    return formatted.artist;
}
