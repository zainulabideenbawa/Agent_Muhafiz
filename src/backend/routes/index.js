import { Router } from 'express';
import toolsRouter from './tools.js';
import incidentsRouter from './incidents.js';
import departmentsRouter from './departments.js';
import authRouter from './auth.js';
import tasksRouter from './tasks.js';
import sovereignRouter from './sovereign.js';

const router = Router();

router.use('/tools', toolsRouter);
router.use('/api/incidents', incidentsRouter);
router.use('/api', departmentsRouter);
router.use('/api', authRouter);
router.use('/api/tasks', tasksRouter);
router.use('/api', sovereignRouter);

export default router;
