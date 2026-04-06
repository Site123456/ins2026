import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Subscriber from '../../../models/Subscriber';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    // Connect to database
    await dbConnect();

    // Check if subscriber exists and is active
    const subscriber = await Subscriber.findOne({
      email: email.toLowerCase()
    });

    if (!subscriber) {
      return NextResponse.json({
        isSubscribed: false,
        message: 'Email not found in subscription list'
      });
    }

    if (!subscriber.isActive) {
      return NextResponse.json({
        isSubscribed: false,
        banned: true,
        message: 'This account has been banned. Please contact support.'
      });
    }

    return NextResponse.json({
      isSubscribed: true,
      subscriber: {
        email: subscriber.email,
        name: subscriber.name,
        subscribedAt: subscriber.subscribedAt,
        newsletterSubscribed: subscriber.newsletterSubscribed,
        lastLoginAt: subscriber.lastLoginAt,
        loginCount: subscriber.loginCount,
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Connect to database
    await dbConnect();

    // Check if subscriber exists and is active
    const subscriber = await Subscriber.findOne({
      email: email.toLowerCase()
    });

    if (!subscriber) {
      return NextResponse.json({
        isSubscribed: false,
        message: 'Email not found in subscription list'
      });
    }

    if (!subscriber.isActive) {
      return NextResponse.json({
        isSubscribed: false,
        banned: true,
        message: 'This account has been banned. Please contact support.'
      });
    }

    return NextResponse.json({
      isSubscribed: true,
      subscriber: {
        email: subscriber.email,
        name: subscriber.name,
        subscribedAt: subscriber.subscribedAt,
        newsletterSubscribed: subscriber.newsletterSubscribed,
        lastLoginAt: subscriber.lastLoginAt,
        loginCount: subscriber.loginCount,
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}