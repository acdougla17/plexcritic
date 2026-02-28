import { Router } from 'express';
import type { Request, Response, NextFunction} from 'express'
import { getPlexLibrary } from '../connectors/plex.js';
import type { PlexLibrary } from '../connectors/plex.js';

const router = Router();

router.get('/', async (_req: Request, res: Response, _next: NextFunction) => {
    console.log('--- getLibrary route called ---');
    let library: PlexLibrary = {
        movies: [],
        shows: [],
        music: [],
        misc: []
    };

    try {
        // fetch the Plex library and categorize it into movies, shows, music, and misc
        // must get response from Plex before sending the library data back to the client
        library = await getPlexLibrary();
        console.log('Plex library fetched successfully:', library);
        res.send(library);
    } catch (err: unknown) {
        res.statusMessage = err instanceof Error ? err.message : 'Error';
        res.status(503).send();
    }
});

export default router;