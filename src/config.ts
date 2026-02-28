import dotenv from "dotenv";
import { platform } from "node:os";
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  plexUrl: process.env.PLEX_URL!,
  plexPort: process.env.PLEX_PORT!,
  plexToken: process.env.PLEX_TOKEN!,
};