import React from 'react';
import { useParams } from 'react-router-dom';
import ResourceTemplate from 'dash-admin/src/templates/ResourceTemplate';
import { IDashAutoAdminAttribute, IDashAutoAdminResourceConfig } from 'dash-auto-admin';
import { DASHAppConstants } from 'dash-constants';
import MapIcon from '@mui/icons-material/Map';
import InamapEditor from '../components/editor/InamapEditor';

const Icon = MapIcon as unknown as React.FC;

// Acciones de ruta que nunca son un id (la vista show es /inamaps/:id/show).
const ROUTE_ACTIONS = new Set(['show', 'edit', 'create']);
const idFromPath = (): string => {
    const segments = window.location.pathname.split('/').filter(Boolean);
    for (let i = segments.length - 1; i >= 0; i--) {
        if (!ROUTE_ACTIONS.has(segments[i])) return segments[i];
    }
    return '';
};

export const inamapSchema = [
    {
        tab: 'ina_maps.inamap.tabs.general',
        attribute: 'name',
        label: 'ina_maps.inamap.fields.name',
        type: String,
        inList: true,
    },
    {
        tab: 'ina_maps.inamap.tabs.general',
        attribute: 'description',
        label: 'ina_maps.inamap.fields.description',
        type: 'textarea',
        inList: false,
    },
    {
        // La unidad solo se elige al crear: cambiarla con geometría existente
        // reinterpretaría todas las coordenadas (el backend lo ignora).
        tab: 'ina_maps.inamap.tabs.general',
        attribute: 'unit',
        label: 'ina_maps.inamap.fields.unit',
        type: 'select',
        options: [{ id: 'm', name: 'ina_maps.inamap.units.m' }],
        fieldProps: { defaultValue: 'm' },
        inList: false,
        inEdit: false,
    },
    {
        tab: 'ina_maps.inamap.tabs.general',
        attribute: 'status',
        label: 'ina_maps.inamap.fields.status',
        type: 'select',
        options: [
            { id: 'draft', name: 'ina_maps.inamap.status.draft' },
            { id: 'published', name: 'ina_maps.inamap.status.published' },
        ],
        inList: true,
        inCreate: false,
        inEdit: false,
        readOnly: true,
    },
    {
        tab: 'ina_maps.inamap.tabs.general',
        attribute: 'is_active',
        label: 'ina_maps.inamap.fields.is_active',
        type: Boolean,
        inList: true,
    },
    {
        tab: 'ina_maps.inamap.tabs.general',
        attribute: 'published_at',
        label: 'ina_maps.inamap.fields.published_at',
        type: Date,
        inList: true,
        inCreate: false,
        inEdit: false,
        readOnly: true,
    },
    {
        tab: 'ina_maps.inamap.tabs.access',
        attribute: 'settings.access_mode',
        label: 'ina_maps.inamap.fields.access_mode',
        type: 'select',
        options: [
            { id: 'open', name: 'ina_maps.inamap.access_modes.open' },
            { id: 'token_required', name: 'ina_maps.inamap.access_modes.token_required' },
        ],
        fieldProps: { defaultValue: 'open' },
        inList: false,
    },
    {
        tab: 'ina_maps.inamap.tabs.access',
        attribute: 'settings.session_ttl_minutes',
        label: 'ina_maps.inamap.fields.session_ttl_minutes',
        type: Number,
        fieldProps: { defaultValue: 60 },
        inList: false,
    },
    {
        tab: 'ina_maps.inamap.tabs.general',
        attribute: 'settings.allow_zone_overlap',
        label: 'ina_maps.inamap.fields.allow_zone_overlap',
        type: Boolean,
        fieldProps: { defaultValue: false },
        inList: false,
    },
    {
        tab: 'ina_maps.inamap.tabs.general',
        attribute: 'created_at',
        label: 'ina_maps.inamap.fields.created_at',
        type: Date,
        inList: true,
        inCreate: false,
        inEdit: false,
        readOnly: true,
    },
] as IDashAutoAdminAttribute[];

/**
 * Inamaps. Igual que el proyecto de laboratorio en VaneXa: la vista "show" es
 * una página completa — aquí el editor de mapas (InamapEditor).
 */
const InamapResource: IDashAutoAdminResourceConfig = {
    roles: [DASHAppConstants.system.SYSTEM_ROLE, 'TenancyAdmin', 'Tenant', 'User'],
    component: ResourceTemplate,
    trash: false,
    model: 'inamaps',
    label: 'ina_maps.inamap.label',
    group: 'ina_maps.groups.maps',
    schema: inamapSchema,
    icon: <Icon />,
    menu: [{ title: 'ina_maps.inamap.menu_list', redirect: '/inamaps' }],
    mainAction: {
        title: 'ina_maps.inamap.main_action',
        mode: 'create',
        fn: 'virtualhash',
        redirect: 'inline/create',
    },
    showComponent: () => {
        const InamapShow = () => {
            const params = useParams<{ id?: string }>();
            const id = params.id ?? idFromPath();
            return id ? <InamapEditor inamapId={id} /> : null;
        };
        return <InamapShow />;
    },
    view: true,
    create: true,
    edit: true,
    drawer: false,
    drawerOptions: { create: true, edit: true, view: false },
    mutationMode: 'pessimistic',
    formGroupMode: 'tabs',
    listProps: { storeKey: false },
    // `layouts` es una relación de solo lectura que el recurso devuelve.
    postFormatter: (params) => {
        const { layouts: _layouts, public_url: _url, ...rest } = params;
        return rest;
    },
};

export default InamapResource;
