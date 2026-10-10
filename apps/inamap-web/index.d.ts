/// <reference types="vite/client" />

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg';
declare module '*.ttf';
declare module '*.woff';
declare module '*.woff2';

/**
 * Service-account API key reveal.
 *
 * The component lives in dash-frontend-core and is resolved at runtime by the
 * LINK_DASH_CORE vite alias, but tsc still resolves dash-admin types from the
 * published @dashadmin/dash-admin package, which does not yet ship this file.
 *
 * Remove this declaration once dash-admin is republished and the dependency
 * bumped — the real typings will take over.
 */
declare module 'dash-admin/components/serviceAccount/ApiKeyRevealDialog' {
	import { FC } from 'react';

	export interface IApiKeyRevealContentProps {
		token: string;
		name?: string | null;
	}

	export const ApiKeyRevealContent: FC<IApiKeyRevealContentProps>;
	const _default: FC<IApiKeyRevealContentProps>;
	export default _default;
}

declare module 'dash-admin/components/serviceAccount/ServiceAccountStatusSwitch' {
	import { FC } from 'react';

	const ServiceAccountStatusSwitch: FC<any>;
	export default ServiceAccountStatusSwitch;
}
