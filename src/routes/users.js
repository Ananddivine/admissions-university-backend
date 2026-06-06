import { Router } from 'express';
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from '../controllers/user.controller.js';

import { requireAuth } from '../middleware/auth.middleware.js';
import { uploadMemory } from '../middleware/uploadMemory.js';

const router = Router();

router.get('/', requireAuth, listUsers);

router.post(
  '/',
  requireAuth,
  uploadMemory.single('profilePhoto'),
  createUser
);

router.put(
  '/:id',
  requireAuth,
  uploadMemory.single('profilePhoto'),
  updateUser
);

router.delete(
  '/:id',
  requireAuth,
  deleteUser
);

export default router;