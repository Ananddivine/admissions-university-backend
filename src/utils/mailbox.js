  import { ImapFlow } from 'imapflow';
  import nodemailer from 'nodemailer';
  import { simpleParser } from 'mailparser';

    const defaultImapHost = process.env.MAILBOX_IMAP_HOST || 'imap.gmail.com'
    const defaultImapPort = Number(process.env.MAILBOX_IMAP_PORT || 993)
    const defaultImapSecure = process.env.MAILBOX_IMAP_SECURE !== 'true'
    const defaultSmtpHost = process.env.MAILBOX_SMTP_HOST || 'smtp.gmail.com'
    const defaultSmtpPort = Number(process.env.MAILBOX_SMTP_PORT || 465)
    const defaultSmtpSecure = process.env.MAILBOX_SMTP_SECURE !== 'true'
    const mailboxFolder = process.env.MAILBOX_FOLDER || 'INBOX'
    const mailboxSentFolder = process.env.MAILBOX_SENT_FOLDER || 'Sent'
    const mailboxPreviewFetchLimit = Number(process.env.MAILBOX_PREVIEW_FETCH_LIMIT || 80)
    const mailboxSentCopyToInbox = String(process.env.MAILBOX_SENT_COPY_TO_INBOX || 'true').toLowerCase() !== 'false'

    function createMailboxError(code, message) {
      const error = new Error(message)
      error.code = code
      return error
    }

    function parsePasswordMap() {
      if (!process.env.MAILBOX_PASSWORDS_JSON) {
        return {}
      }

      try {
        const parsed = JSON.parse(process.env.MAILBOX_PASSWORDS_JSON)
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch {
        throw createMailboxError(
          'MAILBOX_NOT_CONFIGURED',
          'MAILBOX_PASSWORDS_JSON is not valid JSON. Configure the mailbox password map before using the mailbox.',
        )
      }
    }

    function resolveMailboxCredentials(email) {
      const normalizedEmail = String(email || '').trim().toLowerCase()
    
      if (!normalizedEmail) {
        throw createMailboxError('MAILBOX_NOT_CONFIGURED', 'No mailbox email was provided for the current user.')
      }

      const passwordMap = parsePasswordMap()
      const mappedPassword = passwordMap[normalizedEmail]
      const fallbackPassword =
        normalizedEmail === 'ad91482948@gmail.com'
          ? process.env.MAILBOX_PASSWORD_INFO
          : normalizedEmail === 'ad91482948@gmail.com'
            ? process.env.MAILBOX_PASSWORD_ADMISSION
            : ''
      const password = mappedPassword || fallbackPassword

       console.log('EMAIL:', normalizedEmail)
  console.log('MAPPED PASSWORD:', JSON.stringify(mappedPassword))
  console.log('FALLBACK PASSWORD:', JSON.stringify(fallbackPassword))
  console.log('FINAL PASSWORD:', JSON.stringify(password))
  console.log('PASSWORD LENGTH:', password?.length)


      if (!password) {
        throw createMailboxError(
          'MAILBOX_NOT_CONFIGURED',
          `No mailbox password is configured for ${normalizedEmail}. Add it to MAILBOX_PASSWORDS_JSON or the matching mailbox password env var.`,
        )
      }

      console.log('RETURNING ACCOUNT:', {
  user: normalizedEmail,
  host: defaultImapHost,
  smtp: defaultSmtpHost
})

      return {
        user: normalizedEmail,
        password,
        imapHost: defaultImapHost,
        imapPort: defaultImapPort,
        imapSecure: defaultImapSecure,
        smtpHost: defaultSmtpHost,
        smtpPort: defaultSmtpPort,
        smtpSecure: defaultSmtpSecure,
        folder: mailboxFolder,
      }
    }

    function formatAddressEntry(entry) {
      if (!entry) {
        return null
      }

      return {
        name: entry.name || entry.address || '',
        address: entry.address || '',
      }
    }

    function formatAddressList(entries = []) {
      return entries.map(formatAddressEntry).filter(Boolean)
    }

    function formatAddressLabel(entries = []) {
      return formatAddressList(entries)
        .map((entry) => (entry.name && entry.name !== entry.address ? `${entry.name} <${entry.address}>` : entry.address))
        .filter(Boolean)
        .join(', ')
    }

    function createImapClient(account) {
      console.log('Connecting with:', {
    email: account.user,
    password: JSON.stringify(account.password),
    length: account.password.length
  })

  console.log('IMAP CONFIG:', {
    host: account.imapHost,
    port: account.imapPort,
    secure: account.imapSecure
  })

      return new ImapFlow({
        host: account.imapHost,
        port: account.imapPort,
        secure: account.imapSecure,
        auth: {
          user: account.user,
          pass: account.password,
        },
        logger: false,
      })     
    }


    async function appendRawMessageToMailbox(client, mailbox, raw, flags = ['\\Seen']) {
      try {
        await client.append(mailbox, raw, flags, new Date())
      } catch (error) {
        // Some IMAP servers may require the mailbox to exist first.
        try {
          await client.mailboxOpen(mailbox, { createMailbox: true })
          await client.append(mailbox, raw, flags, new Date())
        } catch (appendError) {
          throw appendError
        }
      }
    }

    function getSentFolderCandidates() {
      return [...new Set([
        mailboxSentFolder,
        'Sent',
        'sent',
        'Sent Items',
        'sent items',
        'Sent Messages',
        'sent messages',
        'INBOX.Sent',
        'INBOX/Sent',
        'INBOX.Sent Items',
        'INBOX/Sent Items',
        'INBOX.Sent Messages',
        'INBOX/Sent Messages',
      ].filter(Boolean))]
    }

    async function listMailboxPaths(client) {
      try {
        const mailboxes = await client.list('', '*')
        return Array.isArray(mailboxes)
          ? mailboxes.filter((mailbox) => mailbox && typeof mailbox.path === 'string').map((mailbox) => mailbox.path)
          : []
      } catch (error) {
        return []
      }
    }

    function attachImapErrorHandler(client) {
      client.on('error', () => {})
    }

    function canLogoutClient(client) {
      return client && !client.closed && client.state !== client.states?.LOGOUT
    }

    async function listMailboxPathsForAccount(account) {
      const client = createImapClient(account)
      attachImapErrorHandler(client)
      try {
        await client.connect()
        const mailboxes = await client.list('', '*')
        return Array.isArray(mailboxes)
          ? mailboxes.filter((mailbox) => mailbox && typeof mailbox.path === 'string').map((mailbox) => mailbox.path)
          : []
      } catch (error) {
        return []
      } finally {
        if (canLogoutClient(client)) {
          await client.logout().catch(() => {})
        }
      }
    }

    function normalizeMailboxName(name) {
      return String(name || '').trim().toLowerCase().replace(/\\/g, '/').replace(/\s+/g, ' ')
    }

    async function findBestMailboxPath(account, candidates) {
      const available = await listMailboxPathsForAccount(account)
      if (!available.length) {
        return null
      }

      const normalizedCandidates = candidates.map(normalizeMailboxName)
      const exactMatch = available.find((path) => normalizedCandidates.includes(normalizeMailboxName(path)))
      if (exactMatch) {
        return exactMatch
      }

      const endsWithMatch = available.find((path) =>
        normalizedCandidates.some((candidate) => normalizeMailboxName(path).endsWith(candidate)),
      )

      return endsWithMatch || null
    }

    async function appendRawMessage(client, mailbox, raw, flags = ['\\Seen'], account) {
      const mailboxes = Array.isArray(mailbox) ? mailbox : [mailbox]
      const errors = []

      for (const folder of mailboxes) {
        try {
          await appendRawMessageToMailbox(client, folder, raw, flags)
          return
        } catch (error) {
          errors.push(error)
        }
      }

      const fallback = account ? await findBestMailboxPath(account, mailboxes) : null
      if (fallback && account) {
        const freshClient = createImapClient(account)
        attachImapErrorHandler(freshClient)
        try {
          await freshClient.connect()
          await appendRawMessageToMailbox(freshClient, fallback, raw, flags)
          console.info(`Appended raw message to discovered mailbox: ${fallback}`)
          return
        } catch (error) {
          errors.push(error)
        } finally {
          if (canLogoutClient(freshClient)) {
            await freshClient.logout().catch(() => {})
          }
        }
      }

      const error = new Error(`Unable to append raw message to any mailbox: ${mailboxes.join(', ')}`)
      error.innerErrors = errors
      throw error
    }

    function hasMessageFlag(flags, flag) {
      if (!flags) {
        return false
      }

      if (flags instanceof Set) {
        return flags.has(flag)
      }

      if (Array.isArray(flags)) {
        return flags.includes(flag)
      }

      return false
    }

    async function withMailboxClient(email, handler) {
      const account = resolveMailboxCredentials(email)
      console.log('Connecting with:', {
      email: account.user,
      passwordLength: account.password?.length
    })

      const client = createImapClient(account)
      attachImapErrorHandler(client)

      try {
        await client.connect()
        return await handler(client, account)
      } catch (error) {
    console.error('IMAP ERROR:')
    console.error(error)
    console.error(error.message)
    console.error(error.code)

    throw error
      } finally {
        if (canLogoutClient(client)) {
          await client.logout().catch(() => {})
        }
      }
    }

    function normalizeMessageSummary(message, parsed) {
      return {
        uid: String(message.uid),
        subject: parsed?.subject || message.envelope?.subject || '(No subject)',
        messageId: parsed?.messageId || '',
        inReplyTo: parsed?.inReplyTo || '',
        references: parsed?.references
          ? Array.isArray(parsed.references)
            ? parsed.references
            : [parsed.references]
          : [],
        from: formatAddressLabel(message.envelope?.from),
        fromList: formatAddressList(message.envelope?.from),
        to: formatAddressLabel(message.envelope?.to),
        date: message.internalDate || message.envelope?.date || null,
        read: hasMessageFlag(message.flags, '\\Seen'),
        answered: hasMessageFlag(message.flags, '\\Answered'),
        flagged: hasMessageFlag(message.flags, '\\Flagged'),
        hasAttachments: Boolean(message.bodyStructure?.childNodes?.length),
      }
    }

    function buildFetchRange(exists, limit = mailboxPreviewFetchLimit) {
      const start = Math.max(1, exists - limit + 1)
      return `${start}:*`
    }

    async function getMailboxSummary(email, options = {}) {
      return withMailboxClient(email, async (client, account) => {
        const folder = String(options.folder || account.folder).trim() || account.folder
        const status = await client.status(folder, { unseen: true, messages: true })
        const mailbox = await client.mailboxOpen(folder)
        const preview = []

        if (mailbox.exists > 0) {
          for await (const message of client.fetch(buildFetchRange(mailbox.exists, 20), {
            uid: true,
            envelope: true,
            flags: true,
            internalDate: true,
            source: true,
          })) {
            const parsed = message.source ? await simpleParser(message.source) : null
            preview.push(normalizeMessageSummary(message, parsed))
          }
        }

        const unreadPreview = preview
          .filter((message) => !message.read)
          .sort((first, second) => new Date(second.date || 0) - new Date(first.date || 0))
          .slice(0, 5)

        return {
          accountEmail: account.user,
          unreadCount: status.unseen ?? unreadPreview.length,
          totalMessages: status.messages ?? mailbox.exists ?? 0,
          recentUnread: unreadPreview,
        }
      })
    }

    async function listMailboxMessages(email, options = {}) {
      const query = String(options.query || '').trim().toLowerCase()
      const unreadOnly = String(options.unreadOnly || '') === 'true'

      return withMailboxClient(email, async (client, account) => {
        const folder = String(options.folder || account.folder).trim() || account.folder
        const mailbox = await client.mailboxOpen(folder)
        const messages = []

        if (mailbox.exists > 0) {
          for await (const message of client.fetch(buildFetchRange(mailbox.exists), {
            uid: true,
            envelope: true,
            flags: true,
            internalDate: true,
            bodyStructure: true,
            source: true,
          })) {
            const parsed = message.source ? await simpleParser(message.source) : null
            messages.push(normalizeMessageSummary(message, parsed))
          }
        }

        const filteredMessages = messages
          .sort((first, second) => new Date(second.date || 0) - new Date(first.date || 0))
          .filter((message) => {
            if (unreadOnly && message.read) {
              return false
            }

            if (!query) {
              return true
            }

            const haystack = `${message.subject} ${message.from} ${message.to}`.toLowerCase()
            return haystack.includes(query)
          })

        return {
          accountEmail: account.user,
          messages: filteredMessages,
        }
      })
    }

    async function fetchParsedMessage(client, uid) {
      const message = await client.fetchOne(uid, {
        uid: true,
        envelope: true,
        flags: true,
        internalDate: true,
        source: true,
      }, { uid: true })

      if (!message) {
        throw createMailboxError('MAILBOX_MESSAGE_NOT_FOUND', 'The selected email could not be found.')
      }

      const parsed = await simpleParser(message.source)

      return { message, parsed }
    }

    function normalizeMessageDetail(payload) {
      const { message, parsed } = payload
      const attachments = (parsed.attachments || []).map((attachment, index) => ({
        id: attachment.checksum || `${message.uid}-${index + 1}`,
        filename: attachment.filename || `attachment-${index + 1}`,
        contentType: attachment.contentType || 'application/octet-stream',
        size: attachment.size || attachment.content?.length || 0,
      }))

      return {
        uid: String(message.uid),
        subject: parsed.subject || message.envelope?.subject || '(No subject)',
        from: formatAddressLabel(parsed.from?.value),
        fromList: formatAddressList(parsed.from?.value),
        to: formatAddressLabel(parsed.to?.value),
        toList: formatAddressList(parsed.to?.value),
        cc: formatAddressLabel(parsed.cc?.value),
        ccList: formatAddressList(parsed.cc?.value),
        date: parsed.date || message.internalDate || message.envelope?.date || null,
        read: hasMessageFlag(message.flags, '\\Seen'),
        answered: hasMessageFlag(message.flags, '\\Answered'),
        text: parsed.text || '',
        html: parsed.html || '',
        previewText: parsed.textAsHtml || '',
        messageId: parsed.messageId || '',
        references: Array.isArray(parsed.references) ? parsed.references : parsed.references ? [parsed.references] : [],
        attachments,
      }
    }

    async function getMailboxMessage(email, uid, options = {}) {
      return withMailboxClient(email, async (client, account) => {
        const folder = String(options.folder || account.folder).trim() || account.folder
        await client.mailboxOpen(folder)

        if (options.markRead !== false) {
          await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true, silent: true }).catch(() => {})
        }

        const parsedPayload = await fetchParsedMessage(client, uid)

        return normalizeMessageDetail(parsedPayload)
      })
    }

    async function markMailboxMessageRead(email, uid) {
      return withMailboxClient(email, async (client, account) => {
        await client.mailboxOpen(account.folder)
        await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true, silent: true })
        return { success: true }
      })
    }

    async function getMailboxAttachment(email, uid, attachmentId, options = {}) {
      return withMailboxClient(email, async (client, account) => {
        const folder = String(options.folder || account.folder).trim() || account.folder
        await client.mailboxOpen(folder)
        const parsedPayload = await fetchParsedMessage(client, uid)
        const matchedAttachment = (parsedPayload.parsed.attachments || []).find(
          (attachment, index) => (attachment.checksum || `${uid}-${index + 1}`) === attachmentId,
        )

        if (!matchedAttachment) {
          throw createMailboxError('MAILBOX_ATTACHMENT_NOT_FOUND', 'The selected attachment could not be found.')
        }

        return {
          filename: matchedAttachment.filename || 'attachment',
          contentType: matchedAttachment.contentType || 'application/octet-stream',
          content: matchedAttachment.content,
        }
      })
    }

    function createTransport(account) {
      return nodemailer.createTransport({
        host: account.smtpHost,
        port: account.smtpPort,
        secure: account.smtpSecure,
        auth: {
          user: account.user,
          pass: account.password,
        },
      })
    }

    function normalizeUploadAttachments(files = []) {
      return files.map((file) => ({
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype,
      }))
    }

    function buildReplySubject(subject) {
      if (!subject) {
        return 'Re: (No subject)'
      }

      return /^re:/i.test(subject) ? subject : `Re: ${subject}`
    }

    async function replyToMailboxMessage(email, uid, payload) {
      const account = resolveMailboxCredentials(email)

      return withMailboxClient(email, async (client) => {
        await client.mailboxOpen(account.folder)
        const parsedPayload = await fetchParsedMessage(client, uid)
        const replyTarget = parsedPayload.parsed.replyTo?.value?.[0]?.address || parsedPayload.parsed.from?.value?.[0]?.address

        if (!replyTarget) {
          throw createMailboxError('MAILBOX_REPLY_FAILED', 'No reply address was found for this email.')
        }

        const transport = createTransport(account)
        const references = [
          ...(Array.isArray(parsedPayload.parsed.references) ? parsedPayload.parsed.references : parsedPayload.parsed.references ? [parsedPayload.parsed.references] : []),
          parsedPayload.parsed.messageId,
        ].filter(Boolean)

        const info = await transport.sendMail({
          from: account.user,
          to: replyTarget,
          subject: buildReplySubject(parsedPayload.parsed.subject),
          text: payload.message,
          html: payload.html || undefined,
          inReplyTo: parsedPayload.parsed.messageId || undefined,
          references,
          attachments: normalizeUploadAttachments(payload.attachments),
        })

        await client.messageFlagsAdd(uid, ['\\Seen', '\\Answered'], { uid: true, silent: true }).catch(() => {})

        // Saving sent messages is optional and non-critical
        // Skipping IMAP append of sent message for simplicity

        return {
          messageId: info.messageId,
          accepted: info.accepted || [],
        }
      })
    }

    async function sendMailboxMessage(email, payload) {
      const account = resolveMailboxCredentials(email)
      const transport = createTransport(account)
      const info = await transport.sendMail({
        from: account.user,
        to: payload.to,
        cc: payload.cc || undefined,
        bcc: payload.bcc || undefined,
        subject: payload.subject,
        text: payload.message,
        html: payload.html || undefined,
        attachments: normalizeUploadAttachments(payload.attachments),
      })

      // Saving sent messages is optional and non-critical
      // Skipping IMAP append of sent message for simplicity

      return {
        messageId: info.messageId,
        accepted: info.accepted || [],
      }
    }

  export {
    createMailboxError,
    getMailboxAttachment,
    getMailboxMessage,
    getMailboxSummary,
    listMailboxMessages,
    markMailboxMessageRead,
    replyToMailboxMessage,
    sendMailboxMessage,
  };
