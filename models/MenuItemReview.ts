import mongoose, { Document, Model } from 'mongoose';

export interface IReviewReply {
  userId: mongoose.Types.ObjectId;
  userName: string;
  blindEmail: string;
  comment: string;
  createdAt: Date;
}

export interface IVoteEntry {
  odine: string;    
  vote: 'up' | 'down';
}

export interface IMenuItemReview extends Document {
  dishId: number;
  userId: mongoose.Types.ObjectId;
  userName: string;
  blindEmail: string;
  rating: number;
  comment: string;
  language: 'fr' | 'en';

  upvotes: number;
  downvotes: number;
  score: number;
  votedBy: IVoteEntry[];
  replies: IReviewReply[];

  createdAt: Date;
  updatedAt: Date;
}

const ReviewReplySchema = new mongoose.Schema<IReviewReply>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscriber', required: true },
    userName: { type: String, required: true },
    blindEmail: { type: String, required: true },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

const VoteEntrySchema = new mongoose.Schema<IVoteEntry>(
  {
    odine: { type: String, required: true },
    vote: { type: String, enum: ['up', 'down'], required: true },
  },
  { _id: false }
);

const MenuItemReviewSchema = new mongoose.Schema<IMenuItemReview>(
  {
    dishId: { type: Number, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscriber', required: true },
    userName: { type: String, required: true },
    blindEmail: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
    language: { type: String, enum: ['fr', 'en'], default: 'fr' },

    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    score: { type: Number, default: 0, index: true },
    votedBy: { type: [VoteEntrySchema], default: [] },
    replies: { type: [ReviewReplySchema], default: [] },
  },
  { timestamps: true }
);

// One review per dish per user
MenuItemReviewSchema.index({ dishId: 1, userId: 1 }, { unique: true });
// For sorting by score within a dish
MenuItemReviewSchema.index({ dishId: 1, score: -1, createdAt: -1 });

// Static: get aggregate stats for a dish
MenuItemReviewSchema.statics.getDishStats = async function (dishId: number) {
  const result = await this.aggregate([
    { $match: { dishId } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        totalVoteScore: { $sum: '$score' },
      },
    },
  ]);
  if (result.length === 0) return { avgRating: 0, totalReviews: 0, totalVoteScore: 0 };
  return {
    avgRating: Math.round(result[0].avgRating * 10) / 10,
    totalReviews: result[0].totalReviews,
    totalVoteScore: result[0].totalVoteScore,
  };
};

// Static: get stats for ALL dishes in a single query (for search page)
MenuItemReviewSchema.statics.getAllDishStats = async function () {
  const result = await this.aggregate([
    {
      $group: {
        _id: '$dishId',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        totalVoteScore: { $sum: '$score' },
      },
    },
  ]);
  const map: Record<number, { avgRating: number; totalReviews: number; totalVoteScore: number }> = {};
  for (const r of result) {
    map[r._id] = {
      avgRating: Math.round(r.avgRating * 10) / 10,
      totalReviews: r.totalReviews,
      totalVoteScore: r.totalVoteScore,
    };
  }
  return map;
};

interface IMenuItemReviewModel extends Model<IMenuItemReview> {
  getDishStats(dishId: number): Promise<{ avgRating: number; totalReviews: number; totalVoteScore: number }>;
  getAllDishStats(): Promise<Record<number, { avgRating: number; totalReviews: number; totalVoteScore: number }>>;
}

const MenuItemReview: IMenuItemReviewModel =
  (mongoose.models.MenuItemReview as IMenuItemReviewModel) ||
  mongoose.model<IMenuItemReview, IMenuItemReviewModel>('MenuItemReview', MenuItemReviewSchema);

export default MenuItemReview;
