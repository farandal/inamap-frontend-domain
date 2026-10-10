import { getEnv } from 'dash-constants';

/**
 * Release stage flag (env-driven, see VITE_APP_RELEASE_STAGE in .env.inamap.*).
 *
 * 'pre-release' → coming-soon landing with email capture, Plans hidden,
 *                 /signup gated behind an invitation code.
 * anything else → full release behavior.
 */
export const isPreRelease = (): boolean =>
    String(getEnv('APP_RELEASE_STAGE') || 'release').trim().toLowerCase() === 'pre-release';

/** Invitation code required to reach the signup form while in pre-release. */
export const getPreReleaseInvitationCode = (): string =>
    String(getEnv('APP_PRERELEASE_INVITATION_CODE') || '').trim();
