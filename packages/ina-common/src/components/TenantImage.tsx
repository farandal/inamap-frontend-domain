import { DashAutoFormGroups, DashAutoFormTabs, IDashAutoAdminCustomFieldComponent } from "dash-auto-admin";
import React, { useState, useEffect, useCallback } from "react";
import { useGetList, Loading, useRecordContext, useNotify,useRefresh } from "react-admin";
import { 
  Box, 
  Typography, 
  Avatar, 
  Button, 
  IconButton, 
  Card, 
  CardContent, 
  CardActions,
  CircularProgress,
  Alert,
  CardHeader,
  Stack,
  Divider,
  LinearProgress
} from "@mui/material";
import { 
  CloudUpload as UploadIcon, 
  Delete as DeleteIcon, 
  Image as ImageIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  CloudUpload as CloudUploadIcon
} from "@mui/icons-material";

import { useAxios } from 'dash-axios-hook';
import { useFormContext, useWatch } from "react-hook-form";
import { Tenant } from "dash-admin/src/interfaces/Tenant";
// ADD: Import useAuthContext
import { useAuthContext } from "dash-admin";

interface TenantImageProps extends IDashAutoAdminCustomFieldComponent {
  endpoint: string;
}

const TenantImageEdit: React.FC<TenantImageProps> = ({ 
  method, 
  attribute, 
  resourceConfig, 
  endpoint,
  ...props 
}) => {
  const tenant: Tenant = useRecordContext();
  const axios = useAxios();
  const notify = useNotify();
  const refresh = useRefresh();
  // ADD: Get fetchAuth from AuthContext
  //const { fetchAuth } = useAuthContext();
  
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentImage, setCurrentImage] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Get the current image based on attribute.attribute
  useEffect(() => {
    if (tenant && attribute.listAttribute && tenant[attribute.listAttribute]) {
      setCurrentImage(tenant[attribute.listAttribute]);
    }
  }, [tenant, attribute.listAttribute]);

  // Get image dimensions based on attribute.attribute
  const getImageDimensions = () => {
    const fixedWidth = 300; // All images will have the same width
    
    switch (attribute.attribute) {
      case 'banner_images':
        return { width: fixedWidth, height: fixedWidth, aspectRatio: '1:1' }; // 1:1 = square
      case 'horizontal_logo_images':
        return { width: fixedWidth, height: Math.round(fixedWidth * (8/23)), aspectRatio: '23:8' }; // Wide
      case 'squared_logo_images':
        return { width: fixedWidth, height: fixedWidth, aspectRatio: '1:1' }; // 1:1 = square
      default:
        return { width: fixedWidth, height: fixedWidth, aspectRatio: '1:1' };
    }
  };

  const dimensions = getImageDimensions();

  // Get current image URL
  const getCurrentImageUrl = () => {
    if (!currentImage) return null;
    
    // Handle new API structure - check if it's an empty array first
    if (Array.isArray(currentImage) && currentImage.length === 0) {
      return null;
    }
    
    // If it's an object with different sizes, prioritize: medium > original > any other property
    if (typeof currentImage === 'object' && !Array.isArray(currentImage)) {
      if (currentImage.medium) {
        return currentImage.medium;
      }
      if (currentImage.original) {
        return currentImage.original;
      }
      if (currentImage.large) {
        return currentImage.large;
      }
      // Get first available URL from the object
      const firstUrl = Object.values(currentImage).find(url => typeof url === 'string' && url.startsWith('http'));
      if (firstUrl) {
        return firstUrl;
      }
    }
    
    // If it's a direct URL string
    if (typeof currentImage === 'string') {
      return currentImage;
    }
    
    // Fallback to tenant direct URL properties
    switch (attribute.attribute) {
      case 'banner_images':
        return tenant.banner_url;
      case 'horizontal_logo_images':
        return tenant.horizontal_logo_url;
      case 'squared_logo_images':
        return tenant.squared_logo_url;
      default:
        return null;
    }
  };

  // Validate and process file
  const processFile = useCallback((file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      notify('Tipo de archivo no válido. Use JPEG, PNG, GIF o WebP.', { type: 'error' });
      return false;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      notify('El archivo es demasiado grande. Máximo 2MB.', { type: 'error' });
      return false;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);
    setSelectedFile(file);
    return true;
  }, [notify]);

  // Handle file selection and preview
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    processFile(file);

    // Reset file input
    event.target.value = '';
  }, [processFile]);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  // Handle upload confirmation
  const handleUploadConfirm = useCallback(async () => {
    if (!selectedFile) return;

    setUploading(true);

    try {
      const formData = new FormData();
      const fieldName = attribute.attribute.replace('_images', ''); // Remove _images suffix
      formData.append(fieldName, selectedFile);

      const response = await axios.post(`${resourceConfig.model}/${tenant.id}${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update current image with response data
      if (response.data && response.data.images) {
        const imageKey = attribute.attribute.replace('_images', '');
        if (response.data.images[imageKey]) {
          setCurrentImage(response.data.images[imageKey]);
        }
      } else if (response.data && response.data[attribute.attribute]) {
        setCurrentImage(response.data[attribute.attribute]);
      }

      notify('Imagen subida exitosamente', { type: 'success' });
      refresh();
      
      // Clear preview
      handleCancelPreview();

      // ADD: Refresh auth context with updated tenant data
      /*try {
        await fetchAuth();
        console.log('Auth context refreshed after tenant image upload');
      } catch (authError) {
        console.error('Failed to refresh auth context after tenant image upload:', authError);
        // Don't show error to user as the main operation succeeded
      }*/
      
    } catch (error: any) {
      console.error('Upload error:', error);
      notify(
        error.response?.data?.message || 'Error al subir la imagen', 
        { type: 'error' }
      );
    } finally {
      setUploading(false);
    }
  }, [selectedFile, tenant.id, endpoint, attribute.attribute, axios, notify, refresh]);

  // Handle cancel preview
  const handleCancelPreview = useCallback(() => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }
    setPreviewImage(null);
    setSelectedFile(null);
  }, [previewImage]);

  const handleDelete = useCallback(async () => {
    if (!getCurrentImageUrl()) return;

    setDeleting(true);

    try {
      const deleteEndpoint = endpoint.replace('/upload-', '/delete-');
      await axios.delete(`${resourceConfig.model}/${tenant.id}${deleteEndpoint}`);

      setCurrentImage(null);
      notify('Imagen eliminada exitosamente', { type: 'success' });

      // ADD: Refresh auth context with updated tenant data after deletion
     /* try {
        await fetchAuth();
        console.log('Auth context refreshed after tenant image deletion');
      } catch (authError) {
        console.error('Failed to refresh auth context after tenant image deletion:', authError);
        // Don't show error to user as the main operation succeeded
      }*/
      
    } catch (error: any) {
      console.error('Delete error:', error);
      notify(
        error.response?.data?.message || 'Error al eliminar la imagen', 
        { type: 'error' }
      );
    } finally {
      setDeleting(false);
    }
  }, [tenant.id, endpoint, axios, notify, getCurrentImageUrl]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const currentImageUrl = getCurrentImageUrl();
  
  return (
    <Card sx={{ margin: 'auto',
        backgroundColor: 'transparent !important', 
        //backgroundImage: 'none !important',
        boxShadow: 'none !important', 
        border: 'none'
        
     }}>
      <CardHeader title={attribute.label} />
      <CardContent>
        <Box
          sx={{
            display: "flex",
            gap: 3
          }}>
          {/* Left Column - Images */}
          <Box
            sx={{
              flex: "0 0 auto",
              position: "relative"
            }}>
            {/* Preview Image Section - Show this when there's a preview */}
            {previewImage ? (
              <Box
                sx={{
                  width: dimensions.width,
                  height: dimensions.height,
                  border: '2px solid #1976d2',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <img
                  src={previewImage}
                  alt="Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    sx={{ minWidth: 'auto', padding: '8px' }}
                    onClick={handleUploadConfirm}
                    disabled={uploading || deleting}
                  >
                    {uploading ? <CircularProgress size={16} /> : <CheckIcon />}
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    sx={{ minWidth: 'auto', padding: '8px' }}
                    onClick={handleCancelPreview}
                    disabled={uploading || deleting}
                  >
                    <CancelIcon />
                  </Button>
                </Box>
              </Box>
            ) : currentImageUrl ? (
              /* Current Image Section - Show this when there's no preview but there's a current image */
              (<Box
                component="label"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                sx={{
                  width: dimensions.width,
                  height: dimensions.height,
                  border: isDragging ? '2px solid #1976d2' : '1px solid #e0e0e0',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDragging ? '#e3f2fd' : '#f5f5f5',
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(25, 118, 210, 0.1)',
                      pointerEvents: 'none',
                    }
                  }
                }}
              >
                <img
                  src={currentImageUrl}
                  alt="Current Image"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                {isDragging && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(25, 118, 210, 0.8)',
                      zIndex: 1,
                    }}
                  >
                    <CloudUploadIcon sx={{ fontSize: 48, color: 'white' }} />
                  </Box>
                )}
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    zIndex: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(244, 67, 54, 0.9)',
                      color: 'white',
                    }
                  }}
                  size="small"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete();
                  }}
                  disabled={uploading || deleting}
                >
                  <DeleteIcon />
                </IconButton>
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                />
              </Box>)
            ) : (
              /* No Image Section - Show this when there's no image at all */
              (<Box
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                sx={{
                  width: dimensions.width,
                  height: dimensions.height,
                  border: isDragging ? '2px solid #1976d2' : '2px dashed #ccc',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDragging ? '#e3f2fd' : '#f5f5f5',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: '#e8f4f8',
                    borderColor: '#90caf9',
                  }
                }}
              >
                <Box
                  component="label"
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%'
                  }}>
                  <CloudUploadIcon sx={{ fontSize: 48, color: isDragging ? '#1976d2' : '#ccc' }} />
                  <Typography variant="caption" color="textSecondary" sx={{
                    textAlign: "center"
                  }}>
                    {isDragging ? 'Suelte la imagen aquí' : 'Arrastre una imagen o haga clic'}
                  </Typography>
                  <input
                    type="file"
                    hidden
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                  />
                </Box>
              </Box>)
            )}
          </Box>

          {/* Right Column - Info and Actions */}
          <Box
            sx={{
              flex: "1",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 2
            }}>
            {/* Info Column */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Información de imagen
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{
                display: "block"
              }}>
                Dimensiones recomendadas: {dimensions.aspectRatio}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{
                display: "block"
              }}>
                Formatos: JPEG, PNG, GIF, WebP (máx. 2MB)
              </Typography>
              {selectedFile && (
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{
                    display: "block",
                    mt: 1
                  }}>
                  Archivo: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </Typography>
              )}

              {/* Progress Indicators */}
              {(uploading || deleting) && (
                <Box sx={{
                  mt: 2
                }}>
                  <LinearProgress />
                  <Typography variant="body2" align="center" sx={{
                    mt: 1
                  }}>
                    {uploading ? 'Subiendo imagen...' : 'Eliminando imagen...'}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Actions Column */}
            <Box>
              {previewImage && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Acciones
                  </Typography>
                  <Stack spacing={1}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={uploading ? <CircularProgress size={16} /> : <CheckIcon />}
                      onClick={handleUploadConfirm}
                      disabled={uploading || deleting}
                      fullWidth
                    >
                      {uploading ? 'Subiendo...' : 'Confirmar'}
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={handleCancelPreview}
                      disabled={uploading || deleting}
                      fullWidth
                    >
                      Cancelar
                    </Button>
                  </Stack>
                </Box>
              )}

              {currentImageUrl && !previewImage && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Cambiar imagen
                  </Typography>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<UploadIcon />}
                    disabled={uploading || deleting}
                    fullWidth
                  >
                    Nueva imagen
                    <input
                      type="file"
                      hidden
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleFileSelect}
                    />
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const TenantImageCreate: React.FC<TenantImageProps> = ({ 
  method, 
  attribute, 
  resourceConfig, 
  endpoint,
  ...props 
}) => {
  return (
    <Card sx={{ margin: 'auto' }}>
      <CardHeader title={attribute.label} />
      <CardContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2
          }}>
          <Alert severity="info">
            Las imágenes se pueden subir después de crear el tenant.
          </Alert>
          
          <Box
            sx={{
              width: 120,
              height: 120,
              border: '2px dashed #ccc',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
            }}
          >
            <ImageIcon sx={{ fontSize: 48, color: '#ccc' }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const TenantImageView: React.FC<TenantImageProps> = ({ 
    method, 
    attribute, 
    resourceConfig, 
    endpoint,
    ...props 
}) => {
    const tenant: Tenant = useRecordContext();

    // Get image dimensions based on attribute
    const getImageDimensions = () => {
        switch (attribute.attribute) {
            case 'banner_images':
                return { width: 200, height: 200 };
            case 'horizontal_logo_images':
                return { width: 230, height: 80 };
            case 'squared_logo_images':
                return { width: 80, height: 80 };
            default:
                return { width: 120, height: 120 };
        }
    };

    const dimensions = getImageDimensions();

    // Get current image URL directly from tenant record
    const getCurrentImageUrl = () => {
        switch (attribute.attribute) {
            case 'banner_images':
                return tenant.banner_url || null;
            case 'horizontal_logo_images':
                return tenant.horizontal_logo_url || null;
            case 'squared_logo_images':
                return tenant.squared_logo_url || null;
            default:
                return null;
        }
    };

    const currentImageUrl = getCurrentImageUrl();

    return (
      <Card sx={{ maxWidth: 400, margin: 'auto' }}>
        <CardHeader title={attribute.label} />
        <CardContent>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2
              }}>
                <Box
                    sx={{
                        width: dimensions.width,
                        height: dimensions.height,
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        overflow: 'hidden'
                    }}
                >
                    {currentImageUrl ? (
                        <img
                            src={currentImageUrl}
                            alt="Tenant Image"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    ) : (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 1
                          }}>
                            <ImageIcon sx={{ fontSize: 48, color: '#ccc' }} />
                            <Typography variant="caption" color="textSecondary">
                                Sin imagen
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </CardContent>
      </Card>
    );
};

const TenantImageList: React.FC<TenantImageProps> = ({ 
  method, 
  attribute, 
  resourceConfig, 
  endpoint,
  ...props 
}) => {
  const tenant: Tenant = useRecordContext();
  
  const getCurrentImageUrl = () => {
    // First try to get from images object
    if (tenant.images && tenant.images[attribute.attribute.replace('_images', '')]) {
      const imageData = tenant.images[attribute.attribute.replace('_images', '')];
      
      // Handle empty array case
      if (Array.isArray(imageData) && imageData.length === 0) {
        return null;
      }
      
      // Handle object with URLs
      if (typeof imageData === 'object' && !Array.isArray(imageData)) {
        return imageData.medium || imageData.original || imageData.large || null;
      }
    }
    
    // Fallback to direct URL properties
    switch (attribute.attribute) {
      case 'banner_images':
        return tenant.banner_url;
      case 'horizontal_logo_images':
        return tenant.horizontal_logo_url;
      case 'squared_logo_images':
        return tenant.squared_logo_url;
      default:
        return null;
    }
  };

  const currentImageUrl = getCurrentImageUrl();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
      {currentImageUrl ? (
        <Avatar
          src={currentImageUrl}
          variant="rounded"
          sx={{ 
            width: attribute.attribute === 'horizontal_logo_images' ? 60 : 40,
            height: attribute.attribute === 'horizontal_logo_images' ? 20 : 40
          }}
        />
      ) : (
        <ImageIcon sx={{ fontSize: 24, color: '#ccc' }} />
      )}
    </Box>
  );
};

const TenantImage = ({ 
  method, 
  attribute, 
  resourceConfig, 
  endpoint,
  ...props 
}: TenantImageProps) => {
  switch (method) {
    case "edit":
      return (
        <TenantImageEdit 
          attribute={attribute} 
          method={method} 
          resourceConfig={resourceConfig} 
          endpoint={endpoint}
          {...props} 
        />
      );
    case "view":
      return (
        <TenantImageView 
          attribute={attribute} 
          method={method} 
          resourceConfig={resourceConfig} 
          endpoint={endpoint}
          {...props} 
        />
      );
    case "create":
      return (
        <TenantImageCreate 
          attribute={attribute} 
          method={method} 
          resourceConfig={resourceConfig} 
          endpoint={endpoint}
          {...props} 
        />
      );
    case "list":
      return (
        <TenantImageList 
          attribute={attribute} 
          method={method} 
          resourceConfig={resourceConfig} 
          endpoint={endpoint}
          {...props} 
        />
      );
    default:
      return <></>;
  }
};

export default TenantImage;
