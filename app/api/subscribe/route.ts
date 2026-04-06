import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    const htmlContent = `
<div style="max-width: 680px; margin: 0 auto; padding: 50px 28px; font-family: Inter, Arial, sans-serif; background: linear-gradient(135deg, #fafafa, #f0f0f0); color: #1a1a1a;">

  <div style="background: #ffffff; border-radius: 22px; padding: 55px 42px; border: 1px solid #e2e2e2; box-shadow: 0 8px 22px rgba(0,0,0,0.07);">

    <h1 style="font-size: 18px; font-weight: 700; margin: 0 0 26px; text-align: center; letter-spacing: -0.3px; color: #444;">
      Welcome to
      <br>
      <span style="font-size: 32px; color: #d32f2f; font-weight: 800;">INDIAN NEPALI SWAD</span>
    </h1>

    <p style="font-size: 16px; line-height: 1.75; margin: 0 0 32px; color: #333; text-align: center;">
      Hi ${name},<br><br>
      Thank you for subscribing to our newsletter! Stay tuned for updates on our delicious dishes and special offers.
    </p>

    <div style="background: #fdfdfd; border: 1px solid #e8e8e8; border-radius: 14px; padding: 22px 24px; margin-bottom: 40px;">
      <p style="font-size: 15px; margin: 0 0 10px; color: #444; font-weight: 600;">Subscription Information</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <p style="font-size: 14px; margin: 0; color: #555;">Email:<br><strong>${email}</strong></p>
        <p style="font-size: 14px; margin: 0; color: #555;">Subscribed at:<br><strong>${new Date().toLocaleDateString()}</strong></p>
      </div>
    </div>

    <div style="text-align: center; margin-top: 50px;">
      <a href="https://www.indian-nepaliswad.fr" style="background: #d32f2f; color: #fff; padding: 18px 44px; border-radius: 14px; 
                text-decoration: none; font-weight: 700; font-size: 17px; display: inline-block;">
        Visit Our Website
      </a>
    </div>

  </div>

  <p style="font-size: 13px; color: #777; margin-top: 36px; text-align: center; line-height: 1.6;">
    You are receiving this email because you subscribed to our newsletter.
  </p>
  <p style="font-size: 13px; color: #777; margin-top: 36px; text-align: center; line-height: 1.6;">
    Indian Nepali Swad - 4 Rue Bargue, 75015 Paris
  </p>
  <p style="font-size: 13px; color: #777; margin-top: 36px; text-align: center; line-height: 1.6;">
    ©2026 BKTK International · Indian Nepali Swad - All Rights Reserved
  </p>

</div>
`;

    const { data, error } = await resend.emails.send({
      from: 'Indian Nepali Swad <newsletter@bot.indian-nepaliswad.fr>',
      to: [email],
      subject: 'Welcome to Indian Nepali Swad Newsletter',
      html: htmlContent,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}