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
    const now = new Date();

    // Check subscriber status and cooldown
    const subscriber = await Subscriber.findOne({ email: normalizedEmail });
    
    if (type === 'signin' && !subscriber) {
      return NextResponse.json({ error: 'Compte introuvable. Veuillez vous inscrire.' }, { status: 404 });
    }

    if (subscriber && !subscriber.isActive) {
      return NextResponse.json({ error: 'Compte désactivé. Veuillez contacter le support.' }, { status: 403 });
    }

    // Check cooldown (30s) from either VerificationCode or Subscriber
    const cooldownPeriod = 30 * 1000;
    const lastSent = subscriber?.lastCodeSentAt || (await VerificationCode.findOne({ email: normalizedEmail, type }))?.createdAt;

    if (lastSent && (now.getTime() - lastSent.getTime() < cooldownPeriod)) {
      const waitTime = Math.ceil((cooldownPeriod - (now.getTime() - lastSent.getTime())) / 1000);
      return NextResponse.json({ 
        error: `Veuillez patienter ${waitTime}s avant de demander un nouveau code.`,
        nextAllowedAt: new Date(lastSent.getTime() + cooldownPeriod)
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
        expiresAt: new Date(now.getTime() + 10 * 60 * 1000), // 10 minutes
        used: false,
        attempts: 0,
        createdAt: now
      },
      { upsert: true, new: true }
    );

    // Update subscriber's lastCodeSentAt
    if (subscriber) {
      subscriber.lastCodeSentAt = now;
      await subscriber.save();
    }

    // Send email using Resend
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @media only screen and (max-width: 600px) {
      .container { padding: 24px 16px !important; }
      .code-box { padding: 32px 16px !important; }
      .code { font-size: 36px !important; letter-spacing: 6px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f7; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7; padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" class="container" style="background-color:#ffffff; border-radius:32px; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.08); border: 1px solid #eef2f6;">
          
          <!-- Header (Centéred & Modern) -->
          <tr>
            <td style="padding:48px 32px 32px; text-align:center;">
              <div style="display:inline-block; background-color:#fff1f2; padding:12px; border-radius:24px; margin-bottom:24px;">
                <img src="https://indian-nepaliswad.fr/etc/logo.png" alt="INS" style="height:64px; display:block;" />
              </div>
              <h1 style="margin:0; font-size:28px; font-weight:800; color:#111827; letter-spacing:-0.5px; line-height:1.2;">Verification Code</h1>
              <p style="margin:12px 0 0; font-size:16px; color:#6b7280; font-weight:500;">Your secure login verification</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:0 40px 48px;">
              <div style="height:1px; background-color:#f1f5f9; margin-bottom:40px;"></div>
              
              <p style="font-size:16px; color:#374151; margin-bottom:32px; line-height:1.6; text-align:center;">
                Bonjour${name ? ' <strong>' + name + '</strong>' : ''},<br>
                Utilisez le code de sécurité ci-dessous pour finaliser votre ${type === 'signin' ? 'connexion' : 'inscription'}. Ce code expirera dans <strong>10 minutes</strong>.
              </p>
              
              <!-- Premium Code Display -->
              <div class="code-box" style="background-color:#f8fafc; border:2px solid #f1f5f9; border-radius:24px; padding:40px; text-align:center; margin-bottom:32px; position:relative;">
                <div style="font-size:48px; font-weight:900; color:#ef4444; letter-spacing:12px; font-family:ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace; line-height:1;">
                  ${code}
                </div>
                <div style="margin-top:16px; font-size:11px; color:#94a3b8; text-transform:uppercase; font-weight:700; letter-spacing:2px;">Sécurité INS</div>
              </div>

              <p style="font-size:14px; color:#94a3b8; text-align:center; line-height:1.6; margin:0;">
                Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité. 
                Veuillez ne jamais partager ce code avec qui que ce soit.
              </p>
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="padding:40px 32px; background-color:#111827; text-align:center;">
              <p style="margin:0; font-size:13px; color:#94a3b8; font-weight:500;">
                &copy; 2026 Indian Nepali Swad Excellence
              </p>
              <p style="margin:8px 0 0; font-size:11px; color:#4b5563;">
                4 Rue Bargue, 75015 Paris &bull; 79 Rue du Landy, 93300 Aubervilliers
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Bottom Links -->
        <table width="560" cellpadding="0" cellspacing="0" style="margin-top:24px;">
          <tr>
            <td style="text-align:center;">
              <a href="https://indian-nepaliswad.fr" style="font-size:12px; color:#94a3b8; text-decoration:none; margin:0 12px; font-weight:600;">Website</a>
              <a href="#" style="font-size:12px; color:#94a3b8; text-decoration:none; margin:0 12px; font-weight:600;">Support</a>
              <a href="#" style="font-size:12px; color:#94a3b8; text-decoration:none; margin:0 12px; font-weight:600;">Privacy</a>
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
