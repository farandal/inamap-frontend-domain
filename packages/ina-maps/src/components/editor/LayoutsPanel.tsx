import React, { useRef, useState } from 'react';
import { useNotify, useTranslate } from 'react-admin';
import {
    Avatar,
    Box,
    Button,
    Card,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import AddIcon from '@mui/icons-material/Add';
import type { Layout } from 'ina-viewer';
import { apiErrorMessage, InamapApi } from '../../api/useInamapApi';

export const DRAWER_PAPER = { width: { xs: '100vw', sm: 420 }, maxWidth: '100vw', height: '100%', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' } as const;

/** Lista flotante de pisos sobre el canvas (diseño de referencia). */
export const LayoutSwitcher: React.FC<{ layouts: Layout[]; currentId: string | null; onSelect: (id: string) => void; onClose: () => void }> = ({
    layouts,
    currentId,
    onSelect,
    onClose,
}) => {
    const translate = useTranslate();
    return (
        <Card elevation={3} sx={{ position: 'absolute', top: 12, left: 12, zIndex: 4, width: 160, borderRadius: 2 }}>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", px: 1.5, pt: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {translate('ina_maps.editor.layouts.title')}
                </Typography>
                <IconButton size="small" onClick={onClose}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
            </Stack>
            <List dense sx={{ p: 0.75 }}>
                {layouts.map((layout) => (
                    <ListItemButton
                        key={layout.id}
                        selected={layout.id === currentId}
                        onClick={() => onSelect(layout.id)}
                        sx={{ borderRadius: 1, '&.Mui-selected': { bgcolor: 'error.main', color: '#fff', '&:hover': { bgcolor: 'error.dark' } } }}
                    >
                        <ListItemIcon sx={{ minWidth: 30, color: 'inherit' }}>
                            <LayersOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={layout.name} />
                    </ListItemButton>
                ))}
            </List>
        </Card>
    );
};

interface LayoutsDrawerProps {
    open: boolean;
    onClose: () => void;
    inamapId: string;
    layouts: Layout[];
    unit: string;
    api: InamapApi;
    currentId: string | null;
    onSelect: (id: string) => void;
    onChanged: (selectId?: string) => void;
}

/** Gestión de layouts: crear, renombrar, nivel, tamaño real, imagen de fondo, eliminar. */
export const LayoutsDrawer: React.FC<LayoutsDrawerProps> = ({ open, onClose, inamapId, layouts, unit, api, currentId, onSelect, onChanged }) => {
    const translate = useTranslate();
    const notify = useNotify();
    const t = (key: string, options?: object) => translate(`ina_maps.editor.layouts.${key}`, options);
    const [draft, setDraft] = useState({ name: '', level: String((layouts[layouts.length - 1]?.level ?? 0) + 1), width: '100', height: '60' });
    const [busy, setBusy] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);
    const [uploadFor, setUploadFor] = useState<string | null>(null);

    const run = async (fn: () => Promise<unknown>, selectId?: string) => {
        setBusy(true);
        try {
            const result = await fn();
            onChanged(typeof result === 'string' ? result : selectId);
        } catch (e) {
            notify(apiErrorMessage(e), { type: 'error' });
        } finally {
            setBusy(false);
        }
    };

    const create = () =>
        run(async () => {
            const layout = await api.createLayout({
                inamap_id: inamapId,
                name: draft.name || `Piso ${draft.level}`,
                level: Number(draft.level),
                width: Number(draft.width),
                height: Number(draft.height),
            });
            setDraft({ name: '', level: String(Number(draft.level) + 1), width: draft.width, height: draft.height });
            return layout.id;
        });

    const save = (layout: Layout, patch: Partial<Layout>) => run(() => api.updateLayout(layout.id, patch));

    return (
        <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: DRAWER_PAPER } }}>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {t('title')}
                </Typography>
                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </Stack>

            <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
                {layouts.length === 0 && (
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                        {t('empty')}
                    </Typography>
                )}

                <Stack spacing={2}>
                    {layouts.map((layout) => (
                        <Card key={layout.id} variant="outlined" sx={{ p: 1.5, borderColor: layout.id === currentId ? 'error.main' : 'divider' }}>
                            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
                                <Avatar variant="rounded" src={layout.image_url ?? undefined} sx={{ width: 56, height: 40, cursor: 'pointer' }} onClick={() => onSelect(layout.id)}>
                                    <ImageOutlinedIcon />
                                </Avatar>
                                <TextField
                                    size="small"
                                    fullWidth
                                    label={t('name')}
                                    defaultValue={layout.name}
                                    onBlur={(e) => e.target.value !== layout.name && save(layout, { name: e.target.value })}
                                />
                            </Stack>
                            <Stack direction="row" spacing={1}>
                                <TextField size="small" type="number" label={t('level')} defaultValue={layout.level} onBlur={(e) => Number(e.target.value) !== layout.level && save(layout, { level: Number(e.target.value) })} />
                                <TextField size="small" type="number" label={`${t('width')} (${unit})`} defaultValue={layout.width} onBlur={(e) => Number(e.target.value) !== layout.width && save(layout, { width: Number(e.target.value) })} />
                                <TextField size="small" type="number" label={`${t('height')} (${unit})`} defaultValue={layout.height} onBlur={(e) => Number(e.target.value) !== layout.height && save(layout, { height: Number(e.target.value) })} />
                            </Stack>
                            <Stack direction="row" sx={{ justifyContent: "space-between", mt: 1 }}>
                                <Button
                                    size="small"
                                    startIcon={<ImageOutlinedIcon />}
                                    disabled={busy}
                                    onClick={() => {
                                        setUploadFor(layout.id);
                                        fileInput.current?.click();
                                    }}
                                >
                                    {translate(layout.image_url ? 'ina_maps.editor.actions.replace_image' : 'ina_maps.editor.actions.upload_image')}
                                </Button>
                                <IconButton
                                    size="small"
                                    color="error"
                                    disabled={busy}
                                    onClick={() => {
                                        if (window.confirm(t('confirm_delete', { name: layout.name }))) {
                                            run(() => api.deleteLayout(layout.id));
                                        }
                                    }}
                                >
                                    <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                            </Stack>
                        </Card>
                    ))}
                </Stack>

                <Typography sx={{ fontWeight: 700, mt: 3, mb: 1 }}>
                    {t('new')}
                </Typography>
                <Stack spacing={1.5}>
                    <TextField size="small" label={t('name')} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                    <Stack direction="row" spacing={1}>
                        <TextField size="small" type="number" label={t('level')} value={draft.level} onChange={(e) => setDraft({ ...draft, level: e.target.value })} />
                        <TextField size="small" type="number" label={`${t('width')} (${unit})`} value={draft.width} onChange={(e) => setDraft({ ...draft, width: e.target.value })} />
                        <TextField size="small" type="number" label={`${t('height')} (${unit})`} value={draft.height} onChange={(e) => setDraft({ ...draft, height: e.target.value })} />
                    </Stack>
                    <Button variant="contained" color="error" startIcon={<AddIcon />} disabled={busy || Number(draft.width) <= 0 || Number(draft.height) <= 0} onClick={create}>
                        {translate('ina_maps.editor.actions.create')}
                    </Button>
                </Stack>
            </Box>

            <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                hidden
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file && uploadFor) run(() => api.uploadLayoutImage(uploadFor, file), uploadFor);
                }}
            />
        </Drawer>
    );
};
