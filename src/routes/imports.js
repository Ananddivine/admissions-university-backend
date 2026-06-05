import { Router } from 'express';
import { previewImport, createImport } from '../controllers/import.controller.js';

const router = Router();

router.post('/preview', previewImport);
router.post('/', createImport);

export default router;
