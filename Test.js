import { ImapFlow } from 'imapflow'

const client = new ImapFlow({
  host: 'imap.gmail.com',
  port: 993,
  secure: true,
  auth: {
    user: 'ad91482948@gmail.com',
    pass: 'toyuvuczhfhwjehr'
  }
})

try {
  await client.connect()
  console.log('SUCCESS')
  await client.logout()
} catch (err) {
  console.error(err)
}