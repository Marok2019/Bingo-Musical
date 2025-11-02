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

  // Generar un cartón 3x5 (15 canciones)
  generateCard(songs, options = {}) {
    const {
      seed = this.generateSeed(),
      preventDuplicateArtist = false
    } = options

    if (songs.length < 15) {
      throw new Error('Se necesitan al menos 15 canciones para generar un cartón')
    }

    // Barajar canciones con el seed
    const shuffled = this.shuffleWithSeed(songs, seed)

    // Crear grid 3x5 (3 filas, 5 columnas)
    const grid = []
    const cancionesUsadas = []
    let songIndex = 0

    for (let row = 0; row < 3; row++) {
      const rowData = []

      for (let col = 0; col < 5; col++) {
        // Obtener siguiente canción
        let song = shuffled[songIndex]

        // Validar duplicados de artista en la misma fila (opcional)
        if (preventDuplicateArtist) {
          const usedArtists = rowData
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
        cancionesUsadas.push(song)
        songIndex++
      }

      grid.push(rowData)
    }

    return new BingoCard({
      grid: grid,
      canciones: cancionesUsadas,
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

  // Exportar cartón a HTML (landscape 3x5) - CON LOGO
  cardToHTML(card, songs = null) {
    const useSongs = songs || card.canciones || []

    const getSongById = (id) => {
      let song = useSongs.find(s => s.id === id)
      if (song) return song
      return Database.findById(id)
    }

    // Logo en base64 - convierte tu logo a base64 o usa URL
    const logoBase64 = 'data:image/jpeg;base64,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PPPAALFNALIAOAKABAGCJECHPPPPPPPPPPPAAAPAAAAAACFAMEBAAACNPPPPPPPPPPPHCHPGBBOADPLIBELJCEHBPPPPPPPPPPPPPPPPPPPPPPPPPPPAGJMNPPPPPPPPPPPPPPPPPPPPPPPPPPPLOFHPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP/aAAwDAQACAAMAAAAQ8888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888www84oAw8088888888888888888888gAEIA8oAAUwU8888888888888888888sgE0II4gIU8IMw8848884408888888888AAogc4cY0oAwA88EA844E8888888888soMwAco0A8AEYAAg8gMUow8888888888888oAockAMAUgAQEEIQssAcc88888888888oAEUoAEoAAMsAgAEAAAE888888888888sMU8cIsYAccssEIcMEIYcU88888888888888888888888888g8Eg0888888888888888888888888888sAE88888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888/8QAFBEBAAAAAAAAAAAAAAAAAAAAoP/aAAgBAgEBPwAAH//EABQRAQAAAAAAAAAAAAAAAAAAAKD/2gAIAQMBAT8AAB//xABFEAACAgADBAcGAgYIBQUAAAABAgMEAAUREBIhMQYTICJBUXEUIzJCUmFAoTNQYnKBwRUkNHORkrHRFjBEU6BDgqLh8P/aAAgBAQABPwL/AMXdnRPiYD1OPa6w/wCoi/zjCTxSfBKjejdskKNSdAPHFjP6kJ0TelP7PLH/ABNx/snD+8/+sQdIash0kV4vXiMI6yIHRgynxH6vs3IKi6zSBfIeJxa6Rk8K0en7T4lzG5P8dh/QHTsUs2s1GA3i8XirYilWeFZUPdYajsSypBE0kjbqrzOMxzSW8+nwwjkv+/YyzMXozjjrC3xL/PAII1HLY7rGhdyFUcycWOkmj6V4QV+p8ZXm/tzmJ03JANeHI/qnM87FcmGto0ni3gMSSvNIXkYsx8T2+j7lss0+lyOxnWYe1T9TGfdRn/E9rKnL5XXJ+nTZn1/rpvZUPu0+L7nZ0diLXnk8ET9UZ3mZrr7NCfeN8R+kdkAk6Aa4MbrzRh6jbkKbuVqfqYnbnF32Skd0+8k7q9oAswUDUnFSH2epFD9K8cZja9jpPL83JfXBOp1OzJavs2XqSO/J3j+p55lrwPK3JRriWVp5mlc6sx1PYyrJROgsWddw/CnniOGOFd2KNUH2GJpUhheR/hUanE8pnneUgDeOug2UY+poQJ5INducWvar7aHuJ3V2VKNi62kKagc2PIYk6PW0TVTG5+kHEkEsR0kjdT9xiKpYnOkcLt6DGVZN7KwnsaGXwX6dnSKzv2Vr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'
    // ☝️ Reemplaza esto con tu logo convertido a base64

    let html = `
    <div style="
      width: 1000px;
      border: 4px solid #000;
      borderRadius: 12px;
      padding: 25px;
      background: white;
      font-family: 'Arial', sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      margin: 0 auto;
    ">
      <!-- Header con Logo -->
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        margin-bottom: 10px;
      ">
        <img src="${logoBase64}" alt="Vibes for Fans" style="
          height: 150px;
          width: auto;
        "/>
        <h2 style="
          color: #000;
          font-size: 42px;
          margin: 0;
          font-weight: bold;
          letter-spacing: 3px;
        ">Bingo Musical</h2>
      </div>
      
      <p style="
        text-align: center;
        color: #333;
        margin: 0 0 25px 0;
        font-size: 15px;
        font-style: italic;
      ">Marca las canciones que escuches. ¡Llena el cartón para ganar!</p>
      
      <div style="
        display: grid; 
        grid-template-columns: repeat(5, 1fr); 
        gap: 12px;
      ">
  `

    // Generar las 15 celdas (3 filas x 5 columnas)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        const songId = card.grid[row][col]
        const song = getSongById(songId)
        const formatted = song ? formatSongForBingo(song) : { title: 'Sin título', artist: 'Sin artista' }

        html += `
          <div style="
            background: white;
            border: 3px solid #000;
            border-radius: 8px;
            padding: 15px 10px;
            text-align: center;
            min-height: 140px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            position: relative;
          ">
            <div style="
              font-size: 14px;
              font-weight: bold;
              line-height: 1.4;
              margin-bottom: 8px;
              color: #000;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
              word-wrap: break-word;
            ">${formatted.title}</div>
            <div style="
              font-size: 11px;
              color: #333;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              font-weight: 500;
            ">${formatted.artist}</div>
          </div>
        `
      }
    }

    html += `
      </div>
      
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 20px;
        padding-top: 15px;
        border-top: 2px solid #ddd;
      ">
        <p style="
          color: #666;
          margin: 0;
          font-size: 11px;
          font-family: monospace;
        ">ID: ${card.id.substring(0, 8)}</p>
        
        <p style="
          color: #666;
          margin: 0;
          font-size: 11px;
          font-style: italic;
        ">🎵 ¡Buena suerte!</p>
      </div>
    </div>
  `

    return html
  }

  // Exportar a PDF/HTML para impresión
  async exportToPDF(cards, songs = null) {
    let fullHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Cartones de Bingo Musical - Vibes for Fans</title>
      <style>
        @page { 
          size: A4 landscape;
          margin: 10mm;
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
          padding: 15px;
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