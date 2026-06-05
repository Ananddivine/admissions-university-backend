import { Router } from 'express';
import { createTask, deleteTask, listTasks, updateTask } from '../controllers/task.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, listTasks);
router.post('/', requireAuth, createTask);
router.put('/:id', requireAuth, updateTask);
router.delete('/:id', requireAuth, deleteTask);

export default router;
