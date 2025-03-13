import { CONFIG } from '@/config/config';

/**
 *
 * @returns Refresh token expired timestamp (seconds).
 */
export const REFRESH_TOKEN_EXPIRED_TIMESTAMP = () => Math.floor(Date.now() / 1000) + CONFIG.refresh_token.expired_days * 24 * 60 * 60;

export const ACCESS_TOKEN_EXPIRED_TIMESTAMP = () => Math.floor(Date.now() / 1000) + CONFIG.access_token.expired_minutes * 60;
