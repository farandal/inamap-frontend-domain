import React from 'react';
import ResourceTemplate from 'dash-admin/src/templates/ResourceTemplate';
import { IDashAutoAdminAttribute, IDashAutoAdminResourceConfig } from 'dash-auto-admin';
import { DASHAppConstants } from 'dash-constants';
import CategoryIcon from '@mui/icons-material/Category';
import CategoryListComponent from '../components/CategoryTree/CategoryListComponent';

const Icon = CategoryIcon as unknown as React.FC;

export const inamapCategorySchema = [
    { attribute: 'name', label: 'ina_maps.category.fields.name', type: String, inList: true },
    { attribute: 'color', label: 'ina_maps.category.fields.color', type: String, inList: true },
    { attribute: 'icon', label: 'ina_maps.category.fields.icon', type: String, inList: false },
] as IDashAutoAdminAttribute[];

/**
 * Categorías de ubicaciones: mismo árbol arrastrable (react-arborist) y el
 * mismo contrato `updateTree` que las categorías de catálogo del framework.
 */
const InamapCategoryResource: IDashAutoAdminResourceConfig = {
    roles: [DASHAppConstants.system.SYSTEM_ROLE, 'TenancyAdmin', 'Tenant', 'User'],
    component: ResourceTemplate,
    trash: false,
    model: 'inamap/categories',
    label: 'ina_maps.category.label',
    group: 'ina_maps.groups.maps',
    schema: inamapCategorySchema,
    icon: <Icon />,
    menu: [{ title: 'ina_maps.category.menu_list', redirect: '/inamap/categories' }],
    mainAction: {
        title: 'ina_maps.category.main_action',
        mode: 'create',
        fn: 'virtualhash',
        redirect: 'inline/create',
    },
    drawer: true,
    drawerOptions: { create: true, edit: true, view: true },
    listComponent: () => <CategoryListComponent method="edit" attribute={undefined} resourceConfig={undefined} />,
    refreshAfter: true,
    mutationMode: 'pessimistic',
    saveButtonAlwaysEnabled: true,
};

export default InamapCategoryResource;
