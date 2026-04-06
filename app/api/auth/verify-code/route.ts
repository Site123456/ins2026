import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import VerificationCode from '@/models/VerificationCode';
import Subscriber from '@/models/Subscriber';

export async function POST(request: NextRequest) {
  try {
    const { email, code, type } = await request.json();

    if (!email || !code || !type) {
      return NextResponse.json({ error: 'Email, code and type are required' }, { status: 400 });
    }

    await dbConnect();

    const normalizedEmail = email.toLowerCase();

    // Find valid code
    const verificationData = await VerificationCode.findOne({
      email: normalizedEmail,
      type,
      code,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!verificationData) {
      // Record failed attempt
      await VerificationCode.updateOne(
        { email: normalizedEmail, type, used: false },
        { $inc: { attempts: 1 } }
      );
      return NextResponse.json({ error: 'Invalid or expired code. Please try again.' }, { status: 400 });
    }

    // Mark code as used
    verificationData.used = true;
    await verificationData.save();

    let subscriber = await Subscriber.findOne({ email: normalizedEmail });

    if (type === 'signup') {
      if (subscriber) {
        return NextResponse.json({ error: 'Account already exists. Please sign in.' }, { status: 409 });
      }

      // Create new subscriber from registration flow (newsletter false)
      subscriber = new Subscriber({
        email: normalizedEmail,
        name: verificationData.name || 'Anonymous',
        newsletterSubscribed: false, // Per request: register sets newsletter false
        isActive: true,
        loginCount: 1,
        lastLoginAt: new Date()
      });
      await subscriber.save();
    } else if (type === 'signin') {
      if (!subscriber) {
        return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
      }

      // Update login stats
      subscriber.loginCount += 1;
      subscriber.lastLoginAt = new Date();
      await subscriber.save();
    } else if (type === 'newsletter') {
      if (subscriber) {
        subscriber.newsletterSubscribed = true; // Per request: newsletter sets newsletter true
        await subscriber.save();
      } else {
        // Create new subscriber from newsletter flow
        subscriber = new Subscriber({
          email: normalizedEmail,
          name: verificationData.name || 'Subscriber',
          newsletterSubscribed: true,
          isActive: true,
          loginCount: 0
        });
        await subscriber.save();
      }
    }

    if (!subscriber) {
      return NextResponse.json({ error: 'Failed to find or create user profile.' }, { status: 500 });
    }

    // Return user data (matching interface in AuthContext)
    return NextResponse.json({
      success: true,
      user: {
        email: subscriber.email,
        name: subscriber.name,
        subscribedAt: subscriber.subscribedAt,
        newsletterSubscribed: subscriber.newsletterSubscribed,
        lastLoginAt: subscriber.lastLoginAt,
        loginCount: subscriber.loginCount
      }
    });

  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
