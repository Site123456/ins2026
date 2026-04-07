import mongoose, { Document, Model } from 'mongoose';
import { encrypt, decrypt, blindIndex } from '@/lib/crypto';

export interface IVerificationCode extends Document {
  email: string;
  code: string;
  type: 'signin' | 'signup' | 'newsletter';
  name?: string; 
  blindEmail: string;
  encryptedEmail: string;
  expiresAt: Date;
  used: boolean;
  attempts: number;
  createdAt: Date;
}

const VerificationCodeSchema = new mongoose.Schema<IVerificationCode>(
  {
    email: { type: String, lowercase: true, trim: true },
    blindEmail: { type: String, index: true },
    encryptedEmail: { type: String },
    code: { type: String, required: true },
    type: { type: String, enum: ['signin', 'signup', 'newsletter'], required: true, index: true },
    name: { type: String, trim: true },
    expiresAt: { type: Date, required: true, default: () => new Date(Date.now() + 10 * 60 * 1000) },
    used: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Pre-save hook to handle encryption
VerificationCodeSchema.pre('save', async function (this: any) {
  if (this.isModified('email') && this.email) {
    this.blindEmail = blindIndex(this.email.toLowerCase());
    this.encryptedEmail = encrypt(this.email.toLowerCase());
  }
});

// Post-init hook to decrypt fields
VerificationCodeSchema.post('init', function (doc) {
  if (doc.encryptedEmail) {
    const decEmail = decrypt(doc.encryptedEmail);
    if (decEmail) doc.email = decEmail;
  }
});

// TTL index for automatic cleanup
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Faster lookups for auth flows using blind index
VerificationCodeSchema.index({ blindEmail: 1, type: 1 });

const VerificationCode: Model<IVerificationCode> =
  mongoose.models.VerificationCode ||
  mongoose.model<IVerificationCode>('VerificationCode', VerificationCodeSchema);

export default VerificationCode;
