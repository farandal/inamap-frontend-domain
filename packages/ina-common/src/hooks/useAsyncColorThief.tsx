import { useState, useEffect, useCallback } from 'react';

interface ColorThiefResult {
  dominantColor: number[] | null;
  palette: number[][] | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for async loading and using Color Thief functionality
 * @param imageSource - The image source (URL, base64, or ref)
 * @param options - Configuration options for color extraction
 * @returns Color thief result with dominant color and palette
 */
export const useAsyncColorThief = (
  imageSource: string | null,
  options: { colorCount?: number; quality?: number } = {}
): ColorThiefResult => {
  const [result, setResult] = useState<ColorThiefResult>({
    dominantColor: null,
    palette: null,
    loading: false,
    error: null
  });

  const extractColors = useCallback(async (src: string) => {
    if (!src) return;

    setResult(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Dynamically import ColorThief
      const ColorThief = (await import('colorthief')).default;
      
      // Create a temporary image element for color extraction
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const colorThief = new ColorThief();
          
          const dominantColor = colorThief.getColor(img);
          const palette = colorThief.getPalette(img, options.colorCount || 5, options.quality || 10);
          
          setResult({
            dominantColor,
            palette,
            loading: false,
            error: null
          });
        } catch (error) {
          console.error('Color extraction error:', error);
          setResult(prev => ({
            ...prev,
            loading: false,
            error: `Failed to extract colors: ${error instanceof Error ? error.message : 'Unknown error'}`
          }));
        }
      };

      img.onerror = () => {
        setResult(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load image'
        }));
      };

      img.src = src;
    } catch (error) {
      console.error('ColorThief import error:', error);
      setResult(prev => ({
        ...prev,
        loading: false,
        error: `Failed to load Color Thief: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  }, [options.colorCount, options.quality]);

  useEffect(() => {
    if (imageSource) {
      extractColors(imageSource);
    } else {
      // Reset state when no image source
      setResult({
        dominantColor: null,
        palette: null,
        loading: false,
        error: null
      });
    }
  }, [imageSource, extractColors]);

  return result;
};
