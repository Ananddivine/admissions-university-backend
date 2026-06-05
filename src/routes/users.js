import { Router } from 'express';
import { createUser, deleteUser, listUsers, updateUser } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, listUsers);
router.post('/', requireAuth, createUser);
router.put('/:id', requireAuth, updateUser);
router.delete('/:id', requireAuth, deleteUser);

export default router;
