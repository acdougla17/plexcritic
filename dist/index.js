import express from 'express';
import dotenv from 'dotenv';
import healthRouter from './routes/health.js';
import getLibraryRouter from './routes/plex.js';
dotenv.config();
const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
app.get('/', (req, res) => {
    res.send('Hello, TypeScript with Express!');
});
// Routes
app.use('/health', healthRouter);
app.use('/getLibrary', getLibraryRouter);
app.listen(port, () => {
    console.log(`Server running: http://localhost:${port}/`);
});
//# sourceMappingURL=index.js.map