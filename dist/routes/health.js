import { Router } from 'express';
const router = Router();
router.get('/', async (_req, res, _next) => {
    const healthcheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now(),
    };
    try {
        res.send(healthcheck);
    }
    catch (err) {
        healthcheck.message = err instanceof Error ? err.message : 'Error';
        res.status(503).send();
    }
});
export default router;
//# sourceMappingURL=health.js.map