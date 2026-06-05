import { Router } from 'express';
import { 
  listStudents, 
  getStudentById, 
  registerStudent, 
  updateStudent, 
  softDeleteStudent,
  listDeletedStudents,
  restoreStudent,
  permanentDeleteStudent
} from '../controllers/student.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, listStudents);
router.get('/trash/list', requireAuth, listDeletedStudents);
router.get('/:id', requireAuth, getStudentById);
router.post('/register', requireAuth, registerStudent);
router.put('/:id', requireAuth, updateStudent);
router.delete('/:id/soft', requireAuth, softDeleteStudent);
router.patch('/:id/restore', requireAuth, restoreStudent);
router.delete('/:id/permanent', requireAuth, permanentDeleteStudent);

export default router;
