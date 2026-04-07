import mongoose, { Document, Model } from 'mongoose';

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

  // Core account info
  subscribedAt: Date;
  isActive: boolean;

  // Newsletter preferences
  newsletterSubscribed: boolean;

  // Language preference
  language: 'fr' | 'en';

  // Authentication analytics
  lastLoginAt?: Date;
  loginCount: number;

  // Anti‑abuse / rate limiting
  lastCodeSentAt?: Date;

  // Reservations
  reservations: IReservation[];

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
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    // When the user first joined the ecosystem
    subscribedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Soft‑delete / deactivation
    isActive: {
      type: Boolean,
      default: true,
    },

    // Newsletter toggle
    newsletterSubscribed: {
      type: Boolean,
      default: true,
    },

    // Language
    language: {
      type: String,
      enum: ['fr', 'en'],
      default: 'fr',
    },

    // Login analytics
    lastLoginAt: {
      type: Date,
    },

    loginCount: {
      type: Number,
      default: 0,
    },

    // Rate limiting for sending codes
    lastCodeSentAt: {
      type: Date,
    },

    // Reservations specific to this user
    reservations: {
      type: [ReservationSchema],
      default: [],
    }
  },
  {
    timestamps: true,
  }
);

// PERFORMANCE INDEXES
SubscriberSchema.index({ subscribedAt: -1 });
SubscriberSchema.index({ isActive: 1 });
SubscriberSchema.index({ newsletterSubscribed: 1 });

const Subscriber: Model<ISubscriber> =
  mongoose.models.Subscriber ||
  mongoose.model<ISubscriber>('Subscriber', SubscriberSchema);

export default Subscriber;
