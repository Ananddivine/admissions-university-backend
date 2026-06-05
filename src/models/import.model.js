import mongoose from 'mongoose';

const ImportAuditSchema = new mongoose.Schema({
  university: { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: true },
  importedBy: { type: String, default: 'system' },
  recordCount: { type: Number, default: 0 },
  duplicates: { type: Number, default: 0 },
  invalidRows: { type: Number, default: 0 },
  sampleRows: [{ type: mongoose.Schema.Types.Mixed }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('ImportAudit', ImportAuditSchema);
