import { Router } from 'express';
import { apiHealth } from '../health_monitor.js';

const router = Router();

router.get('/', (req, res) => {
    res.json(apiHealth);
});

export default router;
