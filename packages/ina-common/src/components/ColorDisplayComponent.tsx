import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

interface ColorDisplayComponentProps {
  dominantColor: number[] | null;
  palette: number[][];
}

// Helper function to determine text color based on background
const getContrastColor = (rgb: number[]): string => {
  const [r, g, b] = rgb;
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

/**
 * Component to display extracted colors
 * @param props - Component properties containing dominant color and palette
 * @returns JSX element displaying the color palette
 */
const ColorDisplayComponent: React.FC<ColorDisplayComponentProps> = ({
  dominantColor,
  palette
}) => {
  /**
   * Convert RGB array to CSS color string
   * @param rgb - RGB color array
   * @returns CSS color string
   */
  const rgbToString = (rgb: number[]): string => `rgb(${rgb.join(',')})`;

  // Combine dominant color with palette, ensuring no duplicates
  const allColors = React.useMemo(() => {
    const colors = [...palette];
    
    // Add dominant color to the beginning if it's not already in the palette
    if (dominantColor) {
      const dominantColorString = rgbToString(dominantColor);
      const isDominantInPalette = palette.some(color => 
        rgbToString(color) === dominantColorString
      );
      
      if (!isDominantInPalette) {
        colors.unshift(dominantColor);
      }
    }
    
    return colors;
  }, [dominantColor, palette]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="subtitle1">
          Extracted Colors
        </Typography>
        <Chip 
          label={`${allColors.length} colors found`}
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
        {allColors.map((color, index) => {
          const colorString = rgbToString(color);
          const textColor = getContrastColor(color);
          const isDominant = dominantColor && rgbToString(dominantColor) === colorString;
          
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
                backgroundColor: colorString,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
              }}
              title={`${colorString}${isDominant ? ' (Dominant)' : ''}`}
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
                {colorString}
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
        {dominantColor && (
          <Chip
            label="Dominant Color Identified"
            size="small"
            color="success"
            variant="outlined"
          />
        )}
        <Chip
          label={`${palette.length} Palette Colors`}
          size="small"
          variant="outlined"
        />
        <Typography variant="caption" color="textSecondary">
          • Hover over colors to see details
        </Typography>
      </Box>
    </Box>
  );
};

export default ColorDisplayComponent;
