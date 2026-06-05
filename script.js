import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Student from './src/models/student.model.js';

await mongoose.connect(process.env.MONGODB_URI, { autoIndex: true });

const statuses = await Student.distinct('leadStatus');

console.log(statuses);

process.exit(0);