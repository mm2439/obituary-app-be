const isProd = process.env.NODE_ENV === 'production';

const defaultCookieOptions = (overrides = {}) => ({
  httpOnly: true,          // must be true for security (can't be accessed by JS)
  secure: isProd,          // true in prod (https)
  sameSite: isProd ? 'None' : 'Lax', // None for cross-site in production
  path: '/',
  domain: isProd ? '.osmrtnica.com' : undefined,
  ...overrides,
});

module.exports = { defaultCookieOptions };