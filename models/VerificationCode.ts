import mongoose, { Document, Model } from 'mongoose';

export interface IVerificationCode extends Document {
  email: string;
  code: string;
  type: 'signin' | 'signup' | 'newsletter';
  name?: string; // Only for signup/newsletter
  expiresAt: Date;
  used: boolean;
  attempts: number;
  createdAt: Date;
}

const VerificationCodeSchema = new mongoose.Schema<IVerificationCode>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    code: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ['signin', 'signup', 'newsletter'],
      required: true,
      index: true,
    },

    // Only used for signup/newsletter
    name: {
      type: String,
      trim: true,
    },

    // OTP expires after 10 minutes
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000),
    },

    // Prevent reuse
    used: {
      type: Boolean,
      default: false,
    },

    // Protect against brute force
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index for automatic cleanup
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Faster lookups for auth flows
VerificationCodeSchema.index({ email: 1, type: 1 });

const VerificationCode: Model<IVerificationCode> =
  mongoose.models.VerificationCode ||
  mongoose.model<IVerificationCode>('VerificationCode', VerificationCodeSchema);

export default VerificationCode;
