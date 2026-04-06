import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Subscriber from '../../../../models/Subscriber';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await dbConnect();

    // Type casting to any to avoid complex mongoose generic issues in quick fix, 
    // but ensuring the functionality is correct.
    const subscriber = await (Subscriber as any).findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        $inc: { loginCount: 1 },
        $set: { lastLoginAt: new Date() }
      },
      { new: true }
    );

    if (!subscriber) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}