import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { authRouter } from './routes/auth';
import path from 'path';
import { classRouter } from './routes/classes';
import { assignmentRouter } from './routes/assignments';
import { submissionRouter } from './routes/submissions';
import { exportRouter } from './routes/export';
import { gradesRouter } from './routes/grades';
import { aiAssistantRouter } from './routes/aiAssistant';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_, res) => res.json({ status: 'ok' }));
// Simple root response to avoid 404 on '/'
app.get('/', (_, res) => {
	res.send('<html><head><title>Lumio API</title></head><body style="font-family:Segoe UI, sans-serif; padding:2rem;">\n<h1>Lumio API</h1>\n<p>Backend running. Frontend dev server runs separately (Vite). If this is production, ensure the client build is served statically.</p>\n</body></html>');
});
// API routes
app.use('/api/auth', authRouter);
app.use('/api/classes', classRouter);
app.use('/api/assignments', assignmentRouter);
app.use('/api/submissions', submissionRouter);
app.use('/api/export', exportRouter);
app.use('/api/grades', gradesRouter);
app.use('/api/ai-assistant', aiAssistantRouter);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`Lumio API running on :${port}`))
  .on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Stop the other process and restart.`);
    } else {
      console.error('Server error', err);
    }
  });
