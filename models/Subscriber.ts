import mongoose, { Document, Model } from 'mongoose';

export interface ISubscriber extends Document {
  email: string;
  name: string;
  subscribedAt: Date;
  isActive: boolean;
  newsletterSubscribed: boolean;
  lastLoginAt?: Date;
  loginCount: number;
  lastCodeSentAt?: Date;
}

const SubscriberSchema = new mongoose.Schema<ISubscriber>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  subscribedAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  newsletterSubscribed: {
    type: Boolean,
    default: true, // Default to subscribed for new users
  },
  lastLoginAt: {
    type: Date,
  },
  loginCount: {
    type: Number,
    default: 0,
  },
  lastCodeSentAt: {
    type: Date,
  },
});

// Create indexes for better performance
SubscriberSchema.index({ email: 1 });
SubscriberSchema.index({ subscribedAt: -1 });

const Subscriber: Model<ISubscriber> = mongoose.models.Subscriber || mongoose.model<ISubscriber>('Subscriber', SubscriberSchema);

export default Subscriber;