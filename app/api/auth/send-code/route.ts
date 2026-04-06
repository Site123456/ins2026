import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import dbConnect from '../../../../lib/mongodb';
import VerificationCode from '../../../../models/VerificationCode';
import Subscriber from '../../../../models/Subscriber';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, type, name } = await request.json();

    if (!email || !type) {
      return NextResponse.json({ error: 'Email and type are required' }, { status: 400 });
    }

    await dbConnect();

    const normalizedEmail = email.toLowerCase();

    // Check subscriber status for signin
    if (type === 'signin') {
      const subscriber = await Subscriber.findOne({ email: normalizedEmail });
      if (!subscriber) {
        return NextResponse.json({ error: 'Account not found. Please sign up first.' }, { status: 404 });
      }
      if (!subscriber.isActive) {
        return NextResponse.json({ error: 'Account deactivated. Please contact support.' }, { status: 403 });
      }
    }

    // Check if a code was sent recently (cooldown 30s)
    const existingCode = await VerificationCode.findOne({
      email: normalizedEmail,
      type,
      createdAt: { $gt: new Date(Date.now() - 30 * 1000) }
    });

    if (existingCode) {
      return NextResponse.json({ 
        error: 'Please wait before requesting another code.',
        nextAllowedAt: new Date(existingCode.createdAt.getTime() + 30 * 1000)
      }, { status: 429 });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Save code
    await VerificationCode.findOneAndUpdate(
      { email: normalizedEmail, type },
      { 
        code, 
        name,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        used: false,
        attempts: 0,
        createdAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Send email using Resend
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @media only screen and (max-width: 600px) {
      .container { padding: 16px !important; }
      .code { font-size: 32px !important; letter-spacing: 4px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background:#f9fafb; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; padding:40px 0;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" class="container" style="background:#fff; border-radius:24px; overflow:hidden; box-shadow:0 10px 40px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#ef4444,#dc2626); padding:40px 32px; text-align:center;">
              <div style="display:inline-block; background:#fff; padding:8px; border-radius:16px; margin-bottom:20px; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                <img src="https://indian-nepaliswad.fr/etc/logo.png" alt="INS" style="height:64px; display:block;" />
              </div>
              <h1 style="margin:0; font-size:24px; font-weight:800; color:#fff; letter-spacing:-0.5px;">Verification Code</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 32px; text-align:center;">
              <p style="font-size:16px; color:#4b5563; margin-bottom:32px; line-height:1.6;">
                Hello${name ? ' <strong>' + name + '</strong>' : ''},<br>
                Use the following code to complete your ${type === 'signin' ? 'sign in' : 'sign up'}. This code will expire in 10 minutes.
              </p>
              
              <div style="background:#f8fafc; border:2px dashed #e2e8f0; border-radius:16px; padding:24px; margin-bottom:32px;">
                <div style="font-size:42px; font-weight:800; color:#ef4444; letter-spacing:8px; font-family:monospace; margin-bottom:8px;">${code}</div>
                <p style="margin:0; font-size:12px; color:#94a3b8; text-transform:uppercase; font-weight:600; letter-spacing:1px;">Security Code</p>
              </div>

              <p style="font-size:14px; color:#6b7280; line-height:1.6;">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:32px; background:#f8fafc; border-top:1px solid #f1f5f9; text-align:center;">
              <p style="margin:0; font-size:12px; color:#94a3b8;">
                © 2026 Indian Nepali Swad<br>
                4 Rue Bargue, 75015 Paris | 79 Rue du Landy, 93300 Aubervilliers
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const { data, error: sendError } = await resend.emails.send({
      from: 'Indian Nepali Swad <noreply@bot.indian-nepaliswad.fr>',
      to: [normalizedEmail],
      subject: `${code} is your verification code`,
      html: htmlContent,
    });

    if (sendError) {
      console.error('Email send error:', sendError);
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
