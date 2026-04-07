import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import dbConnect from '@/lib/mongodb';
import MenuItemReview from '@/models/MenuItemReview';
import Subscriber from '@/models/Subscriber';
import { blindIndex } from '@/lib/crypto';
import { reviewReplyNotificationEmail } from '@/lib/emails/review-emails';
import { MENU_DATA } from '@/data/menu';

const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/reviews/reply — Add a reply to a review (auth required)
export async function POST(request: NextRequest) {
  try {
    const { reviewId, email, comment } = await request.json();

    if (!reviewId || !email || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (comment.trim().length < 3 || comment.trim().length > 500) {
      return NextResponse.json({ error: 'Comment must be between 3 and 500 characters' }, { status: 400 });
    }

    await dbConnect();

    const user = await Subscriber.findByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'User not found. Please sign in.' }, { status: 401 });
    }

    const review = await MenuItemReview.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const blind = blindIndex(email.toLowerCase());

    review.replies.push({
      userId: user._id,
      userName: user.name || 'Anonymous',
      blindEmail: blind,
      comment: comment.trim(),
      createdAt: new Date(),
    });

    await review.save();

    // Send email notification to the original reviewer (if it's not themselves)
    if (review.blindEmail !== blind) {
      try {
        // Find original reviewer by their blindEmail
        const originalReviewer = await Subscriber.findOne({ blindEmail: review.blindEmail });
        if (originalReviewer && originalReviewer.email) {
          const dish = MENU_DATA.find(m => m.id === review.dishId);
          const lang = originalReviewer.language || 'fr';
          const dishName = dish ? dish.name[lang] : `Dish #${review.dishId}`;

          await resend.emails.send({
            from: 'Indian Nepali Swad <no-reply@indian-nepaliswad.fr>',
            to: originalReviewer.email,
            subject: lang === 'en'
              ? `${user.name || 'Someone'} replied to your review`
              : `${user.name || 'Quelqu\'un'} a répondu à votre avis`,
            html: reviewReplyNotificationEmail(
              originalReviewer.name || 'Client',
              user.name || 'Anonymous',
              dishName,
              comment.trim(),
              lang
            ),
          });
        }
      } catch (emailErr) {
        console.error('Reply notification email failed:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      replies: review.replies,
    });
  } catch (error) {
    console.error('Reply error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
