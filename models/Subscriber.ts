import mongoose, { Document, Model } from 'mongoose';

export interface ISubscriber extends Document {
  email: string;
  name: string;

  // Core account info
  subscribedAt: Date;
  isActive: boolean;

  // Newsletter preferences
  newsletterSubscribed: boolean;

  // Authentication analytics
  lastLoginAt?: Date;
  loginCount: number;

  // Anti‑abuse / rate limiting
  lastCodeSentAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

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
  },
  {
    timestamps: true,
  }
);

// PERFORMANCE INDEXES
SubscriberSchema.index({ email: 1 }, { unique: true });
SubscriberSchema.index({ subscribedAt: -1 });
SubscriberSchema.index({ isActive: 1 });
SubscriberSchema.index({ newsletterSubscribed: 1 });

const Subscriber: Model<ISubscriber> =
  mongoose.models.Subscriber ||
  mongoose.model<ISubscriber>('Subscriber', SubscriberSchema);

export default Subscriber;
