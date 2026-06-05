import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  profilePhoto: { type: String, default: '' },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'ADMIN', 'ADMISSION_OFFICER', 'COUNSELOR', 'DOCUMENT_OFFICER', 'VISA_OFFICER', 'VIEWER'],
    default: 'ADMIN',
  },
  allowedUniversities: [{ type: String, trim: true }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', UserSchema);
