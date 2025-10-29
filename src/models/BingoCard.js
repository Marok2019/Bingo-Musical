import { v4 as uuidv4 } from 'uuid'

class BingoCard {
    constructor(data = {}) {
        this.id = data.id || uuidv4()
        this.grid = data.grid || [] // Array 5x5 de songIds
        this.createdAt = data.createdAt || new Date().toISOString()
        this.seed = data.seed || null
    }

    // Obtener canción en una posición específica
    getSongAt(row, col) {
        if (row < 0 || row >= 5 || col < 0 || col >= 5) {
            return null
        }
        return this.grid[row][col]
    }

    // Verificar si es el espacio libre (centro)
    isFreeSpace(row, col) {
        return row === 2 && col === 2
    }

    // Convertir a formato JSON
    toJSON() {
        return {
            id: this.id,
            grid: this.grid,
            createdAt: this.createdAt,
            seed: this.seed
        }
    }

    // Crear desde JSON
    static fromJSON(data) {
        return new BingoCard(data)
    }
}

export default BingoCard