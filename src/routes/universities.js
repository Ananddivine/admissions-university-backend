import { Router } from 'express';
import { listUniversities, createUniversity } from '../controllers/university.controller.js';

const router = Router();

router.get('/', listUniversities);
router.post('/', createUniversity);

export default router;
