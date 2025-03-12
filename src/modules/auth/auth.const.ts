const REFRESH_TOKEN_EXPIRED_DAYS = 3;
const ACCESS_TOKEN_EXPIRED_MINUTES = 5;

/**
 *
 * @returns Refresh token expired timestamp (seconds).
 */
export const REFRESH_TOKEN_EXPIRED_TIMESTAMP = () => Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRED_DAYS * 60 * 60;

export const ACCESS_TOKEN_EXPIRED_TIMESTAMP = () => Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRED_MINUTES * 60;
