
import React, { useEffect } from 'react';
import { 
  Snackbar, 
  Alert, 
  Button, 
  LinearProgress, 
  Box, 
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { useElectronUpdater } from '../hooks/useElectronUpdater';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';
import DownloadIcon from '@mui/icons-material/Download';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

export const ElectronUpdateNotification: React.FC = () => {
  const { 
    available, 
    checking, 
    downloading, 
    downloaded, 
    error, 
    progress, 
    newVersion,
    checkUpdate,
    startDownload,
    quitAndInstall 
  } = useElectronUpdater();

  // Auto-check for updates on mount
  useEffect(() => {
    checkUpdate();
  }, [checkUpdate]);

  console.log('Update Status:', { available, downloading, downloaded, error, progress });

  // 1. Update Available Dialog/Snackbar
  const showAvailable = available && !downloading && !downloaded;

  // 2. Downloading Dialog (Progress)
  const showDownloading = downloading && !downloaded;

  // 3. Downloaded Snackbar (Grid to install)
  const showDownloaded = downloaded;

  return (
    <>
      {/* Update Available Notification */}
      <Snackbar 
        open={showAvailable} 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="info" 
          icon={<SystemUpdateIcon />}
          action={
            <Button color="inherit" size="small" onClick={startDownload} startIcon={<DownloadIcon />}>
              Update Now
            </Button>
          }
        >
          New version {newVersion} is available!
        </Alert>
      </Snackbar>

      {/* Downloading Progress Dialog (Non-blocking but visible) */}
      <Dialog open={showDownloading} maxWidth="xs" fullWidth>
        <DialogTitle>Downloading Update...</DialogTitle>
        <DialogContent>
          <Box sx={{ width: '100%', mt: 1 }}>
            <LinearProgress variant="determinate" value={progress?.percent || 0} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                {progress?.percent.toFixed(0)}%
              </Typography>
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                {((progress?.transferred || 0) / 1024 / 1024).toFixed(1)} MB / {((progress?.total || 0) / 1024 / 1024).toFixed(1)} MB
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Update Ready to Install Notification */}
      <Snackbar 
        open={showDownloaded} 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={null} // Don't auto-hide
      >
        <Alert 
          severity="success" 
          icon={<RestartAltIcon />}
          action={
            <Button color="inherit" size="small" onClick={quitAndInstall} variant="outlined" sx={{ color: 'white', borderColor: 'white' }}>
              Restart App
            </Button>
          }
        >
          Update downloaded! Restart to install.
        </Alert>
      </Snackbar>

      {/* Error Notification */}
      <Snackbar 
       open={!!error} 
       autoHideDuration={6000}
       anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
     >
       <Alert severity="error">
         Update Error: {error}
       </Alert>
     </Snackbar>
    </>
  );
};
