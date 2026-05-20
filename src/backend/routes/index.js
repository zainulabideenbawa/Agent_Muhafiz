import { Router } from 'express';
import toolsRouter from './tools.js';
import incidentsRouter from './incidents.js';
import departmentsRouter from './departments.js';
import authRouter from './auth.js';
import tasksRouter from './tasks.js';
import sovereignRouter from './sovereign.js';
import adminRouter from './admin.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// Public routes
router.use('/tools', toolsRouter);
router.use('/api', authRouter); // login, logout, citizen routes

// Protected routes – require JWT
router.use('/api/incidents', verifyToken, incidentsRouter);
router.use('/api', verifyToken, departmentsRouter);
router.use('/api/tasks', verifyToken, tasksRouter);
router.use('/api', verifyToken, sovereignRouter);
router.use('/api/admin', verifyToken, adminRouter);


export default router;

