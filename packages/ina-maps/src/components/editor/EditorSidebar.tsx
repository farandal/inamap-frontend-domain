import React from 'react';
import { useTranslate } from 'react-admin';
import { Box, Checkbox, Divider, List, ListItemButton, ListItemIcon, ListItemText, Paper, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import NearMeOutlinedIcon from '@mui/icons-material/NearMeOutlined';
import CropFreeIcon from '@mui/icons-material/CropFree';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import TimelineIcon from '@mui/icons-material/Timeline';
import LinkIcon from '@mui/icons-material/Link';
import StraightenIcon from '@mui/icons-material/Straighten';
import type { LayerKey, Layers } from 'ina-viewer';
import type { Panel, Tool } from './types';

/**
 * Contextual map, tool, and layer controls rendered as a floating rail over
 * the left edge of the editor canvas (independent of DashAdmin navigation).
 */

export interface EditorSidebarProps {
    panel: Panel;
    onPanel: (panel: Panel) => void;
    tool: Tool;
    onTool: (tool: Tool) => void;
    layers: Layers;
    onLayer: (key: LayerKey, value: boolean) => void;
}

const LAYER_COLORS: Record<LayerKey, string> = {
    background: '#94a3b8',
    zones: '#22C55E',
    structures: '#3B82F6',
    locations: '#E1251B',
    paths: '#2563EB',
    links: '#7C3AED',
    grid: '#cbd5e1',
};

export const EditorSidebar: React.FC<EditorSidebarProps> = ({ panel, onPanel, tool, onTool, layers, onLayer }) => {
    const translate = useTranslate();
    const collapsed = true;

    const navItems: { key: Panel; icon: React.ReactNode }[] = [
        { key: 'info', icon: <InfoOutlinedIcon /> },
        { key: 'editor', icon: <EditNoteIcon /> },
        { key: 'layouts', icon: <LayersOutlinedIcon /> },
        { key: 'settings', icon: <SettingsOutlinedIcon /> },
    ];
    const toolItems: { key: Tool; icon: React.ReactNode }[] = [
        { key: 'select', icon: <NearMeOutlinedIcon /> },
        { key: 'zone', icon: <CropFreeIcon /> },
        { key: 'structure', icon: <ApartmentIcon /> },
        { key: 'location', icon: <PlaceOutlinedIcon /> },
        { key: 'path', icon: <TimelineIcon /> },
        { key: 'link', icon: <LinkIcon /> },
        { key: 'measure', icon: <StraightenIcon /> },
    ];
    const layerKeys: LayerKey[] = ['background', 'zones', 'structures', 'locations', 'paths', 'links', 'grid'];

    const item = (key: string, label: string, icon: React.ReactNode, selected: boolean, onClick: () => void) => {
        const button = (
            <ListItemButton
                key={key}
                selected={selected}
                onClick={onClick}
                sx={{
                    mx: 0.75,
                    my: 0.2,
                    py: 0.45,
                    px: 0.5,
                    minHeight: 38,
                    justifyContent: 'center',
                    borderRadius: 1.25,
                    color: '#CBD5E1',
                    '& .MuiListItemIcon-root': { color: 'inherit', justifyContent: 'center', m: 0 },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                    '&.Mui-selected': { bgcolor: '#E1251B', color: '#FFFFFF' },
                    '&.Mui-selected:hover': { bgcolor: '#C91F17' },
                }}
            >
                    <ListItemIcon sx={{ minWidth: 0, width: 32, color: 'inherit', justifyContent: 'center' }}>{icon}</ListItemIcon>
                {!collapsed && <ListItemText primary={label} slotProps={{ primary: { sx: { fontSize: 14 } } }} />}
            </ListItemButton>
        );
        return collapsed ? (
            <Tooltip key={key} title={label} placement="right">
                {button}
            </Tooltip>
        ) : (
            button
        );
    };

    const header = () => <Divider sx={{ my: 0.75 }} />;

    const content = (
        <Box className="ina-editor-sidebar" sx={{ pb: 2, color: '#E2E8F0', '& .MuiDivider-root': { borderColor: 'rgba(226,232,240,0.16)' } }}>
            <Divider sx={{ my: 1, opacity: 0.3 }} />
            <List className="sidebar-list" component="nav" dense>
                {header()}
                {navItems.map((n) => item(n.key, translate(`ina_maps.editor.nav.${n.key}`), n.icon, panel === n.key, () => onPanel(n.key)))}
                {header()}
                {toolItems.map((t) =>
                    item(t.key, translate(`ina_maps.editor.tools.${t.key}`), t.icon, tool === t.key, () => {
                        onTool(t.key);
                        onPanel('editor');
                    }),
                )}
                {header()}
                {layerKeys.map((key) =>
                    item(
                        `layer-${key}`,
                        translate(`ina_maps.editor.layers.${key}`),
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                            <Checkbox
                                size="small"
                                checked={layers[key]}
                                onChange={() => undefined}
                                tabIndex={-1}
                                disableRipple
                                sx={{
                                    p: 0,
                                    color: LAYER_COLORS[key],
                                    '&.Mui-checked': { color: LAYER_COLORS[key] },
                                    '& .MuiSvgIcon-root': { fontSize: 20 },
                                }}
                            />
                            <Box sx={{ width: 7, height: 7, borderRadius: 0.5, bgcolor: LAYER_COLORS[key] }} />
                        </Box>,
                        false,
                        () => onLayer(key, !layers[key]),
                    ),
                )}
            </List>
        </Box>
    );

    return (
        <Paper elevation={8} sx={{ position: 'absolute', zIndex: 5, top: 100, left: 8, bottom: 62, width: 52, overflowY: 'auto', bgcolor: '#171C24', color: '#E2E8F0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
            {content}
        </Paper>
    );
};

export default EditorSidebar;
