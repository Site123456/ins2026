import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MenuItemReview from '@/models/MenuItemReview';

// POST /api/reviews/vote — Toggle upvote/downvote
// Guests can vote using a fingerprint (stored client-side), auth users use blindEmail
export async function POST(request: NextRequest) {
  try {
    const { reviewId, odine, vote } = await request.json();

    if (!reviewId || !odine || !['up', 'down'].includes(vote)) {
      return NextResponse.json({ error: 'Missing reviewId, odine, or valid vote (up/down)' }, { status: 400 });
    }

    await dbConnect();

    const review = await MenuItemReview.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Find existing vote by this user/guest
    const existingIdx = review.votedBy.findIndex((v: any) => v.odine === odine);

    if (existingIdx > -1) {
      const existing = review.votedBy[existingIdx];

      if (existing.vote === vote) {
        // Same vote again → remove (toggle off)
        review.votedBy.splice(existingIdx, 1);
        if (vote === 'up') review.upvotes = Math.max(0, review.upvotes - 1);
        else review.downvotes = Math.max(0, review.downvotes - 1);
      } else {
        // Opposite vote → switch
        if (existing.vote === 'up') {
          review.upvotes = Math.max(0, review.upvotes - 1);
          review.downvotes += 1;
        } else {
          review.downvotes = Math.max(0, review.downvotes - 1);
          review.upvotes += 1;
        }
        review.votedBy[existingIdx].vote = vote;
      }
    } else {
      // New vote
      review.votedBy.push({ odine, vote });
      if (vote === 'up') review.upvotes += 1;
      else review.downvotes += 1;
    }

    // Recompute score
    review.score = review.upvotes - review.downvotes;
    await review.save();

    return NextResponse.json({
      success: true,
      upvotes: review.upvotes,
      downvotes: review.downvotes,
      score: review.score,
    });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
