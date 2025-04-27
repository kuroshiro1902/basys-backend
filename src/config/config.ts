export const CONFIG = {
  refresh_token: {
    cookie_key: 'refresh_token',
    // TODO: Change to 3 days or more
    expired_days: 1,
    max_amount_per_user: Number.MAX_SAFE_INTEGER,
  },
  access_token: {
    // TODO: Change to 15 minutes or more
    expired_minutes: 3,
  },
};
