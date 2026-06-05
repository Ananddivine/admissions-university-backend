import bcrypt from 'bcryptjs'
import User from '../models/user.model.js'

export async function seedAdminUser() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME || 'Admission Officer'
  const role = process.env.ADMIN_ROLE || 'SUPER_ADMIN'

  if (!email || !password) {
    console.warn('ADMIN_EMAIL or ADMIN_PASSWORD is not set. Skipping admin seeding.')
    return
  }

  const existingAdmin = await User.findOne({ email: email.toLowerCase() })
  if (existingAdmin) {
    console.log(`Admin user already exists: ${email}`)
    return
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role,
    allowedUniversities: [],
  })

  console.log(`Created admin user: ${email}`)
}
