import mongoose from 'mongoose';

const UniversitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  website: { type: String, trim: true },
  contactPerson: { type: String, trim: true },
  contactEmail: { type: String, trim: true, lowercase: true },
  contactNumber: { type: String, trim: true },
  programs: [{ type: String }],
  intakes: [{ type: String }],
  admissionRequirements: { type: String, default: '' },
  commissionStructure: { type: String, default: '' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('University', UniversitySchema);
