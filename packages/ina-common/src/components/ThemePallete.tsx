import { IDashAutoAdminCustomFieldComponent } from "dash-auto-admin";
import React, { useEffect, useState, Suspense, lazy } from "react";
import { useRecordContext, useNotify, useRefresh } from "react-admin";
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  Input,
  Card,
  CardMedia,
  IconButton,
  Chip
} from "@mui/material";
import { CloudUpload, Delete } from "@mui/icons-material";

import { useAxios } from 'dash-axios-hook';
import { Tenant } from "dash-admin/src/interfaces/Tenant";
import { useAsyncColorThief } from "../hooks/useAsyncColorThief";

// Lazy load the color display component
const ColorDisplayComponent = lazy(() => import('./ColorDisplayComponent'));

interface ThemePalleteProps extends IDashAutoAdminCustomFieldComponent {
}
/**
 * Color palette component for editing mode
 * @param props - Component properties
 * @returns JSX element for color palette editing
 */
const ThemePalleteEdit: React.FC<ThemePalleteProps> = ({ 
  method, 
  attribute, 
  resourceConfig, 
  ...props 
}) => {
  const tenant: Tenant = useRecordContext();
  const axios = useAxios();
  const notify = useNotify();
  const refresh = useRefresh();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { dominantColor, palette, loading, error } = useAsyncColorThief(imageUrl, {
    colorCount: 8,
    quality: 10
  });

  useEffect(() => {
    if (tenant && attribute.attribute) {
      const settings = tenant[attribute.attribute as keyof Tenant];
      // Extract image URL from tenant settings
      if (settings && typeof settings === 'object' && 'imageUrl' in settings) {
        setImageUrl((settings as any).imageUrl);
      }
    }
  }, [tenant, attribute.attribute]);

  /**
   * Handle file selection for upload
   * @param event - File input change event
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        notify('Please select a valid image file', { type: 'error' });
        return;
      }

      // Validate file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        notify('File size must be less than 5MB', { type: 'error' });
        return;
      }

      setUploadedFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImageUrl(previewUrl);
    }
  };

 

  /**
 * Handle image removal (only for local cached/preview images)
 */
const handleImageRemove = () => {
  // Check if it's a local preview image (blob URL) or uploaded file
  const isPreviewImage = imageUrl?.startsWith('blob:') || uploadedFile;
  
  if (isPreviewImage) {
    // Only clean up local preview URLs and reset local state
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
    
    setImageUrl(null);
    setUploadedFile(null);
    
    notify('Local image cleared', { type: 'info' });
  } else {
    // For saved images, you might want to show a confirmation dialog
    // or handle differently - for now, just clear local state
    setImageUrl(null);
    notify('Image view cleared (original image still saved)', { type: 'info' });
  }
};

  /**
   * Handle color palette update
   * @param colors - Array of extracted colors
   */
  const handleColorUpdate = async (colors: number[][]) => {
    try {
      const colorPalette = colors.map(color => `rgb(${color.join(',')})`);
      
      // Update tenant settings with new color palette
      const updatedSettings = {
        ...tenant[attribute.attribute],
        colorPalette,
        dominantColor: dominantColor ? `rgb(${dominantColor.join(',')})` : null
      };


      notify('Color palette updated successfully', { type: 'success' });
      refresh();
    } catch (err) {
      notify('Failed to update color palette', { type: 'error' });
    }
  };

  useEffect(() => {
    if (palette && !loading && !error && !imageUrl?.startsWith('blob:')) {
      // Only auto-update if it's not a preview image
      handleColorUpdate(palette);
    }
  }, [palette, loading, error, imageUrl]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Color Palette Extractor
      </Typography>

      {/* Image Upload Section */}

      <Box sx={{ mb: 3 }}>
      
         {/*<Typography variant="subtitle1" gutterBottom>
          Upload Image
        </Typography>
        
       <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Input
            type="file"
            inputProps={{ accept: 'image/*' }}
            onChange={handleFileSelect}
            sx={{ display: 'none' }}
            id="image-upload-input"
          />
          <label htmlFor="image-upload-input">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUpload />}
              disabled={isUploading}
            >
              Select Image
            </Button>
          </label>
          
          {uploadedFile && (
            <Button
              variant="contained"
              onClick={handleImageUpload}
              disabled={isUploading}
            >
              {isUploading ? <CircularProgress size={20} /> : 'Upload'}
            </Button>
          )}
        </Box>*/}

        {/* Image Preview */}
        {imageUrl && (
          <Card sx={{ maxWidth: 400, mb: 3 }}>
            <Box sx={{ position: 'relative' }}>
              <CardMedia
                component="img"
                height="250"
                image={imageUrl}
                alt="Uploaded image"
                sx={{ objectFit: 'contain' }}
              />
              <IconButton
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                  },
                }}
                onClick={handleImageRemove}
                size="small"
              >
                <Delete />
              </IconButton>
            </Box>
          </Card>
        )}
      </Box>

      {/* Color Extraction Status */}
      {loading && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 3,
            p: 2,
            backgroundColor: 'rgba(25, 118, 210, 0.04)',
            borderRadius: 1
          }}>
          <CircularProgress size={20} />
          <Typography>Extracting colors from image...</Typography>
        </Box>
      )}

      {error && (
        <Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(211, 47, 47, 0.04)', borderRadius: 1, border: '1px solid rgba(211, 47, 47, 0.2)' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {/* Color Display */}
      {palette && palette.length > 0 && !loading && (
        <Box sx={{ mb: 3 }}>
          <Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          }>
            <ColorDisplayComponent 
              dominantColor={dominantColor} 
              palette={palette} 
            />
          </Suspense>
        </Box>
      )}

      {/* Instructions when no image */}
      {!imageUrl && (
        <Box sx={{ 
          textAlign: 'center', 
          py: 4, 
          backgroundColor: 'rgba(0,0,0,0.02)', 
          borderRadius: 1,
          border: '2px dashed #e0e0e0'
        }}>
          <Input
            type="file"
            inputProps={{ accept: 'image/*' }}
            onChange={handleFileSelect}
            sx={{ display: 'none' }}
            id="image-upload-input"
          />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Upload an Image to Extract Colors
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Select an image file and we'll automatically extract a beautiful color palette for you
          </Typography>
          <label htmlFor="image-upload-input">
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUpload />}
              size="large"
            >
              Choose Image
            </Button>
          </label>
        </Box>
      )}
    </Box>
  );
};

/**
 * Color palette component for create mode
 * @param props - Component properties
 * @returns JSX element for color palette creation
 */
const ThemePalleteCreate: React.FC<ThemePalleteProps> = ({ 
  method, 
  attribute, 
  resourceConfig, 
  ...props 
}) => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Color Palette Extractor
      </Typography>
      <Box sx={{ 
        textAlign: 'center', 
        py: 4, 
        backgroundColor: 'rgba(0,0,0,0.02)', 
        borderRadius: 1,
        border: '2px dashed #e0e0e0'
      }}>
        <Typography variant="body2" color="textSecondary">
          Color palette will be generated after image upload in edit mode
        </Typography>
      </Box>
    </Box>
  );
};

/**
 * Color palette component for view mode
 * @param props - Component properties
 * @returns JSX element for color palette viewing
 */
const ThemePalleteView: React.FC<ThemePalleteProps> = ({ 
  method, 
  attribute, 
  resourceConfig, 
  ...props 
}) => {
  const tenant: Tenant = useRecordContext();
  const [colors, setColors] = useState<string[]>([]);
  const [dominantColorString, setDominantColorString] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (tenant && attribute.attribute) {
      const settings = tenant[attribute.attribute as keyof Tenant];
      if (settings && typeof settings === 'object') {
        const settingsObj = settings as any;
        setColors(settingsObj.colorPalette || []);
        setDominantColorString(settingsObj.dominantColor || null);
        setImageUrl(settingsObj.imageUrl || null);
      }
    }
  }, [tenant, attribute.attribute]);

  // Helper function to determine text color based on background
  const getContrastColor = (color: string): string => {
    // Simple contrast calculation for CSS color strings
    if (color.startsWith('rgb')) {
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const [, r, g, b] = match.map(Number);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#ffffff';
      }
    }
    return '#000000';
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Current Color Palette
      </Typography>

      {/* Source Image Display */}
      {imageUrl && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Source Image
          </Typography>
          <Card sx={{ maxWidth: 300 }}>
            <CardMedia
              component="img"
              height="150"
              image={imageUrl}
              alt="Source image"
              sx={{ objectFit: 'contain' }}
            />
          </Card>
        </Box>
      )}

      {colors.length > 0 ? (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Typography variant="subtitle1">
              Extracted Colors
            </Typography>
            <Chip 
              label={`${colors.length} colors`}
              size="small"
              variant="outlined"
            />
          </Box>

          {/* Color Grid Display */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
            gap: 0,
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            overflow: 'hidden',
            mb: 2
          }}>
            {colors.map((color, index) => {
              const textColor = getContrastColor(color);
              const isDominant = dominantColorString === color;
              
              return (
                <Box 
                  key={index}
                  sx={{ 
                    aspectRatio: '3/4',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                      zIndex: 1,
                    },
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: color,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  title={`${color}${isDominant ? ' (Dominant)' : ''}`}
                >
                  {/* Dominant color indicator */}
                  {isDominant && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 4,
                        left: 4,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        borderRadius: '50%',
                        width: 16,
                        height: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          backgroundColor: '#4caf50',
                          borderRadius: '50%',
                        }}
                      />
                    </Box>
                  )}

                  {/* Color index */}
                  <Typography
                    variant="caption"
                    sx={{
                      color: textColor,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      padding: '2px 6px',
                      borderRadius: 1,
                      fontSize: '0.7rem',
                      fontFamily: 'monospace',
                      textAlign: 'center',
                      mb: 1,
                      fontWeight: isDominant ? 'bold' : 'normal',
                    }}
                  >
                    {isDominant ? 'Dominant' : `Color ${index + 1}`}
                  </Typography>
                  
                  {/* Color value */}
                  <Typography
                    variant="caption"
                    sx={{
                      color: textColor,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      padding: '2px 6px',
                      borderRadius: 1,
                      fontSize: '0.6rem',
                      fontFamily: 'monospace',
                      textAlign: 'center',
                    }}
                  >
                    {color}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Color Statistics */}
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1, 
            alignItems: 'center',
            p: 2,
            backgroundColor: 'rgba(0,0,0,0.02)',
            borderRadius: 1,
            border: '1px solid #e0e0e0'
          }}>
            <Typography variant="caption" color="textSecondary">
              Color Analysis:
            </Typography>
            {dominantColorString && (
              <Chip
                label="Dominant Color Identified"
                size="small"
                color="success"
                variant="outlined"
              />
            )}
            <Chip
              label={`${colors.length} Palette Colors`}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>
      ) : (
        <Box sx={{ 
          textAlign: 'center', 
          py: 4, 
          backgroundColor: 'rgba(0,0,0,0.02)', 
          borderRadius: 1,
          border: '2px dashed #e0e0e0'
        }}>
          <Typography variant="body2" color="textSecondary">
            No color palette has been generated yet
          </Typography>
        </Box>
      )}
    </Box>
  );
};

/**
 * Color palette component for list mode
 * @param props - Component properties
 * @returns JSX element for color palette in list
 */
const ThemePalleteList: React.FC<ThemePalleteProps> = ({ 
  method, 
  attribute, 
  resourceConfig, 
  ...props 
}) => {
  const tenant: Tenant = useRecordContext();
  const [dominantColor, setDominantColor] = useState<string>('#ffffff');
  const [hasColors, setHasColors] = useState<boolean>(false);

  useEffect(() => {
    if (tenant && attribute.attribute) {
      const settings = tenant[attribute.attribute as keyof Tenant];
      if (settings && typeof settings === 'object') {
        const settingsObj = settings as any;
        setDominantColor(settingsObj.dominantColor || '#ffffff');
        setHasColors(!!(settingsObj.colorPalette && settingsObj.colorPalette.length > 0));
      }
    }
  }, [tenant, attribute.attribute]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{
          width: 24,
          height: 24,
          backgroundColor: dominantColor,
          border: '1px solid #ccc',
          borderRadius: '50%',
          position: 'relative',
        }}
        title={`Dominant color: ${dominantColor}`}
      />
      {hasColors && (
        <Box
          sx={{
            width: 8,
            height: 8,
            backgroundColor: '#4caf50',
            borderRadius: '50%',
          }}
          title="Color palette available"
        />
      )}
    </Box>
  );
};

/**
 * Main color palette component with method routing
 * @param props - Component properties
 * @returns JSX element based on method
 */
const ThemePallete = ({ 
  method, 
  attribute, 
  resourceConfig, 
  ...props 
}: ThemePalleteProps) => {
  switch (method) {
    case "edit":
      return (
        <ThemePalleteEdit 
          attribute={attribute} 
          method={method} 
          resourceConfig={resourceConfig} 
          {...props} 
        />
      );
    case "view":
      return (
        <ThemePalleteView 
          attribute={attribute} 
          method={method} 
          resourceConfig={resourceConfig} 
          {...props} 
        />
      );
    case "create":
      return (
        <ThemePalleteCreate 
          attribute={attribute} 
          method={method} 
          resourceConfig={resourceConfig} 
          {...props} 
        />
      );
    case "list":
      return (
        <ThemePalleteList 
          attribute={attribute} 
          method={method} 
          resourceConfig={resourceConfig} 
          {...props} 
        />
      );
    default:
      return <></>;
  }
};

export default ThemePallete;
