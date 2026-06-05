import { Router } from 'express';
import {
  downloadMailboxFile,
  fetchMailboxMessage,
  fetchMailboxMessages,
  fetchMailboxSummary,
  markMailboxRead,
  replyMailbox,
  sendMailbox,
} from '../controllers/mailboxController.js';
import { fetchUser } from '../middleware/fetchUser.js';
import { uploadMemory } from '../middleware/uploadMemory.js';

const router = Router();

router.get('/mailbox/summary', fetchUser, fetchMailboxSummary);
router.get('/mailbox/messages', fetchUser, fetchMailboxMessages);
router.get('/mailbox/messages/:uid', fetchUser, fetchMailboxMessage);
router.post('/mailbox/messages/:uid/read', fetchUser, markMailboxRead);
router.get('/mailbox/messages/:uid/attachments/:attachmentId', fetchUser, downloadMailboxFile);
router.post('/mailbox/messages/:uid/reply', fetchUser, uploadMemory.array('attachments', 5), replyMailbox);
router.post('/mailbox/send', fetchUser, uploadMemory.array('attachments', 5), sendMailbox);

export default router;
