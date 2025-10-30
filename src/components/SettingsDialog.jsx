import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box,
    Alert,
    Link
} from '@mui/material';

const { ipcRenderer } = window.require('electron');

function SettingsDialog({ open, onClose, onNotification }) {
    const [spotifyClientId, setSpotifyClientId] = useState('');
    const [spotifyClientSecret, setSpotifyClientSecret] = useState('');
    const [hasCredentials, setHasCredentials] = useState(false);

    useEffect(() => {
        if (open) {
            loadCredentials();
        }
    }, [open]);

    const loadCredentials = async () => {
        const credentials = await ipcRenderer.invoke('get-spotify-credentials');
        if (credentials) {
            setSpotifyClientId(credentials.clientId || '');
            setSpotifyClientSecret(credentials.clientSecret || '');
            setHasCredentials(!!(credentials.clientId && credentials.clientSecret));
        }
    };

    const handleSave = async () => {
        if (!spotifyClientId || !spotifyClientSecret) {
            onNotification('Por favor completa ambos campos', 'warning');
            return;
        }

        try {
            await ipcRenderer.invoke('set-spotify-credentials', {
                clientId: spotifyClientId,
                clientSecret: spotifyClientSecret
            });

            setHasCredentials(true);
            onNotification('Credenciales de Spotify guardadas correctamente', 'success');
            onClose();
        } catch (error) {
            onNotification('Error al guardar credenciales: ' + error.message, 'error');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Configuración</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Fuentes de Audio
                    </Typography>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <strong>Invidious (Recomendado):</strong> Sin límites, gratuito, no requiere configuración.
                        <br />
                        <strong>Spotify:</strong> Requiere cuenta de desarrollador (gratuita), previews de 30s.
                    </Alert>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Configuración de Spotify
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Para usar Spotify como fuente de audio, necesitas crear una aplicación en el{' '}
                        <Link href="#" onClick={() => require('electron').shell.openExternal('https://developer.spotify.com/dashboard')}>
                            Dashboard de Spotify
                        </Link>
                        {' '}y obtener las credenciales.
                    </Typography>

                    {hasCredentials && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Credenciales configuradas correctamente
                        </Alert>
                    )}

                    <TextField
                        fullWidth
                        label="Client ID"
                        value={spotifyClientId}
                        onChange={(e) => setSpotifyClientId(e.target.value)}
                        margin="normal"
                        type="password"
                    />
                    <TextField
                        fullWidth
                        label="Client Secret"
                        value={spotifyClientSecret}
                        onChange={(e) => setSpotifyClientSecret(e.target.value)}
                        margin="normal"
                        type="password"
                    />
                </Box>

                <Box>
                    <Typography variant="caption" color="text.secondary">
                        <strong>Nota:</strong> Invidious no requiere configuración y es la opción recomendada.
                        Solo configura Spotify si deseas usarlo como fuente de respaldo.
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave} variant="contained">
                    Guardar
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default SettingsDialog;