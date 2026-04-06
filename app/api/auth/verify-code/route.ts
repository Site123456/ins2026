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
        // If they already exist (e.g. from newsletter), update their info instead of erroring
        subscriber.name = verificationData.name || subscriber.name || 'Anonymous';
        subscriber.isActive = true;
        // Don't change newsletterSubscribed here unless they opt-in elsewhere
        subscriber.loginCount += 1;
        subscriber.lastLoginAt = new Date();
        await subscriber.save();
      } else {
        // Create new subscriber from registration flow
        subscriber = new Subscriber({
          email: normalizedEmail,
          name: verificationData.name || 'Prénom & Nom',
          newsletterSubscribed: false, 
          isActive: true,
          loginCount: 1,
          lastLoginAt: new Date()
        });
        await subscriber.save();
      }
    } else if (type === 'signin') {
      if (!subscriber) {
        // If user was not found but verified correctly, they likely need an account
        // This makes the flow seamless: if they didn't have an account, they get one now.
        subscriber = new Subscriber({
          email: normalizedEmail,
          name: verificationData.name || 'Prénom & Nom',
          newsletterSubscribed: false,
          isActive: true,
          loginCount: 1,
          lastLoginAt: new Date()
        });
        await subscriber.save();
      } else {
        // Regular signin: Update login stats
        subscriber.loginCount += 1;
        subscriber.lastLoginAt = new Date();
        await subscriber.save();
      }
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
    console.error('Erreur API verify-code:', error);
    return NextResponse.json({ error: 'Erreur technique lors de la vérification. Veuillez réessayer.' }, { status: 500 });
  }
}
