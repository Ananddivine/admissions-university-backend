import {
  getMailboxAttachment,
  getMailboxMessage,
  getMailboxSummary,
  listMailboxMessages,
  markMailboxMessageRead,
  replyToMailboxMessage,
  sendMailboxMessage,
} from '../utils/mailbox.js';

function resolveMailboxStatus(error) {
  switch (error.code) {
    case 'MAILBOX_NOT_CONFIGURED':
    case 'MAILBOX_AUTH_FAILED':
      return 503;
    case 'MAILBOX_MESSAGE_NOT_FOUND':
    case 'MAILBOX_ATTACHMENT_NOT_FOUND':
      return 404;
    case 'MAILBOX_REPLY_FAILED':
      return 400;
    default:
      return 500;
  }
}

function sendMailboxError(res, error) {
  return res.status(resolveMailboxStatus(error)).json({
    success: false,
    message: error.message || 'Unable to complete the mailbox request.',
  });
}

export async function fetchMailboxSummary(req, res) {
  try {
    const summary = await getMailboxSummary(req.user.email, {
      folder: req.query.folder,
    });
    return res.json({ success: true, ...summary });
  } catch (error) {
    return sendMailboxError(res, error);
  }
}

export async function fetchMailboxMessages(req, res) {
  try {
    const inbox = await listMailboxMessages(req.user.email, {
      query: req.query.query,
      unreadOnly: req.query.unreadOnly,
      folder: req.query.folder,
    });

    return res.json({ success: true, ...inbox });
  } catch (error) {
    return sendMailboxError(res, error);
  }
}

export async function fetchMailboxMessage(req, res) {
  try {
    const message = await getMailboxMessage(req.user.email, req.params.uid, {
      markRead: req.query.markRead !== 'false',
      folder: req.query.folder,
    });

    return res.json({ success: true, message });
  } catch (error) {
    return sendMailboxError(res, error);
  }
}

export async function markMailboxRead(req, res) {
  try {
    await markMailboxMessageRead(req.user.email, req.params.uid);
    return res.json({ success: true });
  } catch (error) {
    return sendMailboxError(res, error);
  }
}

export async function downloadMailboxFile(req, res) {
  try {
    const attachment = await getMailboxAttachment(req.user.email, req.params.uid, req.params.attachmentId, {
      folder: req.query.folder,
    });
    res.setHeader('Content-Type', attachment.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);
    return res.send(attachment.content);
  } catch (error) {
    return sendMailboxError(res, error);
  }
}

export async function replyMailbox(req, res) {
  try {
    const message = String(req.body.message || '').trim();

    if (!message) {
      return res.status(400).json({ success: false, message: 'Reply message is required.' });
    }

    const result = await replyToMailboxMessage(req.user.email, req.params.uid, {
      message,
      html: req.body.html,
      attachments: req.files || [],
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    return sendMailboxError(res, error);
  }
}

export async function sendMailbox(req, res) {
  try {
    const to = String(req.body.to || '').trim();
    const subject = String(req.body.subject || '').trim();
    const message = String(req.body.message || '').trim();

    if (!to || !subject || !message) {
      return res.status(400).json({ success: false, message: 'To, subject, and message are required.' });
    }

    const result = await sendMailboxMessage(req.user.email, {
      to,
      cc: String(req.body.cc || '').trim(),
      bcc: String(req.body.bcc || '').trim(),
      subject,
      message,
      html: req.body.html,
      attachments: req.files || [],
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    return sendMailboxError(res, error);
  }
}
