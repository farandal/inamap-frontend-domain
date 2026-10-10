import React, { useEffect, useMemo, useState } from 'react';
import { useNotify, useTranslate } from 'react-admin';
import { Alert, Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, List, ListItemButton, ListItemText, Stack, Switch, TextField, Typography } from '@mui/material';
import { formatDistance, formatDuration } from 'ina-viewer';
import type { Layout, Location, RouteResult, Structure, VerticalType, Zone } from 'ina-viewer';
import { apiErrorMessage, InamapApi } from '../../api/useInamapApi';

/** Elige el medio de un enlace entre pisos (S5: ascensor, rampa, escalera, escalera mecánica). */
export const LinkTypeDialog: React.FC<{ open: boolean; onCancel: () => void; onConfirm: (type: VerticalType) => void }> = ({ open, onCancel, onConfirm }) => {
    const translate = useTranslate();
    const types: { key: VerticalType; accessible: boolean }[] = [
        { key: 'elevator', accessible: true },
        { key: 'ramp', accessible: true },
        { key: 'stairs', accessible: false },
        { key: 'escalator', accessible: false },
    ];
    return (
        <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
            <DialogTitle>{translate('ina_maps.editor.link_dialog.title')}</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {translate('ina_maps.editor.link_dialog.description')}
                </Typography>
                <List>
                    {types.map(({ key, accessible }) => (
                        <ListItemButton key={key} onClick={() => onConfirm(key)} sx={{ borderRadius: 1 }}>
                            <ListItemText
                                primary={translate(`ina_maps.editor.vertical_types.${key}`)}
                                secondary={translate(accessible ? 'ina_maps.editor.properties.accessible' : 'ina_maps.editor.properties.not_accessible')}
                            />
                        </ListItemButton>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>{translate('ina_maps.editor.toolbar.cancel')}</Button>
            </DialogActions>
        </Dialog>
    );
};

interface EndpointOption {
    ref: string;
    label: string;
    group: string;
}

/**
 * "Probar ruta": calcula una ruta autenticada (también sobre borradores)
 * entre dos elementos de cualquier piso y la entrega al editor para dibujarla.
 */
export const RouteTestDialog: React.FC<{
    open: boolean;
    onClose: () => void;
    inamapId: string;
    layouts: Layout[];
    api: InamapApi;
    onRoute: (route: RouteResult | null) => void;
}> = ({ open, onClose, inamapId, layouts, api, onRoute }) => {
    const translate = useTranslate();
    const notify = useNotify();
    const t = (key: string, options?: object) => translate(`ina_maps.editor.route_dialog.${key}`, options);
    const [options, setOptions] = useState<EndpointOption[]>([]);
    const [from, setFrom] = useState<EndpointOption | null>(null);
    const [to, setTo] = useState<EndpointOption | null>(null);
    const [accessible, setAccessible] = useState(false);
    const [result, setResult] = useState<RouteResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const layoutName = useMemo(() => Object.fromEntries(layouts.map((l) => [l.id, l.name])), [layouts]);

    useEffect(() => {
        if (!open) return;
        Promise.all(
            layouts.map((layout) => api.getGeometry(layout.id).catch(() => null)),
        ).then((docs) => {
            const list: EndpointOption[] = [];
            const typeLabel = (type: string) => translate(`ina_maps.editor.properties.types.${type}`);
            docs.forEach((doc) => {
                if (!doc) return;
                const group = layoutName[doc.layout.id] ?? '';
                doc.locations.forEach((l: Location) => list.push({ ref: `location:${l.id}`, label: `${l.label} (${typeLabel('location')})`, group }));
                doc.structures.forEach((s: Structure) => list.push({ ref: `structure:${s.id}`, label: `${s.label} (${typeLabel('structure')})`, group }));
                doc.zones.forEach((z: Zone) => list.push({ ref: `zone:${z.id}`, label: `${z.label} (${typeLabel('zone')})`, group }));
            });
            setOptions(list);
        });
    }, [open, layouts, api, layoutName, translate]);

    const calculate = async () => {
        if (!from || !to) return;
        setError(null);
        try {
            const route = await api.routePreview(inamapId, from.ref, to.ref, accessible);
            setResult(route);
            onRoute(route);
        } catch (e: any) {
            const code = e?.response?.data?.error?.code;
            setError(code ? translate(`ina_maps.errors.${code}`, { _: apiErrorMessage(e) }) : apiErrorMessage(e));
            setResult(null);
            onRoute(null);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <Autocomplete options={options} groupBy={(o) => o.group} getOptionLabel={(o) => o.label} value={from} onChange={(_, v) => setFrom(v)} renderInput={(params) => <TextField {...params} label={t('from')} size="small" />} />
                    <Autocomplete options={options} groupBy={(o) => o.group} getOptionLabel={(o) => o.label} value={to} onChange={(_, v) => setTo(v)} renderInput={(params) => <TextField {...params} label={t('to')} size="small" />} />
                    <FormControlLabel control={<Switch checked={accessible} onChange={(e) => setAccessible(e.target.checked)} />} label={t('accessible')} />
                    {error && <Alert severity="warning">{error}</Alert>}
                    {result && (
                        <Alert severity="success">
                            {t('result', {
                                distance: formatDistance(result.distance, result.unit),
                                time: formatDuration(result.estimated_seconds),
                                steps: result.steps.length,
                            })}
                            <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                                {result.steps.map((s, i) => (
                                    <li key={i}>
                                        {s.layout_name ?? layoutName[s.layout_id]} — {formatDistance(s.distance, result.unit)}
                                        {s.transition ? ` → ${translate(`ina_maps.editor.vertical_types.${s.transition.vertical_type ?? 'elevator'}`)}` : ''}
                                    </li>
                                ))}
                            </ol>
                        </Alert>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{translate('ina_maps.editor.actions.close')}</Button>
                <Button variant="contained" color="error" disabled={!from || !to} onClick={calculate}>
                    {translate('ina_maps.editor.actions.calculate')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
