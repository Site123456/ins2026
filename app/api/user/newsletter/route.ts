import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Subscriber from '@/models/Subscriber';

export async function POST(request: NextRequest) {
  try {
    const { email, subscribed } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await dbConnect();

    const subscriber = await Subscriber.findByEmail(email);
    if (subscriber) {
      subscriber.newsletterSubscribed = subscribed;
      await (subscriber as any).save();
    }

    if (!subscriber) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      newsletterSubscribed: subscriber.newsletterSubscribed
    });
  } catch (error) {
    console.error('Newsletter update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}