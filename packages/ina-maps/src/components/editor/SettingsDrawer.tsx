import React, { useEffect, useState } from 'react';
import { useNotify, useTranslate } from 'react-admin';
import { Alert, Box, Button, Divider, Drawer, FormControlLabel, IconButton, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import KeyIcon from '@mui/icons-material/Key';
import { QRCodeSVG } from 'qrcode.react';
import type { Inamap, Layout } from 'ina-viewer';
import { apiErrorMessage, InamapApi } from '../../api/useInamapApi';
import { DRAWER_PAPER } from './LayoutsPanel';

/**
 * Información (nombre, descripción) y Configuración (modo de acceso,
 * duración de sesiones de ruta, layout inicial, enlace público, código para
 * incrustar y credencial de dispositivo) — drawer derecho, como los ajustes
 * de laboratorio.
 */
export interface SettingsDrawerProps {
    open: boolean;
    section: 'info' | 'settings';
    onClose: () => void;
    inamap: Inamap;
    layouts: Layout[];
    api: InamapApi;
    onSaved: (inamap: Inamap) => void;
}

const copy = (text: string) => navigator.clipboard?.writeText(text);

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ open, section, onClose, inamap, layouts, api, onSaved }) => {
    const translate = useTranslate();
    const notify = useNotify();
    const t = (key: string) => translate(`ina_maps.editor.settings.${key}`);
    const f = (key: string) => translate(`ina_maps.inamap.fields.${key}`);

    const [form, setForm] = useState({
        name: inamap.name,
        description: inamap.description ?? '',
        access_mode: inamap.settings?.access_mode ?? 'open',
        session_ttl_minutes: String(inamap.settings?.session_ttl_minutes ?? 60),
        initial_layout_id: (inamap.settings?.initial_layout_id as string) ?? '',
        primary_color: (inamap.settings?.primary_color as string) ?? '#E1251B',
        allow_zone_overlap: inamap.settings?.allow_zone_overlap === true,
    });
    const [newKey, setNewKey] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (open) setNewKey(null);
    }, [open]);

    const save = async () => {
        setBusy(true);
        try {
            const saved = await api.updateInamap(inamap.id, {
                name: form.name,
                description: form.description,
                settings: {
                    access_mode: form.access_mode as 'open' | 'token_required',
                    session_ttl_minutes: Number(form.session_ttl_minutes),
                    initial_layout_id: form.initial_layout_id || null,
                    primary_color: form.primary_color,
                    allow_zone_overlap: form.allow_zone_overlap,
                },
            });
            onSaved(saved);
            notify('ra.notification.updated', { type: 'success', messageArgs: { smart_count: 1 } });
        } catch (e) {
            notify(apiErrorMessage(e), { type: 'error' });
        } finally {
            setBusy(false);
        }
    };

    const rotate = async () => {
        try {
            const { access_key } = await api.rotateAccessKey(inamap.id);
            setNewKey(access_key);
            onSaved({ ...inamap, settings: { ...inamap.settings, has_access_key: true } });
        } catch (e) {
            notify(apiErrorMessage(e), { type: 'error' });
        }
    };

    const publicUrl = inamap.public_url ?? '';
    const embed = `<iframe src="${publicUrl}" width="100%" height="600" style="border:0" allow="geolocation" loading="lazy"></iframe>`;

    return (
        <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: DRAWER_PAPER } }}>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {t(section === 'info' ? 'info_title' : 'access_title')}
                </Typography>
                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </Stack>

            <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
                {section === 'info' ? (
                    <Stack spacing={2}>
                        <TextField size="small" label={f('name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        <TextField size="small" label={f('description')} multiline minRows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        <TextField size="small" label={f('unit')} value={translate(`ina_maps.inamap.units.${inamap.unit}`, { _: inamap.unit })} slotProps={{ input: { readOnly: true } }} />
                        <TextField
                            size="small"
                            label={f('primary_color')}
                            value={form.primary_color}
                            onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                            slotProps={{ input: {
                                startAdornment: (
                                    <input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} style={{ width: 28, height: 28, border: 'none', marginRight: 8, background: 'none' }} />
                                ),
                            } }}
                        />
                    </Stack>
                ) : (
                    <Stack spacing={2}>
                        <TextField select size="small" label={f('access_mode')} value={form.access_mode} onChange={(e) => setForm({ ...form, access_mode: e.target.value as 'open' | 'token_required' })}>
                            {(['open', 'token_required'] as const).map((mode) => (
                                <MenuItem key={mode} value={mode}>
                                    {translate(`ina_maps.inamap.access_modes.${mode}`)}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField size="small" type="number" label={f('session_ttl_minutes')} value={form.session_ttl_minutes} onChange={(e) => setForm({ ...form, session_ttl_minutes: e.target.value })} />
                        <TextField select size="small" label={t('initial_layout')} value={form.initial_layout_id} onChange={(e) => setForm({ ...form, initial_layout_id: e.target.value })}>
                            <MenuItem value="">—</MenuItem>
                            {layouts.map((l) => (
                                <MenuItem key={l.id} value={l.id}>
                                    {l.name}
                                </MenuItem>
                            ))}
                        </TextField>

                        <Box>
                            <FormControlLabel
                                control={<Switch checked={form.allow_zone_overlap} onChange={(e) => setForm({ ...form, allow_zone_overlap: e.target.checked })} />}
                                label={f('allow_zone_overlap')}
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ pl: 0.5 }}>
                                {t('allow_zone_overlap_hint')}
                            </Typography>
                        </Box>

                        <Divider />
                        <Typography sx={{ fontWeight: 700 }}>{t('public_link')}</Typography>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                            <TextField size="small" fullWidth value={publicUrl} slotProps={{ input: { readOnly: true } }} />
                            <IconButton onClick={() => copy(publicUrl)}>
                                <ContentCopyIcon fontSize="small" />
                            </IconButton>
                        </Stack>
                        {publicUrl && (
                            <Box sx={{ alignSelf: 'center', bgcolor: '#fff', p: 1, borderRadius: 1 }}>
                                <QRCodeSVG value={publicUrl} size={160} level="M" />
                            </Box>
                        )}
                        <Typography sx={{ fontWeight: 700 }}>{t('embed')}</Typography>
                        <Stack direction="row" spacing={1}>
                            <TextField size="small" fullWidth multiline value={embed} slotProps={{ input: { readOnly: true, sx: { fontFamily: 'monospace', fontSize: 12 } } }} />
                            <IconButton onClick={() => copy(embed)}>
                                <ContentCopyIcon fontSize="small" />
                            </IconButton>
                        </Stack>

                        <Divider />
                        <Typography sx={{ fontWeight: 700 }}>{t('access_key')}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t('access_key_hint')}
                        </Typography>
                        {inamap.settings?.has_access_key && !newKey && <Alert severity="info">{t('access_key_present')}</Alert>}
                        {newKey && (
                            <Alert severity="warning">
                                {t('access_key_new')}
                                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 1 }}>
                                    <code style={{ wordBreak: 'break-all' }}>{newKey}</code>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            copy(newKey);
                                            notify('ina_maps.editor.messages.key_copied');
                                        }}
                                    >
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Stack>
                            </Alert>
                        )}
                        <Button variant="outlined" startIcon={<KeyIcon />} onClick={rotate}>
                            {translate('ina_maps.editor.actions.rotate_key')}
                        </Button>
                    </Stack>
                )}
            </Box>

            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button fullWidth variant="contained" color="error" disabled={busy} onClick={save}>
                    {translate('ina_maps.editor.actions.save')}
                </Button>
            </Box>
        </Drawer>
    );
};

export default SettingsDrawer;
