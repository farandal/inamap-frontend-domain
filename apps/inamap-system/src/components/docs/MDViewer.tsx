import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useLocaleState } from '../hooks/usePolyglotTranslation';

interface MDViewerProps {
    /** Path to the document folder relative to /docs (e.g., "privacy", "terms") */
    docPath: string;
    /** Optional filename, defaults to "index.md" */
    filename?: string;
    /** Optional fallback locale if the current locale file is not found */
    fallbackLocale?: string;
    /** Optional className for styling */
    className?: string;
}

/**
 * MDViewer - A component to display markdown documents with locale support.
 * 
 * Structure expected:
 * /docs/{docPath}/{locale}/{filename}
 * 
 * Example:
 * /docs/privacy/en/index.md
 * /docs/privacy/es/index.md
 */
const MDViewer: React.FC<MDViewerProps> = ({
    docPath,
    filename = 'index.md',
    fallbackLocale = 'en',
    className = '',
}) => {
    const [currentLocale] = useLocaleState();
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadMarkdown = async () => {
            setLoading(true);
            setError(null);

            // Try to load the markdown file for the current locale
            const localePath = `/docs/${docPath}/${currentLocale}/${filename}`;
            const fallbackPath = `/docs/${docPath}/${fallbackLocale}/${filename}`;

            try {
                let response = await fetch(localePath);
                
                // If current locale fails, try fallback
                if (!response.ok && currentLocale !== fallbackLocale) {
                    console.warn(`MDViewer: Locale file not found at ${localePath}, trying fallback...`);
                    response = await fetch(fallbackPath);
                }

                if (!response.ok) {
                    throw new Error(`Failed to load document: ${response.status} ${response.statusText}`);
                }

                const text = await response.text();
                setContent(text);
            } catch (err) {
                console.error('MDViewer: Error loading markdown:', err);
                setError(err instanceof Error ? err.message : 'Failed to load document');
            } finally {
                setLoading(false);
            }
        };

        loadMarkdown();
    }, [docPath, filename, currentLocale, fallbackLocale]);

    if (loading) {
        return (
            <Box 
                className={`md-viewer md-viewer-loading ${className}`}
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    minHeight: '200px',
                    p: 4,
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box 
                className={`md-viewer md-viewer-error ${className}`}
                sx={{ 
                    p: 4,
                    textAlign: 'center',
                }}
            >
                <Typography color="error" variant="body1">
                    {error}
                </Typography>
            </Box>
        );
    }

    return (
        <Box 
            className={`md-viewer ${className}`}
            sx={{ 
                p: { xs: 2, sm: 3, md: 4 },
                '& h1': { 
                    fontSize: { xs: '1.75rem', md: '2.5rem' },
                    fontWeight: 'bold',
                    mb: 3,
                },
                '& h2': { 
                    fontSize: { xs: '1.5rem', md: '2rem' },
                    fontWeight: 600,
                    mt: 4,
                    mb: 2,
                },
                '& h3': { 
                    fontSize: { xs: '1.25rem', md: '1.5rem' },
                    fontWeight: 600,
                    mt: 3,
                    mb: 1.5,
                },
                '& p': { 
                    mb: 2,
                    lineHeight: 1.7,
                },
                '& ul, & ol': { 
                    pl: 3,
                    mb: 2,
                },
                '& li': { 
                    mb: 0.5,
                },
                '& a': { 
                    color: 'primary.main',
                    textDecoration: 'underline',
                },
                '& code': {
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                },
                '& pre': {
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    padding: 2,
                    borderRadius: '8px',
                    overflow: 'auto',
                },
                '& blockquote': {
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                    pl: 2,
                    ml: 0,
                    fontStyle: 'italic',
                    color: 'text.secondary',
                },
            }}
        >
            <Markdown>{content}</Markdown>
        </Box>
    );
};

export default MDViewer;
