import { IDashAutoAdminResourceConfig } from "dash-auto-admin";

/**
 * Tenancy Resources for the System Private Web App
*/

const drawerSettings = {
    drawer: true,
    drawerOptions: {
        view: true,
        edit: true,
        create: false,
    },
    listViewButton: { props: { buttonProps: { variant: 'text', size: 'small' }, label: '' } },
    listEditButton: { props: { buttonProps: { variant: 'text', size: 'small' }, label: '' } },
};



const tenancyResources: IDashAutoAdminResourceConfig[] = [
   
];

export default tenancyResources;