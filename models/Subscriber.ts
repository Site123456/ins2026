import mongoose, { Document, Model, CallbackError } from 'mongoose';
import { encrypt, decrypt, blindIndex } from '@/lib/crypto';

export interface IReservation {
  date: Date;
  timestart: string;
  adults: number;
  children: number;
  adultname: string;
  status?: string;
  remarks?: string;
  createdAt?: Date;
}

export interface ISubscriber extends Document {
  email: string;
  name: string;

  blindEmail: string;
  encryptedEmail: string;
  encryptedName: string;

  subscribedAt: Date;
  isActive: boolean;
  newsletterSubscribed: boolean;
  language: 'fr' | 'en';
  lastLoginAt?: Date;
  loginCount: number;
  lastCodeSentAt?: Date;
  reservations: IReservation[];
  favorites: number[];
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new mongoose.Schema<IReservation>({
  date: { type: Date, required: true },
  timestart: { type: String, required: true },
  adults: { type: Number, required: true, default: 1 },
  children: { type: Number, default: 0 },
  adultname: { type: String, required: true },
  status: { type: String, default: 'pending', enum: ['pending', 'confirmed', 'cancelled', 'completed'] },
  remarks: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const SubscriberSchema = new mongoose.Schema<ISubscriber>(
  {
    email: { type: String, lowercase: true, trim: true },
    name: { type: String, trim: true },
    blindEmail: { type: String, unique: true, index: true },
    encryptedEmail: { type: String },
    encryptedName: { type: String },
    subscribedAt: { type: Date, default: Date.now, index: true },
    isActive: { type: Boolean, default: true },
    newsletterSubscribed: { type: Boolean, default: true },
    language: { type: String, enum: ['fr', 'en'], default: 'fr' },
    lastLoginAt: { type: Date },
    loginCount: { type: Number, default: 0 },
    lastCodeSentAt: { type: Date },
    reservations: { type: [ReservationSchema], default: [] },
    favorites: { type: [Number], default: [] }
  },
  { timestamps: true }
);

// Pre-save hook to handle encryption
SubscriberSchema.pre('save', function (next: (err?: CallbackError) => void) {
  if (this.isModified('email') && this.email) {
    this.blindEmail = blindIndex(this.email.toLowerCase());
    this.encryptedEmail = encrypt(this.email.toLowerCase());
  }
  if (this.isModified('name') && this.name) {
    this.encryptedName = encrypt(this.name);
  }
  next();
});

// Post-init hook to decrypt fields
SubscriberSchema.post('init', function (doc: ISubscriber) {
  if (doc.encryptedEmail) {
    const decEmail = decrypt(doc.encryptedEmail);
    if (decEmail) doc.email = decEmail;
  }
  if (doc.encryptedName) {
    const decName = decrypt(doc.encryptedName);
    if (decName) doc.name = decName;
  }
});

// Performance indexes
SubscriberSchema.index({ subscribedAt: -1 });
SubscriberSchema.index({ isActive: 1 });
SubscriberSchema.index({ newsletterSubscribed: 1 });

// Static method for email lookup with blind index
SubscriberSchema.statics.findByEmail = async function (email: string): Promise<ISubscriber | null> {
  const blind = blindIndex(email.toLowerCase());
  let user = await this.findOne({ blindEmail: blind });

  // Backward compatibility: migrate plaintext entries
  if (!user) {
    user = await this.findOne({ email: email.toLowerCase() });
    if (user) {
      user.email = email.toLowerCase();
      user.markModified('email');
      await user.save();
    }
  }
  return user;
};

interface ISubscriberModel extends Model<ISubscriber> {
  findByEmail(email: string): Promise<ISubscriber | null>;
}

const Subscriber: ISubscriberModel =
  (mongoose.models.Subscriber as ISubscriberModel) ||
  mongoose.model<ISubscriber, ISubscriberModel>('Subscriber', SubscriberSchema);

export default Subscriber;
