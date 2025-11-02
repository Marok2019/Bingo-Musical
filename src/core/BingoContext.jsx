// src/core/BingoContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';

const BingoContext = createContext();

export const BingoProvider = ({ children }) => {
    // Cargar datos guardados al iniciar
    const [cartones, setCartones] = useState(() => {
        try {
            const saved = localStorage.getItem('bingo_cartones');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error cargando cartones:', error);
            return [];
        }
    });

    const [historialCanciones, setHistorialCanciones] = useState(() => {
        try {
            const saved = localStorage.getItem('bingo_historial');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error cargando historial:', error);
            return [];
        }
    });

    const [juegoActivo, setJuegoActivo] = useState(() => {
        return localStorage.getItem('bingo_juego_activo') === 'true';
    });

    // Persistir cartones cuando cambien
    useEffect(() => {
        try {
            localStorage.setItem('bingo_cartones', JSON.stringify(cartones));
        } catch (error) {
            console.error('Error guardando cartones:', error);
        }
    }, [cartones]);

    // Persistir historial cuando cambie
    useEffect(() => {
        try {
            localStorage.setItem('bingo_historial', JSON.stringify(historialCanciones));
        } catch (error) {
            console.error('Error guardando historial:', error);
        }
    }, [historialCanciones]);

    // Persistir estado del juego
    useEffect(() => {
        localStorage.setItem('bingo_juego_activo', juegoActivo.toString());
    }, [juegoActivo]);

    // Agregar cartón
    const agregarCarton = (carton) => {
        const cartonConMetadata = {
            ...carton,
            id: carton.id || `CARTON-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            fechaCreacion: new Date().toISOString(),
            marcadas: [] // Array de IDs de canciones marcadas
        };
        setCartones(prev => [...prev, cartonConMetadata]);
        return cartonConMetadata.id;
    };

    // Eliminar cartón
    const eliminarCarton = (cartonId) => {
        setCartones(prev => prev.filter(c => c.id !== cartonId));
    };

    // Actualizar cartón
    const actualizarCarton = (cartonId, datosActualizados) => {
        setCartones(prev => prev.map(c =>
            c.id === cartonId ? { ...c, ...datosActualizados } : c
        ));
    };

    // Agregar canción al historial
    const agregarCancion = (cancion) => {
        const cancionConMetadata = {
            ...cancion,
            timestamp: new Date().toISOString(),
            orden: historialCanciones.length + 1
        };
        setHistorialCanciones(prev => [...prev, cancionConMetadata]);
        return cancionConMetadata;
    };

    // Marcar canción en un cartón
    const marcarCancion = (cartonId, cancionId) => {
        setCartones(prev => prev.map(carton => {
            if (carton.id === cartonId) {
                const marcadas = carton.marcadas || [];
                if (!marcadas.includes(cancionId)) {
                    return {
                        ...carton,
                        marcadas: [...marcadas, cancionId]
                    };
                }
            }
            return carton;
        }));
    };

    // Verificar si un cartón es ganador
    const verificarGanador = (cartonId, tipoVictoria = 'carton_lleno') => {
        const carton = cartones.find(c => c.id === cartonId);
        if (!carton) return { esGanador: false, mensaje: 'Cartón no encontrado' };

        const cancionesCarton = carton.songs || carton.canciones || [];
        const cancionesReproducidas = new Set(historialCanciones.map(c => c.id || c.videoId));

        switch (tipoVictoria) {
            case 'carton_lleno':
                const todosMarcados = cancionesCarton.every(cancion =>
                    cancionesReproducidas.has(cancion.id || cancion.videoId)
                );
                return {
                    esGanador: todosMarcados,
                    mensaje: todosMarcados ? '¡BINGO! Cartón completo' : 'Aún faltan canciones',
                    tipo: 'carton_lleno',
                    timestamp: new Date().toISOString()
                };

            case 'linea':
                // Implementar lógica de línea si tienes matriz
                return { esGanador: false, mensaje: 'Verificación de línea no implementada' };

            default:
                return { esGanador: false, mensaje: 'Tipo de victoria desconocido' };
        }
    };

    // Iniciar nuevo juego
    const iniciarNuevoJuego = () => {
        setHistorialCanciones([]);
        setCartones([]);
        setJuegoActivo(true);
    };

    // Finalizar juego
    const finalizarJuego = () => {
        setJuegoActivo(false);
    };

    // Limpiar todo
    const limpiarTodo = () => {
        setCartones([]);
        setHistorialCanciones([]);
        setJuegoActivo(false);
        localStorage.removeItem('bingo_cartones');
        localStorage.removeItem('bingo_historial');
        localStorage.removeItem('bingo_juego_activo');
    };

    // Exportar datos del juego
    const exportarDatos = () => {
        const datos = {
            cartones,
            historialCanciones,
            juegoActivo,
            fechaExportacion: new Date().toISOString()
        };
        return JSON.stringify(datos, null, 2);
    };

    // Importar datos del juego
    const importarDatos = (datosJSON) => {
        try {
            const datos = JSON.parse(datosJSON);
            setCartones(datos.cartones || []);
            setHistorialCanciones(datos.historialCanciones || []);
            setJuegoActivo(datos.juegoActivo || false);
            return { success: true, mensaje: 'Datos importados correctamente' };
        } catch (error) {
            console.error('Error importando datos:', error);
            return { success: false, mensaje: 'Error al importar datos' };
        }
    };

    const value = {
        // Estado
        cartones,
        historialCanciones,
        juegoActivo,

        // Métodos de cartones
        agregarCarton,
        eliminarCarton,
        actualizarCarton,

        // Métodos de canciones
        agregarCancion,
        marcarCancion,

        // Métodos de juego
        verificarGanador,
        iniciarNuevoJuego,
        finalizarJuego,
        limpiarTodo,

        // Métodos de exportación
        exportarDatos,
        importarDatos,

        // Getters útiles
        totalCartones: cartones.length,
        totalCanciones: historialCanciones.length,
        ultimaCancion: historialCanciones[historialCanciones.length - 1] || null
    };

    return (
        <BingoContext.Provider value={value}>
            {children}
        </BingoContext.Provider>
    );
};

// Hook personalizado para usar el contexto
export const useBingo = () => {
    const context = useContext(BingoContext);
    if (!context) {
        throw new Error('useBingo debe ser usado dentro de un BingoProvider');
    }
    return context;
};

export default BingoContext;