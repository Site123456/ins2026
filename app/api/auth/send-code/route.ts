import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import dbConnect from '@/lib/mongodb';
import VerificationCode from '@/models/VerificationCode';
import Subscriber from '@/models/Subscriber';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, type, name } = await request.json();

    if (!email || !type) {
      return NextResponse.json(
        { error: 'Email et type requis.' },
        { status: 400 }
      );
    }

    await dbConnect();

    const normalizedEmail = email.toLowerCase();
    const now = new Date();

    // ---------------------------------------------------------------------
    // 1. CHECK IF USER EXISTS
    // ---------------------------------------------------------------------
    const existingUser = await Subscriber.findOne({ email: normalizedEmail });

    // If user exists → they MUST login, not signup/newsletter
    if (existingUser && type !== 'signin') {
      return NextResponse.json(
        {
          error: "Un compte existe déjà avec cet email. Veuillez vous connecter.",
          forceMode: "signin",
        },
        { status: 400 }
      );
    }

    // If user does NOT exist → they MUST signup/newsletter, not signin
    if (!existingUser && type === 'signin') {
      return NextResponse.json(
        {
          error: "Aucun compte trouvé. Veuillez créer un compte.",
          forceMode: "signup",
        },
        { status: 400 }
      );
    }

    // If user exists but is banned
    if (existingUser && !existingUser.isActive) {
      return NextResponse.json(
        { error: 'Votre compte est suspendu. Contactez le support.' },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------------------
    // 2. COOLDOWN CHECK (30 seconds)
    // ---------------------------------------------------------------------
    const cooldownMs = 30 * 1000;

    const lastSent =
      existingUser?.lastCodeSentAt ||
      (await VerificationCode.findOne({ email: normalizedEmail, type }))?.createdAt;

    if (lastSent && now.getTime() - lastSent.getTime() < cooldownMs) {
      const wait = Math.ceil((cooldownMs - (now.getTime() - lastSent.getTime())) / 1000);
      return NextResponse.json(
        {
          error: `Action trop rapide. Réessayez dans ${wait}s.`,
          nextAllowedAt: new Date(lastSent.getTime() + cooldownMs),
        },
        { status: 429 }
      );
    }
    if (type === "signup" || type === "newsletter") {
      let user = await Subscriber.findOne({ email: normalizedEmail });

      // If user already exists → do NOT block signup/newsletter
      if (user) {
        // Newsletter should simply activate newsletterSubscribed
        if (type === "newsletter") {
          user.newsletterSubscribed = true;
          await user.save();

          return NextResponse.json({
            success: true,
            message: "Inscription à la newsletter confirmée.",
          });
        }

        // Signup: user already exists → treat as success (no OTP)
        return NextResponse.json({
          success: true,
          message: "Vous êtes déjà inscrit.",
        });
      }

      // If user does NOT exist → create account
      await Subscriber.create({
        email: normalizedEmail,
        name: name?.trim() || "Utilisateur",
        subscribedAt: new Date(),
        isActive: true,
        newsletterSubscribed: type === "newsletter",
        loginCount: 0,
      });

      return NextResponse.json({
        success: true,
        message:
          type === "signup"
            ? "Compte créé avec succès."
            : "Inscription à la newsletter réussie.",
      });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await VerificationCode.findOneAndUpdate(
      { email: normalizedEmail, type },
      {
        code,
        expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
        used: false,
        attempts: 0,
        createdAt: now,
      },
      { upsert: true, new: true }
    );

    // Update cooldown timestamp
    if (existingUser) {
      existingUser.lastCodeSentAt = now;
      await existingUser.save();
    }
    const loginUrl = `https://indian-nepaliswad.fr/auth/code?email=${encodeURIComponent(normalizedEmail)}&code=${code}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(loginUrl)}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        @media only screen and (max-width: 600px) {
          .container { padding: 24px 16px !important; }
          .code-box { padding: 32px 16px !important; }
          .code { font-size: 36px !important; letter-spacing: 6px !important; }
          .btn { padding: 14px 20px !important; font-size: 16px !important; }
          .qr { width: 180px !important; height: 180px !important; }
        }
      </style>
    </head>

    <body style="margin:0; padding:0; background-color:#f4f4f7; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">

      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7; padding:40px 0;">
        <tr>
          <td align="center">

            <!-- Main Card -->
            <table width="560" cellpadding="0" cellspacing="0" class="container" style="background-color:#ffffff; border-radius:32px; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.08); border:1px solid #eef2f6;">

              <!-- Header -->
              <tr>
                <td style="padding:48px 32px 32px; text-align:center;">
                  <div style="display:inline-block; background-color:#fff1f2; padding:12px; border-radius:24px; margin-bottom:24px;">
                    <img src="https://indian-nepaliswad.fr/etc/logo.png" alt="INS" style="height:64px; display:block;" />
                  </div>

                  <h1 style="margin:0; font-size:28px; font-weight:800; color:#111827; letter-spacing:-0.5px; line-height:1.2;">
                    Code de Connexion
                  </h1>

                  <p style="margin:12px 0 0; font-size:16px; color:#6b7280; font-weight:500;">
                    Authentification sécurisée
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:0 40px 48px;">
                  <div style="height:1px; background-color:#f1f5f9; margin-bottom:40px;"></div>

                  <p style="font-size:16px; color:#374151; margin-bottom:32px; line-height:1.6; text-align:center;">
                    Bonjour${existingUser?.name ? ' <strong>' + existingUser.name + '</strong>' : ''},<br>
                    Voici votre code de connexion. Il expirera dans <strong>10 minutes</strong>.
                  </p>

                  <!-- Code Box -->
                  <div class="code-box" style="background-color:#f8fafc; border:2px solid #f1f5f9; border-radius:24px; padding:40px; text-align:center; margin-bottom:32px;">
                    <div class="code" style="font-size:48px; font-weight:900; color:#ef4444; letter-spacing:12px; font-family:ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace;">
                      ${code}
                    </div>
                    <div style="margin-top:16px; font-size:11px; color:#94a3b8; text-transform:uppercase; font-weight:700; letter-spacing:2px;">
                      Code de vérification Indian Nepali Swad
                    </div>
                  </div>

                  <!-- QR Code -->
                  <div style="text-align:center; margin-bottom:32px;">
                    <div style="padding:16px; background-color:#e0e7ff; display:inline-block; border-radius:16px; margin-bottom:14px; ">
                      <img src="${qrUrl}" alt="QR Code" class="qr" style="width:220px; height:220px;" />
                    </div>
                    <p style="font-size:13px; color:#6b7280; margin-top:12px;">
                      Scannez pour vous connecter automatiquement
                    </p>
                  </div>

                  <!-- Sign In Button -->
                  <div style="text-align:center; margin-bottom:32px;">
                    <a href="${loginUrl}"
                      class="btn"
                      style="
                        display:inline-block;
                        background-color:#ef4444;
                        color:#ffffff;
                        padding:16px 28px;
                        border-radius:14px;
                        font-size:18px;
                        font-weight:700;
                        text-decoration:none;
                        letter-spacing:0.5px;
                        box-shadow:0 10px 20px rgba(239,68,68,0.25);
                      ">
                      Connexion automatique
                    </a>
                  </div>

                  <p style="font-size:14px; color:#94a3b8; text-align:center; line-height:1.6; margin:0;">
                    Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.
                    Ne partagez jamais ce code.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:40px 32px; background-color:#111827; text-align:center;">
                  <p style="margin:0; font-size:13px; color:#94a3b8; font-weight:500;">
                    &copy; 2026 Indian Nepali Swad. Tous droits réservés.
                  </p>
                  <p style="margin:8px 0 0; font-size:11px; color:#4b5563;">
                    4 Rue Bargue, 75015 Paris • 79 Rue du Landy, 93300 Aubervilliers
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


    const { error: sendError } = await resend.emails.send({
      from: 'Indian Nepali Swad <noreply@bot.indian-nepaliswad.fr>',
      to: [normalizedEmail],
      subject: `${code} — Votre code de connexion`,
      html: htmlContent,
    });

    if (sendError) {
      console.error('Email send error:', sendError);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, otp: true });
  } catch (error) {
    console.error('Erreur API send-code:', error);
    return NextResponse.json(
      { error: 'Erreur interne. Réessayez plus tard.' },
      { status: 500 }
    );
  }
}
