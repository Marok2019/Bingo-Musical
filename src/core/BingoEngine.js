import BingoCard from '../models/BingoCard'
import Database from './Database'
import { formatSongForBingo } from '../utils/songFormatter'

class BingoEngine {
  // Generar un seed aleatorio reproducible
  generateSeed() {
    return Math.random().toString(36).substring(2, 15)
  }

  // Random seeded (para reproducibilidad)
  seededRandom(seed, index) {
    const x = Math.sin(seed.charCodeAt(index % seed.length) + index) * 10000
    return x - Math.floor(x)
  }

  // Barajar array con seed
  shuffleWithSeed(array, seed) {
    const shuffled = [...array]

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.seededRandom(seed, i) * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    return shuffled
  }

  // Generar un cartón
  generateCard(songs, options = {}) {
    const {
      seed = this.generateSeed(),
      preventDuplicateArtist = false
    } = options

    if (songs.length < 24) {
      throw new Error('Se necesitan al menos 24 canciones (25 casillas - 1 espacio libre)')
    }

    // Barajar canciones con el seed
    const shuffled = this.shuffleWithSeed(songs, seed)

    // Crear grid 5x5
    const grid = []
    let songIndex = 0

    for (let row = 0; row < 5; row++) {
      const rowData = []

      for (let col = 0; col < 5; col++) {
        // Espacio libre en el centro
        if (row === 2 && col === 2) {
          rowData.push('FREE')
          continue
        }

        // Obtener siguiente canción
        let song = shuffled[songIndex]

        // Validar duplicados de artista en la misma fila (opcional)
        if (preventDuplicateArtist) {
          const usedArtists = rowData
            .filter(id => id !== 'FREE')
            .map(id => songs.find(s => s.id === id)?.artist)
            .filter(Boolean)

          let attempts = 0
          while (usedArtists.includes(song.artist) && attempts < shuffled.length) {
            songIndex++
            song = shuffled[songIndex % shuffled.length]
            attempts++
          }
        }

        rowData.push(song.id)
        songIndex++
      }

      grid.push(rowData)
    }

    return new BingoCard({
      grid: grid,
      seed: seed
    })
  }

  // Generar múltiples cartones
  generateCards(songs, count, options = {}) {
    const cards = []

    for (let i = 0; i < count; i++) {
      const seed = options.baseSeed
        ? `${options.baseSeed}_${i}`
        : this.generateSeed()

      const card = this.generateCard(songs, { ...options, seed })
      cards.push(card)
    }

    return cards
  }

  // Exportar cartón a HTML (para vista previa e impresión)
  cardToHTML(card, songs) {
    const getSongById = (id) => {
      if (id === 'FREE') return null
      return songs.find(s => s.id === id)
    }

    let html = `
    <div style="
      width: 700px;
      border: 4px solid #000;
      border-radius: 12px;
      padding: 20px;
      background: white;
      font-family: 'Arial', sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      margin: 0 auto;
    ">
      <h2 style="
        text-align: center;
        color: #000;
        font-size: 36px;
        margin: 0 0 5px 0;
        font-weight: bold;
        letter-spacing: 2px;
      ">Bingo Musical</h2>
      
      <p style="
        text-align: center;
        color: #333;
        margin: 0 0 20px 0;
        font-size: 13px;
        font-style: italic;
      ">Marca las canciones que escuches. ¡Arma una línea para ganar!</p>
      
      <!-- Header BINGO -->
      <div style="
        display: grid; 
        grid-template-columns: repeat(5, 1fr); 
        gap: 8px; 
        margin-bottom: 8px;
      ">
  `

    const letters = ['B', 'I', 'N', 'G', 'O']
    letters.forEach(letter => {
      html += `
    <div style="
      background: white;
      text-align: center;
      padding: 12px;
      font-weight: bold;
      font-size: 32px;
      color: #000;
      border: 3px solid #000;
      border-radius: 6px;
    ">${letter}</div>
  `
    })

    html += `</div>`

    // Grid de canciones
    html += `<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;">`

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const songId = card.grid[row][col]

        if (songId === 'FREE') {
          html += `
          <div style="
            background: white;
            border: 3px solid #000;
            border-radius: 6px;
            padding: 15px 8px;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 110px;
          ">
            <div style="
              font-size: 36px; 
              margin-bottom: 5px;
            ">★</div>
            <div style="
              font-weight: bold; 
              font-size: 16px; 
              color: #000;
            ">GRATIS</div>
          </div>
        `
        } else {
          const song = getSongById(songId)
          // Formatear la canción para el cartón
          const formatted = song ? formatSongForBingo(song) : { title: 'Sin título', artist: 'Sin artista' }

          html += `
          <div style="
            background: white;
            border: 3px solid #000;
            border-radius: 6px;
            padding: 10px 6px;
            text-align: center;
            min-height: 110px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          ">
            <div style="
              font-size: 12px;
              font-weight: bold;
              line-height: 1.3;
              margin-bottom: 6px;
              color: #000;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
              word-wrap: break-word;
            ">${formatted.title}</div>
            <div style="
              font-size: 10px;
              color: #333;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
            ">${formatted.artist}</div>
          </div>
        `
        }
      }
    }

    html += `
      </div>
      
      <p style="
        text-align: center;
        color: #666;
        margin: 15px 0 0 0;
        font-size: 10px;
        font-family: monospace;
      ">ID: ${card.id.substring(0, 8)}</p>
    </div>
  `

    return html
  }

  // Exportar a PDF (usando html2pdf o similar)
  async exportToPDF(cards, songs) {
    let fullHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Cartones de Bingo Musical</title>
      <style>
        @page { 
          size: A4; 
          margin: 15mm; 
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body { 
          margin: 0; 
          padding: 0; 
          background: white;
          font-family: Arial, sans-serif;
        }
        
        .card-container { 
          page-break-inside: avoid;
          page-break-after: always;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .card-container:last-child {
          page-break-after: auto;
        }
        
        @media print {
          body {
            background: white;
          }
          
          .card-container { 
            page-break-after: always;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .card-container:last-child {
            page-break-after: auto;
          }
        }
      </style>
    </head>
    <body>
  `

    cards.forEach(card => {
      fullHTML += `<div class="card-container">${this.cardToHTML(card, songs)}</div>`
    })

    fullHTML += `</body></html>`

    return fullHTML
  }
}

export default new BingoEngine()