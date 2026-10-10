import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { useTranslate } from 'react-admin';
import { Box, Checkbox, Divider, List, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Paper, Tooltip } from '@mui/material';
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
 * Secciones del editor (MAPA / HERRAMIENTAS / CAPAS) dentro del menú lateral
 * de la app, debajo de los recursos.
 *
 * El sidebar de dash-admin se construye solo con recursos (enlaces), sin un
 * espacio para contenido contextual de una página, así que mientras el
 * editor está montado se renderiza en un portal dentro de su área de scroll
 * (`.sidebar-drawer .dash-layout-sider-scrollbar`), con los mismos
 * componentes MUI que los ítems del menú. Si el contenedor no existe (sidebar
 * horizontal), se muestra como riel flotante dentro de la página.
 *
 * TODO(core): reemplazar el portal por un slot oficial del sidebar en
 * dash-frontend-core cuando exista.
 */

export interface EditorSidebarProps {
    panel: Panel;
    onPanel: (panel: Panel) => void;
    tool: Tool;
    onTool: (tool: Tool) => void;
    layers: Layers;
    onLayer: (key: LayerKey, value: boolean) => void;
}

const SIDEBAR_SELECTOR = '.sidebar-drawer .dash-layout-sider-scrollbar';

const LAYER_COLORS: Record<LayerKey, string> = {
    background: '#94a3b8',
    zones: '#22C55E',
    structures: '#3B82F6',
    locations: '#E1251B',
    paths: '#2563EB',
    links: '#7C3AED',
    grid: '#cbd5e1',
};

function useSidebarHost(): HTMLElement | null {
    const [host, setHost] = useState<HTMLElement | null>(null);

    useEffect(() => {
        let element: HTMLElement | null = null;
        let observer: MutationObserver | null = null;

        const attach = () => {
            const container = document.querySelector<HTMLElement>(SIDEBAR_SELECTOR);
            if (!container) return false;
            // react-custom-scrollbars envuelve el contenido en un primer <div> desplazable.
            const target = (container.firstElementChild as HTMLElement | null) ?? container;
            element = document.createElement('div');
            element.className = 'ina-editor-sidebar-host';
            target.appendChild(element);
            setHost(element);
            return true;
        };

        if (!attach()) {
            observer = new MutationObserver(() => {
                if (attach()) observer?.disconnect();
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }

        return () => {
            observer?.disconnect();
            element?.remove();
        };
    }, []);

    return host;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({ panel, onPanel, tool, onTool, layers, onLayer }) => {
    const translate = useTranslate();
    const host = useSidebarHost();
    const common = useSelector((state: any) => state.common ?? {});
    const collapsed = host ? !(common.navExpanded !== false && common.navSize !== 'small') : false;

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
            <ListItemButton key={key} selected={selected} onClick={onClick} sx={{ borderRadius: 1, mx: 0.5, py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36 }}>{icon}</ListItemIcon>
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

    const header = (text: string) =>
        collapsed ? (
            <Divider sx={{ my: 1 }} />
        ) : (
            <ListSubheader disableSticky sx={{ bgcolor: 'transparent', color: 'inherit', opacity: 0.7, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', lineHeight: '32px' }}>
                {text}
            </ListSubheader>
        );

    const content = (
        <Box className="ina-editor-sidebar" sx={{ pb: 2 }}>
            <Divider sx={{ my: 1, opacity: 0.3 }} />
            <List className="sidebar-list" component="nav" dense>
                {header(translate('ina_maps.editor.sections.map'))}
                {navItems.map((n) => item(n.key, translate(`ina_maps.editor.nav.${n.key}`), n.icon, panel === n.key, () => onPanel(n.key)))}
                {header(translate('ina_maps.editor.sections.tools'))}
                {toolItems.map((t) =>
                    item(t.key, translate(`ina_maps.editor.tools.${t.key}`), t.icon, tool === t.key, () => {
                        onTool(t.key);
                        onPanel('editor');
                    }),
                )}
                {header(translate('ina_maps.editor.sections.layers'))}
                {layerKeys.map((key) =>
                    item(
                        `layer-${key}`,
                        translate(`ina_maps.editor.layers.${key}`),
                        collapsed ? (
                            <Box sx={{ width: 16, height: 16, borderRadius: 0.5, bgcolor: layers[key] ? LAYER_COLORS[key] : 'transparent', border: `2px solid ${LAYER_COLORS[key]}` }} />
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Checkbox size="small" checked={layers[key]} sx={{ p: 0, color: 'inherit' }} tabIndex={-1} disableRipple />
                                <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: LAYER_COLORS[key] }} />
                            </Box>
                        ),
                        false,
                        () => onLayer(key, !layers[key]),
                    ),
                )}
            </List>
        </Box>
    );

    if (host) return createPortal(content, host);

    // Sin sidebar vertical: riel flotante dentro de la página.
    return (
        <Paper elevation={3} sx={{ position: 'absolute', zIndex: 5, top: 72, left: 12, bottom: 64, width: 220, overflowY: 'auto' }}>
            {content}
        </Paper>
    );
};

export default EditorSidebar;
