import { Router } from 'express';
import { getAllTasks, updateTaskStatus } from '../db/index.js';

const router = Router();

router.get('/', async (req, res) => {
    res.json(await getAllTasks());
});

router.post('/:taskId/status', async (req, res) => {
    const { taskId } = req.params;
    const { status, summary } = req.body;
    await updateTaskStatus(taskId, status, summary);
    res.json({ success: true });
});

export default router;
