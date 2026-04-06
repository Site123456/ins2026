import mongoose, { Document, Model } from 'mongoose';

export interface IVerificationCode extends Document {
  email: string;
  code: string;
  type: 'signin' | 'signup' | 'newsletter';
  name?: string;
  expiresAt: Date;
  used: boolean;
  attempts: number;
  createdAt: Date;
}

const VerificationCodeSchema = new mongoose.Schema<IVerificationCode>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['signin', 'signup', 'newsletter'],
    required: true,
  },
  name: {
    type: String,
    trim: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  },
  used: {
    type: Boolean,
    default: false,
  },
  attempts: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Create indexes for better performance
VerificationCodeSchema.index({ email: 1, type: 1 });
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

const VerificationCode: Model<IVerificationCode> = mongoose.models.VerificationCode || mongoose.model<IVerificationCode>('VerificationCode', VerificationCodeSchema);

export default VerificationCode;