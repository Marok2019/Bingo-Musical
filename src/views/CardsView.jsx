import { useState, useEffect } from 'react'
import Database from '../core/Database'
import BingoEngine from '../core/BingoEngine'

function CardsView() {
    const [songs, setSongs] = useState([])
    const [cardCount, setCardCount] = useState(1)
    const [preventDuplicateArtist, setPreventDuplicateArtist] = useState(false)
    const [generatedCards, setGeneratedCards] = useState([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [selectedCard, setSelectedCard] = useState(0)

    useEffect(() => {
        const allSongs = Database.findAll()
        setSongs(allSongs)
    }, [])

    function handleGenerate() {
        if (songs.length < 24) {
            alert('Necesitas al menos 24 canciones en la biblioteca para generar cartones')
            return
        }

        setIsGenerating(true)

        setTimeout(() => {
            const cards = BingoEngine.generateCards(songs, cardCount, {
                preventDuplicateArtist: preventDuplicateArtist
            })

            setGeneratedCards(cards)
            setSelectedCard(0)
            setIsGenerating(false)
        }, 100)
    }

    function handlePrint() {
        const printWindow = window.open('', '_blank')

        BingoEngine.exportToPDF(generatedCards, songs).then(html => {
            printWindow.document.write(html)
            printWindow.document.close()

            setTimeout(() => {
                printWindow.print()
            }, 250)
        })
    }

    function handleDownloadHTML() {
        BingoEngine.exportToPDF(generatedCards, songs).then(html => {
            const blob = new Blob([html], { type: 'text/html' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `bingo-cards-${Date.now()}.html`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        })
    }

    const currentCard = generatedCards[selectedCard]

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{ marginBottom: '10px' }}>🎫 Generador de Cartones</h1>
            <p style={{ color: '#666', marginBottom: '30px' }}>
                Canciones disponibles: {songs.length} •
                Cartones generados: {generatedCards.length}
            </p>

            {/* Panel de configuración */}
            <div style={{
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '30px'
            }}>
                <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>⚙️ Configuración</h2>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: 'bold'
                    }}>
                        Cantidad de cartones:
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        value={cardCount}
                        onChange={(e) => setCardCount(parseInt(e.target.value))}
                        style={{ width: '300px', marginRight: '15px' }}
                    />
                    <span style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#667eea'
                    }}>
                        {cardCount}
                    </span>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={preventDuplicateArtist}
                            onChange={(e) => setPreventDuplicateArtist(e.target.checked)}
                            style={{ marginRight: '10px', width: '18px', height: '18px' }}
                        />
                        <span>Evitar artistas duplicados en la misma fila</span>
                    </label>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || songs.length < 24}
                    style={{
                        padding: '12px 30px',
                        backgroundColor: songs.length >= 24 ? '#667eea' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: songs.length >= 24 ? 'pointer' : 'not-allowed',
                        boxShadow: songs.length >= 24 ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
                    }}
                >
                    {isGenerating ? '⏳ Generando...' : '🎲 Generar Cartones'}
                </button>

                {songs.length < 24 && (
                    <p style={{
                        marginTop: '10px',
                        color: '#dc3545',
                        fontSize: '14px'
                    }}>
                        ⚠️ Necesitas al menos 24 canciones. Actualmente tienes {songs.length}.
                    </p>
                )}
            </div>

            {/* Vista previa de cartones */}
            {generatedCards.length > 0 && (
                <div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px'
                    }}>
                        <h2 style={{ fontSize: '20px', margin: 0 }}>👁️ Vista Previa</h2>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={handleDownloadHTML}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                💾 Descargar HTML
                            </button>

                            <button
                                onClick={handlePrint}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#0066cc',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                🖨️ Imprimir
                            </button>
                        </div>
                    </div>

                    {/* Navegación de cartones */}
                    {generatedCards.length > 1 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '15px',
                            marginBottom: '20px'
                        }}>
                            <button
                                onClick={() => setSelectedCard(Math.max(0, selectedCard - 1))}
                                disabled={selectedCard === 0}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: selectedCard === 0 ? '#ccc' : '#667eea',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: selectedCard === 0 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                ← Anterior
                            </button>

                            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                                Cartón {selectedCard + 1} de {generatedCards.length}
                            </span>

                            <button
                                onClick={() => setSelectedCard(Math.min(generatedCards.length - 1, selectedCard + 1))}
                                disabled={selectedCard === generatedCards.length - 1}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: selectedCard === generatedCards.length - 1 ? '#ccc' : '#667eea',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: selectedCard === generatedCards.length - 1 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Siguiente →
                            </button>
                        </div>
                    )}

                    {/* Cartón actual */}
                    {currentCard && (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: '600px',
                                padding: '40px',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '12px'
                            }}
                            dangerouslySetInnerHTML={{
                                __html: BingoEngine.cardToHTML(currentCard, songs)
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    )
}

export default CardsView