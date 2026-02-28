import { config } from "../config.js";
//import { request } from 'http'
export function getPlexLibrary() {
    console.log('Getting Plex library...');
    const plexIp = config.plexUrl;
    const plexPort = config.plexPort;
    const plexToken = config.plexToken;
    const url = `http://${plexIp}:${plexPort}/library/sections?X-Plex-Token=${plexToken}`;
    console.log('Plex URL:', url);
    const rp = require('request-promise');
    console.log('Requesting Plex library...');
    rp(url).then((body) => {
        console.log(body);
    }).catch((err) => {
        console.log(err);
    });
    return {
        libraries: [],
        movies: [],
        shows: []
    };
}
//# sourceMappingURL=plex.js.map