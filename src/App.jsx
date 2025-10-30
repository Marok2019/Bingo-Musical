import { useState } from 'react'
import LibraryView from './views/LibraryView'
import CardsView from './views/CardsView'

function App() {
    const [currentView, setCurrentView] = useState('library')

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            {/* Sidebar */}
            <div style={{
                width: '200px',
                backgroundColor: '#2c3e50',
                color: 'white',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                <h2 style={{
                    fontSize: '18px',
                    marginBottom: '20px',
                    textAlign: 'center'
                }}>
                    🎵 Bingo Musical
                </h2>

                <button
                    onClick={() => setCurrentView('library')}
                    style={{
                        padding: '12px',
                        backgroundColor: currentView === 'library' ? '#667eea' : 'transparent',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: currentView === 'library' ? 'bold' : 'normal',
                        transition: 'all 0.2s'
                    }}
                >
                    📚 Biblioteca
                </button>

                <button
                    onClick={() => setCurrentView('cards')}
                    style={{
                        padding: '12px',
                        backgroundColor: currentView === 'cards' ? '#667eea' : 'transparent',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: currentView === 'cards' ? 'bold' : 'normal',
                        transition: 'all 0.2s'
                    }}
                >
                    🎫 Cartones
                </button>

                <button
                    onClick={() => setCurrentView('game')}
                    disabled
                    style={{
                        padding: '12px',
                        backgroundColor: 'transparent',
                        color: '#7f8c8d',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'not-allowed',
                        textAlign: 'left',
                        opacity: 0.5
                    }}
                >
                    🎮 Juego (próximamente)
                </button>
            </div>

            {/* Contenido principal */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                backgroundColor: '#f5f5f5'
            }}>
                {currentView === 'library' && <LibraryView />}
                {currentView === 'cards' && <CardsView />}
            </div>
        </div>
    )
}

export default App