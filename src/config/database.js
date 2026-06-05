import mongoose from 'mongoose';

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri, { autoIndex: true });
  console.log('MongoDB connected');
}
