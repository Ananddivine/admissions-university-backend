import { Router } from 'express';
import authRoutes from './auth.js';
import universityRoutes from './universities.js';
import studentRoutes from './students.js';
import importRoutes from './imports.js';
import userRoutes from './users.js';
import taskRoutes from './tasks.js';
import emailRoutes from './email.js';
import studentOnlineRoutes from './studentOnline.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/universities', universityRoutes);
router.use('/students', studentRoutes);
router.use('/users', userRoutes);
router.use('/tasks', taskRoutes);
router.use('/imports', importRoutes);
router.use('/', emailRoutes);
router.use('/v1', studentOnlineRoutes);

export default router;
