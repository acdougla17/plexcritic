import { config } from "../config.js";
import axios from 'axios';

export interface PlexLibrary {
    movies: PlexLibrarySection[],
    shows: PlexLibrarySection[],
    music: PlexLibrarySection[],
    misc: PlexLibrarySection[]
}

export interface PlexMediaContainer {
    size: number,
    allowCameraUpload: boolean,
    allowChannelAccess: boolean,
    allowMediaDeletion: boolean,
    allowSharing: boolean,
    allowSync: boolean,
    allowTuners: boolean,
    backgroundProcessing: boolean,
    certificate: boolean,
    companionProxy: boolean,
    countryCode: string,
    diagnostics: string,
    eventStream: boolean,
    friendlyName: string,
    hubSearch: boolean,
    itemClusters: boolean,
    livetv: number,
    machineIdentifier: string,
    mediaProviders: boolean,
    multiuser: boolean,
    musicAnalysis: number,
    myPlex: boolean,
    myPlexMappingState: string,
    myPlexSigninState: string,
    myPlexSubscription: boolean,
    myPlexUsername: string,
    offlineTranscode: number,
    ownerFeatures: string,
    platform: string,
    platformVersion: string,
    pluginHost: boolean,
    pushNotifications: boolean,
    readOnlyLibraries: boolean,
    streamingBrainABRVersion: number,
    streamingBrainVersion: number,
    sync: boolean,
    transcoderActiveVideoSessions: number,
    transcoderAudio: boolean,
    transcoderLyrics: boolean,
    transcoderPhoto: boolean,
    transcoderSubtitles: boolean,
    transcoderVideo: boolean,
    transcoderVideoBitrates: string,
    transcoderVideoQualities: string,
    transcoderVideoResolutions: string,
    updatedAt: number,
    updater: boolean,
    version: string,
    voiceSearch: boolean,
    Directory: [PlexLibrarySection]
}

export interface PlexLibrarySection {
    allowSync: boolean,
    filters: boolean,
    refreshing: boolean,
    key: string,
    type: string,
    title: string,
    agent: string,
    scanner: string,
    language: string,
    uuid: string,
    updatedAt: number,
    createdAt: number,
    scannedAt: number,
    content: boolean,
    directory: boolean,
    contentChangedAt: number,
    hidden: number,
    // Location: [ [Object] ]
}


export interface PlexLibraryResponse {
    MediaContainer: PlexMediaContainer
}

// Function to fetch Plex library sections and categorize them into movies, shows, music, and misc
// Returns a PlexLibrary object containing categorized sections
export async function getPlexLibrary(): Promise<PlexLibrary> {
    const plexIp = config.plexUrl;
    const plexPort = config.plexPort;
    const plexToken = config.plexToken;

    const url = `http://${plexIp}:${plexPort}/library/sections?X-Plex-Token=${plexToken}`;
    const response = await axios.get<PlexLibraryResponse>(url);
    const library: PlexLibrary = {
        movies: [],
        shows: [],
        music: [],
        misc: []
    };

    for (const section of response.data.MediaContainer.Directory) {
        console.log('Processing section:', section.title, 'with agent:', section.agent);
        const agent = section.agent.toLowerCase();
        if (agent.includes('movie')) library.movies.push(section);
        else if (agent.includes('series')) library.shows.push(section);
        else if (agent.includes('music')) library.music.push(section);
        else library.misc.push(section);
    }

    return library;
}