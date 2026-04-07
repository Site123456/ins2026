import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import dbConnect from '@/lib/mongodb';
import MenuItemReview from '@/models/MenuItemReview';
import Subscriber from '@/models/Subscriber';
import { blindIndex } from '@/lib/crypto';
import { reviewConfirmationEmail } from '@/lib/emails/review-emails';
import { MENU_DATA } from '@/data/menu';

const resend = new Resend(process.env.RESEND_API_KEY);

// GET /api/reviews?dishId=X — Fetch reviews for a dish
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dishId = parseInt(searchParams.get('dishId') || '0', 10);

    if (!dishId) {
      return NextResponse.json({ error: 'dishId is required' }, { status: 400 });
    }

    await dbConnect();

    const reviews = await MenuItemReview.find({ dishId })
      .sort({ score: -1, createdAt: -1 })
      .lean();

    const stats = await MenuItemReview.getDishStats(dishId);

    return NextResponse.json({ reviews, stats });
  } catch (error) {
    console.error('Reviews GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/reviews — Create a new review (auth required)
export async function POST(request: NextRequest) {
  try {
    const { email, dishId, rating, comment, language } = await request.json();

    if (!email || !dishId || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    if (comment.trim().length < 3 || comment.trim().length > 1000) {
      return NextResponse.json({ error: 'Comment must be between 3 and 1000 characters' }, { status: 400 });
    }

    await dbConnect();

    const user = await Subscriber.findByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'User not found. Please sign in.' }, { status: 401 });
    }

    // Check if user already reviewed this dish
    const blind = blindIndex(email.toLowerCase());
    const existing = await MenuItemReview.findOne({ dishId, blindEmail: blind });
    if (existing) {
      return NextResponse.json(
        { error: language === 'en' ? 'You already reviewed this dish' : 'Vous avez déjà donné votre avis sur ce plat' },
        { status: 409 }
      );
    }

    const review = await MenuItemReview.create({
      dishId,
      userId: user._id,
      userName: user.name || 'Anonymous',
      blindEmail: blind,
      rating,
      comment: comment.trim(),
      language: language || 'fr',
    });

    // Send confirmation email
    try {
      const dish = MENU_DATA.find(m => m.id === dishId);
      const dishName = dish ? dish.name[language === 'en' ? 'en' : 'fr'] : `Dish #${dishId}`;

      await resend.emails.send({
        from: 'Indian Nepali Swad <no-reply@indian-nepaliswad.fr>',
        to: email,
        subject: language === 'en' ? `Your review for ${dishName}` : `Votre avis sur ${dishName}`,
        html: reviewConfirmationEmail(user.name || 'Client', dishName, rating, language || 'fr'),
      });
    } catch (emailErr) {
      console.error('Review confirmation email failed:', emailErr);
    }

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: 'You already reviewed this dish' }, { status: 409 });
    }
    console.error('Reviews POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
