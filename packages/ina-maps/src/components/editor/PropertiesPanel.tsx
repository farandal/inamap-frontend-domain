import React, { useState } from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Chip,
    FormControlLabel,
    IconButton,
    MenuItem,
    Slider,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import CropFreeIcon from '@mui/icons-material/CropFree';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PlaceIcon from '@mui/icons-material/Place';
import TimelineIcon from '@mui/icons-material/Timeline';
import LinkIcon from '@mui/icons-material/Link';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import { useTranslate } from 'react-admin';
import { area, perimeter, polylineLength, round } from 'ina-viewer';
import type { Category, Location, Path, PathLink, Polygonal, Structure, VerticalType } from 'ina-viewer';
import { DEFAULT_COLORS } from './types';

/**
 * Panel derecho "Propiedades" del editor (diseño de referencia): datos del
 * elemento seleccionado. Los cambios se aplican al documento del layout en
 * memoria; Guardar los envía al servidor en una sola transacción. Los
 * enlaces se guardan al instante (dependen de caminos ya persistidos).
 */

const TYPE_ICON = { zone: CropFreeIcon, structure: ApartmentIcon, location: PlaceIcon, path: TimelineIcon, link: LinkIcon };

const PANEL_SX = {
    color: 'text.primary',
    fontSize: 13,
    '& .MuiButton-root': { minHeight: 28, px: 1, py: 0.35, fontSize: 12, lineHeight: 1.2 },
    '& .MuiIconButton-root': { p: 0.5 },
    '& .MuiChip-root': { height: 23, fontSize: 11 },
    '& .MuiSvgIcon-root': { fontSize: 18 },
    '& .MuiAccordion-root': { bgcolor: 'transparent', color: 'text.primary' },
    '& .MuiAccordionSummary-root': { minHeight: 40 },
    '& .MuiAccordionSummary-content': { my: 1 },
    '& .MuiInputBase-root': { bgcolor: 'background.default', color: 'text.primary', fontSize: 12 },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
    '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'text.secondary' },
    '& .MuiInputLabel-root': { color: 'text.secondary', fontSize: 12 },
    '& .MuiFormHelperText-root': { color: 'text.secondary' },
    '& .MuiAccordionSummary-expandIconWrapper': { color: 'text.secondary' },
};

interface CommonProps {
    unit: string;
    onClose: () => void;
    onDelete: () => void;
    beginChange: () => void;
}

interface PolygonProps extends CommonProps {
    kind: 'zone' | 'structure';
    item: Polygonal;
    onChange: (patch: Partial<Polygonal>) => void;
}

interface LocationProps extends CommonProps {
    kind: 'location';
    item: Location;
    categories: Category[];
    structures: Structure[];
    onChange: (patch: Partial<Location>) => void;
    onDownloadQr?: () => void;
}

interface PathProps extends CommonProps {
    kind: 'path';
    item: Path;
    onChange: (patch: Partial<Path>) => void;
}

interface LinkProps extends CommonProps {
    kind: 'link';
    item: PathLink;
    onChange: (patch: Partial<PathLink>) => void;
}

export type PropertiesPanelProps = PolygonProps | LocationProps | PathProps | LinkProps;

const Header: React.FC<{ kind: keyof typeof TYPE_ICON; onClose: () => void }> = ({ kind, onClose }) => {
    const translate = useTranslate();
    const Icon = TYPE_ICON[kind];
    return (
        <>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {translate('ina_maps.editor.properties.title')}
                </Typography>
                <IconButton size="small" onClick={onClose} aria-label={translate('ina_maps.editor.actions.close')}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Stack>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", pb: 2, mb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 1.5, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon color="success" />
                </Box>
                <Box>
                    <Typography sx={{ fontWeight: 700 }}>{translate(`ina_maps.editor.properties.types.${kind}`)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {translate(`ina_maps.editor.properties.descriptions.${kind}`)}
                    </Typography>
                </Box>
            </Stack>
        </>
    );
};

const Section: React.FC<{ title: string; defaultExpanded?: boolean; children: React.ReactNode }> = ({ title, defaultExpanded = false, children }) => (
    <Accordion defaultExpanded={defaultExpanded} disableGutters elevation={0} sx={{ '&:before': { display: 'none' }, borderBottom: '1px solid', borderColor: 'divider' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
            <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0 }}>{children}</AccordionDetails>
    </Accordion>
);

const ColorField: React.FC<{ label: string; value: string; onFocus: () => void; onChange: (v: string) => void; suffix?: React.ReactNode }> = ({ label, value, onFocus, onChange, suffix }) => (
    <Box>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
            {label}
        </Typography>
        <Stack direction="row" spacing={1}>
            <TextField
                size="small"
                fullWidth
                value={value}
                onFocus={onFocus}
                onChange={(e) => onChange(e.target.value)}
                slotProps={{ input: {
                    startAdornment: (
                        <input
                            type="color"
                            value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'}
                            onFocus={onFocus}
                            onChange={(e) => onChange(e.target.value.toUpperCase())}
                            style={{ width: 28, height: 28, border: 'none', padding: 0, marginRight: 8, background: 'none', cursor: 'pointer' }}
                        />
                    ),
                } }}
            />
            {suffix}
        </Stack>
    </Box>
);

const TermsEditor: React.FC<{ terms: string[]; onFocus: () => void; onChange: (t: string[]) => void }> = ({ terms, onFocus, onChange }) => {
    const translate = useTranslate();
    const [draft, setDraft] = useState('');
    const add = () => {
        const value = draft.trim();
        if (value && !terms.includes(value)) {
            onFocus();
            onChange([...terms, value]);
        }
        setDraft('');
    };
    return (
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75, mb: terms.length ? 1 : 0 }}>
                {terms.map((term) => (
                    <Chip
                        key={term}
                        size="small"
                        label={term}
                        onDelete={() => {
                            onFocus();
                            onChange(terms.filter((t) => t !== term));
                        }}
                    />
                ))}
            </Stack>
            <TextField
                variant="standard"
                fullWidth
                placeholder={translate('ina_maps.editor.properties.add_term')}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={add}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        add();
                    }
                }}
                slotProps={{ input: { disableUnderline: true } }}
            />
        </Box>
    );
};

/** Pares clave/valor de metadata (excluye `style`, que tiene su propia sección). */
const MetadataEditor: React.FC<{ metadata: Record<string, unknown>; onFocus: () => void; onChange: (m: Record<string, unknown>) => void }> = ({ metadata, onFocus, onChange }) => {
    const translate = useTranslate();
    const entries = Object.entries(metadata).filter(([key]) => key !== 'style');
    const setEntry = (index: number, key: string, value: string) => {
        const next = entries.map((e, i) => (i === index ? [key, value] : e));
        onChange({ ...(metadata.style ? { style: metadata.style } : {}), ...Object.fromEntries(next.filter(([k]) => k)) });
    };
    return (
        <Stack spacing={1}>
            {entries.map(([key, value], i) => (
                <Stack direction="row" spacing={1} key={i}>
                    <TextField size="small" label={translate('ina_maps.editor.properties.key')} value={key} onFocus={onFocus} onChange={(e) => setEntry(i, e.target.value, String(value ?? ''))} />
                    <TextField size="small" label={translate('ina_maps.editor.properties.value')} value={String(value ?? '')} onFocus={onFocus} onChange={(e) => setEntry(i, key, e.target.value)} />
                    <IconButton
                        size="small"
                        onClick={() => {
                            onFocus();
                            onChange(Object.fromEntries(Object.entries(metadata).filter(([k]) => k !== key)));
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Stack>
            ))}
            <Button
                size="small"
                onClick={() => {
                    onFocus();
                    onChange({ ...metadata, [`campo_${entries.length + 1}`]: '' });
                }}
            >
                + {translate('ina_maps.editor.properties.add_metadata')}
            </Button>
        </Stack>
    );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <Box sx={{ flex: 1 }}>
        <Typography variant="body2" color="text.secondary">
            {label}
        </Typography>
        <Typography>{value}</Typography>
    </Box>
);

const DeleteButton: React.FC<{ onDelete: () => void }> = ({ onDelete }) => {
    const translate = useTranslate();
    return (
        <Button fullWidth variant="outlined" color="error" startIcon={<DeleteOutlineIcon />} onClick={onDelete} sx={{ mt: 2 }}>
            {translate('ina_maps.editor.actions.delete')}
        </Button>
    );
};

export const PropertiesPanel: React.FC<PropertiesPanelProps> = (props) => {
    const translate = useTranslate();
    const t = (key: string) => translate(`ina_maps.editor.properties.${key}`);
    const { unit, onClose, onDelete, beginChange } = props;

    if (props.kind === 'zone' || props.kind === 'structure') {
        const { item, onChange, kind } = props;
        const defaults = DEFAULT_COLORS[kind];
        const style = (item.metadata?.style ?? {}) as { stroke?: string; opacity?: number };
        const opacity = typeof style.opacity === 'number' ? style.opacity : defaults.opacity;
        const setStyle = (patch: { stroke?: string; opacity?: number }) =>
            onChange({ metadata: { ...(item.metadata ?? {}), style: { ...style, ...patch } } });

        return (
            <Box sx={PANEL_SX}>
                <Header kind={kind} onClose={onClose} />
                <Section title={t('basic')} defaultExpanded>
                    <Stack spacing={2}>
                        <TextField size="small" required label={t('label')} value={item.label} onFocus={beginChange} onChange={(e) => onChange({ label: e.target.value })} />
                        <TextField size="small" required label={t('code')} value={item.code ?? ''} onFocus={beginChange} onChange={(e) => onChange({ code: e.target.value })} />
                        <ColorField
                            label={translate('ina_maps.editor.toolbar.fill_color')}
                            value={item.color ?? defaults.fill}
                            onFocus={beginChange}
                            onChange={(color) => onChange({ color })}
                            suffix={<TextField size="small" sx={{ width: 90 }} value={`${Math.round(opacity * 100)}%`} slotProps={{ input: { readOnly: true } }} />}
                        />
                        <ColorField label={translate('ina_maps.editor.toolbar.stroke_color')} value={style.stroke ?? defaults.stroke} onFocus={beginChange} onChange={(stroke) => setStyle({ stroke })} />
                        <Box>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                {t('terms')}
                            </Typography>
                            <TermsEditor terms={item.terms ?? []} onFocus={beginChange} onChange={(terms) => onChange({ terms })} />
                        </Box>
                    </Stack>
                </Section>
                <Section title={t('metadata')}>
                    <MetadataEditor metadata={(item.metadata ?? {}) as Record<string, unknown>} onFocus={beginChange} onChange={(metadata) => onChange({ metadata })} />
                </Section>
                <Section title={t('style')}>
                    <Typography variant="body2">{translate('ina_maps.editor.toolbar.opacity')}</Typography>
                    <Slider
                        size="small"
                        value={Math.round(opacity * 100)}
                        min={5}
                        max={100}
                        onChangeCommitted={() => undefined}
                        onMouseDown={beginChange}
                        onChange={(_, v) => setStyle({ opacity: (v as number) / 100 })}
                        valueLabelDisplay="auto"
                    />
                </Section>
                <Section title={t('geometry')} defaultExpanded>
                    <Stack direction="row" sx={{ mb: 1 }}>
                        <Stat label={t('vertices')} value={String(item.polygon.length)} />
                    </Stack>
                    <Stack direction="row">
                        <Stat label={t('area')} value={`${round(area(item.polygon), 1)} ${unit}²`} />
                        <Stat label={t('perimeter')} value={`${round(perimeter(item.polygon), 1)} ${unit}`} />
                    </Stack>
                </Section>
                <DeleteButton onDelete={onDelete} />
            </Box>
        );
    }

    if (props.kind === 'location') {
        const { item, onChange, categories, structures, onDownloadQr } = props;
        return (
            <Box sx={PANEL_SX}>
                <Header kind="location" onClose={onClose} />
                <Section title={t('basic')} defaultExpanded>
                    <Stack spacing={2}>
                        <TextField size="small" required label={t('label')} value={item.label} onFocus={beginChange} onChange={(e) => onChange({ label: e.target.value })} />
                        <TextField size="small" label={t('code')} value={item.code ?? ''} onFocus={beginChange} onChange={(e) => onChange({ code: e.target.value })} />
                        <TextField
                            select
                            size="small"
                            label={t('category')}
                            value={item.category_id ?? ''}
                            onFocus={beginChange}
                            onChange={(e) => onChange({ category_id: e.target.value || null })}
                        >
                            <MenuItem value="">{t('no_category')}</MenuItem>
                            {categories.map((c) => (
                                <MenuItem key={c.id} value={c.id}>
                                    {c.breadcrumbed_name ?? c.name}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            select
                            size="small"
                            label={t('structure')}
                            value={item.structure_id ?? ''}
                            onFocus={beginChange}
                            onChange={(e) => onChange({ structure_id: e.target.value || null })}
                        >
                            <MenuItem value="">{t('no_structure')}</MenuItem>
                            {structures.map((s) => (
                                <MenuItem key={s.id} value={s.id}>
                                    {s.label}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField size="small" label={t('icon')} value={item.icon ?? ''} onFocus={beginChange} onChange={(e) => onChange({ icon: e.target.value })} helperText="wc, info, restaurant, …" />
                        <TextField size="small" label={t('qr_url')} value={item.qr_url ?? ''} onFocus={beginChange} onChange={(e) => onChange({ qr_url: e.target.value || null })} />
                        <Box>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                {t('terms')}
                            </Typography>
                            <TermsEditor terms={item.terms ?? []} onFocus={beginChange} onChange={(terms) => onChange({ terms })} />
                        </Box>
                    </Stack>
                </Section>
                <Section title={t('metadata')}>
                    <MetadataEditor metadata={(item.metadata ?? {}) as Record<string, unknown>} onFocus={beginChange} onChange={(metadata) => onChange({ metadata })} />
                </Section>
                <Section title={t('position')} defaultExpanded>
                    <Stack direction="row" spacing={1}>
                        <TextField size="small" type="number" label="X" value={round(item.x, 2)} onFocus={beginChange} onChange={(e) => onChange({ x: Number(e.target.value) })} />
                        <TextField size="small" type="number" label="Y" value={round(item.y, 2)} onFocus={beginChange} onChange={(e) => onChange({ y: Number(e.target.value) })} />
                    </Stack>
                </Section>
                {onDownloadQr && (
                    <Button fullWidth variant="outlined" startIcon={<QrCode2Icon />} onClick={onDownloadQr} sx={{ mt: 2 }}>
                        {translate('ina_maps.editor.actions.download_qr')}
                    </Button>
                )}
                <DeleteButton onDelete={onDelete} />
            </Box>
        );
    }

    if (props.kind === 'path') {
        const { item, onChange } = props;
        return (
            <Box sx={PANEL_SX}>
                <Header kind="path" onClose={onClose} />
                <Section title={t('basic')} defaultExpanded>
                    <Stack spacing={2}>
                        <TextField size="small" label={t('label')} value={item.label ?? ''} onFocus={beginChange} onChange={(e) => onChange({ label: e.target.value })} />
                        <TextField
                            select
                            size="small"
                            label={t('direction')}
                            value={item.direction}
                            onChange={(e) => {
                                beginChange();
                                onChange({ direction: e.target.value as Path['direction'] });
                            }}
                        >
                            {(['both', 'forward', 'backward'] as const).map((d) => (
                                <MenuItem key={d} value={d}>
                                    {t(`directions.${d}`)}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Stack>
                </Section>
                <Section title={t('geometry')} defaultExpanded>
                    <Stack direction="row">
                        <Stat label={t('vertices')} value={String(item.points.length)} />
                        <Stat label={t('length')} value={`${round(polylineLength(item.points), 1)} ${unit}`} />
                    </Stack>
                </Section>
                <DeleteButton onDelete={onDelete} />
            </Box>
        );
    }

    const { item, onChange } = props as LinkProps;
    return (
        <Box sx={PANEL_SX}>
            <Header kind="link" onClose={onClose} />
            <Section title={t('basic')} defaultExpanded>
                <Stack spacing={2}>
                    <TextField size="small" label={t('link_kind')} value={translate(`ina_maps.editor.properties.types.link`) + (item.kind === 'vertical' ? ' ↕' : '')} slotProps={{ input: { readOnly: true } }} />
                    {item.kind === 'vertical' && (
                        <TextField select size="small" label={t('vertical_type')} value={item.vertical_type ?? 'elevator'} onChange={(e) => onChange({ vertical_type: e.target.value as VerticalType })}>
                            {(['elevator', 'ramp', 'stairs', 'escalator'] as const).map((v) => (
                                <MenuItem key={v} value={v}>
                                    {translate(`ina_maps.editor.vertical_types.${v}`)}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}
                    <TextField
                        size="small"
                        type="number"
                        label={t('cost')}
                        value={item.cost ?? ''}
                        onChange={(e) => onChange({ cost: e.target.value === '' ? null : Number(e.target.value) })}
                    />
                    <FormControlLabel control={<Switch checked={item.bidirectional ?? true} onChange={(e) => onChange({ bidirectional: e.target.checked })} />} label={t('bidirectional')} />
                    {item.kind === 'vertical' && (
                        <Chip size="small" color={item.is_accessible ? 'success' : 'warning'} label={item.is_accessible ? t('accessible') : t('not_accessible')} sx={{ alignSelf: 'flex-start' }} />
                    )}
                </Stack>
            </Section>
            <DeleteButton onDelete={onDelete} />
        </Box>
    );
};

export default PropertiesPanel;
