import { Router } from 'express';
import { getPlexLibrary } from '../connectors/plex.js';
const router = Router();
router.get('/', async (_req, res, _next) => {
    let library = {
        movies: [],
        shows: []
    };
    try {
        library = getPlexLibrary();
        res.send(library);
    }
    catch (err) {
        res.statusMessage = err instanceof Error ? err.message : 'Error';
        res.status(503).send();
    }
});
export default router;
//# sourceMappingURL=plex.js.map