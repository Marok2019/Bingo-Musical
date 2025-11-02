import { useState } from 'react'
import LibraryView from './views/LibraryView'
import CardsView from './views/CardsView'
import GameView from './views/GameView'
import React from 'react';
import { BingoProvider } from './core/BingoContext';

function App() {
    const [currentView, setCurrentView] = useState('library')

    return (
        <BingoProvider>
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
                        onMouseEnter={(e) => {
                            if (currentView !== 'library') {
                                e.target.style.backgroundColor = '#34495e'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (currentView !== 'library') {
                                e.target.style.backgroundColor = 'transparent'
                            }
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
                        onMouseEnter={(e) => {
                            if (currentView !== 'cards') {
                                e.target.style.backgroundColor = '#34495e'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (currentView !== 'cards') {
                                e.target.style.backgroundColor = 'transparent'
                            }
                        }}
                    >
                        🎫 Cartones
                    </button>

                    <button
                        onClick={() => setCurrentView('game')}
                        style={{
                            padding: '12px',
                            backgroundColor: currentView === 'game' ? '#667eea' : 'transparent',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontWeight: currentView === 'game' ? 'bold' : 'normal',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (currentView !== 'game') {
                                e.target.style.backgroundColor = '#34495e'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (currentView !== 'game') {
                                e.target.style.backgroundColor = 'transparent'
                            }
                        }}
                    >
                        🎮 Juego
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
                    {currentView === 'game' && <GameView />}
                </div>
            </div>
        </BingoProvider>
    )
}

export default App