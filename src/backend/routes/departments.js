import { Router } from 'express';
import { getDepartmentResources, updateDepartmentResources, getCitySensors, getCityVitals, getPerformanceStats } from '../db/index.js';

const router = Router();

router.get('/performance/:deptId', (req, res) => {
    res.json(getPerformanceStats(req.params.deptId));
});

router.get('/sensors', (req, res) => {
    res.json(getCitySensors());
});

router.get('/city-vitals', (req, res) => {
    res.json(getCityVitals());
});

router.get('/department-resources/:deptId', async (req, res) => {
    res.json(await getDepartmentResources(req.params.deptId));
});

router.post('/department-resources/:deptId', async (req, res) => {
    res.json(await updateDepartmentResources(req.params.deptId, req.body));
});

export default router;
