import express from 'express';
import { createStudentOnline } from '../controllers/studentOnline.controller.js';
import {uploadMemory} from '../middleware/uploadMemory.js';

const router = express.Router();

router.post('/student-online-form',  uploadMemory.fields([
    { name: 'grade10Certificate', maxCount: 1 },
    { name: 'grade10Transcript', maxCount: 1 },

    { name: 'grade12Certificate', maxCount: 1 },
    { name: 'grade12Transcript', maxCount: 1 },

    { name: 'diploma', maxCount: 1 },
    { name: 'degree', maxCount: 1 },
    { name: 'masters', maxCount: 1 },

    { name: 'passportPhoto', maxCount: 1 },
    { name: 'passportBioPage', maxCount: 1 },
    { name: 'passportBackPages', maxCount: 1 },

    { name: 'visaDocument', maxCount: 1 },
    { name: 'travelTickets', maxCount: 1 },
  ]), createStudentOnline);

export default router;