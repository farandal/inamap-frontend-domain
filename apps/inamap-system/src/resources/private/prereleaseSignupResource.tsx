/**
 * Pre-release Signup Resource for INAMAP System
 *
 * CRUD over the landing-page pre-release interest signups.
 * System admin role only.
 */
import { IDashAutoAdminResourceConfig } from "dash-auto-admin";
import { ResourceTemplate } from "dash-admin";
import { DASHAppConstants } from "dash-constants";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import prereleaseSignupSchema from "./schemas/prerelease_signup";

const drawerSettings = {
    drawer: true,
    drawerOptions: {
        view: true,
        edit: true,
        create: true,
    },
    listViewButton: { props: { buttonProps: { variant: 'text', size: 'small' }, label: '' } },
    listEditButton: { props: { buttonProps: { variant: 'text', size: 'small' }, label: '' } },
};

export const prereleaseSignupResource: IDashAutoAdminResourceConfig = {
    roles: [DASHAppConstants.system.SYSTEM_ROLE],
    component: ResourceTemplate,
    model: 'prerelease/signup',
    label: 'Pre-release Signups',
    group: "System",
    icon: <RocketLaunchIcon />,

    schema: prereleaseSignupSchema,

    menu: [
        {
            title: 'All Signups',
            redirect: '/prerelease/signup',
        },
    ],

    mainAction: {
        title: 'Create Signup',
        fn: "redirect",
        mode: "create",
        redirect: "create",
    },

    view: true,
    create: true,
    edit: true,

    ...drawerSettings,
};

export default prereleaseSignupResource;
