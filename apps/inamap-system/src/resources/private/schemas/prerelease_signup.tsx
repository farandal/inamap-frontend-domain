import { IDashAutoAdminAttribute } from 'dash-auto-admin';

/**
 * Schema for Pre-release Signups (landing page interest capture)
 * API Endpoint: /api/prerelease/signup
 */
const prereleaseSignupSchema: IDashAutoAdminAttribute[] = [
    {
        tab: 'Signup',
        label: 'Name',
        attribute: 'name',
        type: String,
        inList: true,
        inEdit: true,
        inShow: true,
        inCreate: true,
    },
    {
        tab: 'Signup',
        label: 'Email',
        attribute: 'email',
        type: String,
        inList: true,
        inEdit: true,
        inShow: true,
        inCreate: true,
    },
    {
        tab: 'Signup',
        label: 'Contact Phone',
        attribute: 'contact_phone',
        type: String,
        inList: true,
        inEdit: true,
        inShow: true,
        inCreate: true,
    },
    {
        tab: 'Signup',
        label: 'Business Website',
        attribute: 'business_website',
        type: String,
        inList: true,
        inEdit: true,
        inShow: true,
        inCreate: true,
    },
    {
        tab: 'Signup',
        label: 'Business Instagram',
        attribute: 'business_instagram',
        type: String,
        inList: true,
        inEdit: true,
        inShow: true,
        inCreate: true,
    },
    {
        tab: 'Signup',
        label: 'Preferred Language',
        attribute: 'preferred_language',
        type: String,
        inList: true,
        inEdit: true,
        inShow: true,
        inCreate: true,
    },
    {
        tab: 'Signup',
        label: 'Signed Up At',
        attribute: 'created_at',
        type: Date,
        inList: true,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
];

export default prereleaseSignupSchema;
