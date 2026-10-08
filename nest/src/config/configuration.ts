export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  appToday: process.env.APP_TODAY ?? '2026-05-15',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
  avatarUrl:
    process.env.AVATAR_URL ??
    'https://api.dicebear.com/7.x/initials/svg?seed=John%20Doe',
});
