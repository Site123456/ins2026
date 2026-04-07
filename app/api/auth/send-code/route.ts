import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import dbConnect from "@/lib/mongodb";
import VerificationCode from "@/models/VerificationCode";
import Subscriber from "@/models/Subscriber";

const resend = new Resend(process.env.RESEND_API_KEY);

function generateNewsletterEmail(name: string) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:20px 0">
      <tr><td align="center">
        <table width="650" style="background:#fff;border-radius:18px;overflow:hidden">
          <tr>
            <td style="background:#d32f2f;padding:40px;text-align:center;color:#fff">
              <img src="https://indian-nepaliswad.fr/etc/logo.png" style="height:70px;margin-bottom:14px" />
              <h1 style="margin:0;font-size:28px;font-weight:800">Bienvenue / Welcome 🎉</h1>
            </td>
          </tr>

          <tr><td style="padding:32px">
            <p style="font-size:16px;color:#1f2937;line-height:1.7">
              Bonjour <strong style="color:#d32f2f">${name}</strong>,<br><br>
              Merci de rejoindre la communauté <strong>Indian Nepali Swad</strong> ! Vous recevrez bientôt nos nouveautés, offres exclusives et événements spéciaux.<br><br>
              <span style="color:#6b7280; font-size:14px;">
                Thank you for joining the <strong>Indian Nepali Swad</strong> community! You will soon receive our latest news, exclusive offers, and special events.
              </span>
            </p>
            <p style="margin-top:20px;font-size:12px;color:#6b7280;text-align:center">
              Nous ne vous demanderons jamais de mot de passe — connectez-vous simplement avec votre email ou WhatsApp pour une expérience fluide et sécurisée.<br>
              <span style="font-size:11px;">We will never ask for a password — simply log in with your email or WhatsApp for a seamless experience.</span>
            </p>
          </td></tr>

          <tr><td style="padding:24px;text-align:center;font-size:12px;color:#6b7280">
            © 2026 Indian Nepali Swad — Tous droits réservés / All rights reserved
          </td></tr>
        </table>
      </td></tr>
    </table>
  `;
}

function generateAccountCreatedEmail(name: string, email: string) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:20px 0">
      <tr><td align="center">
        <table width="650" style="background:#fff;border-radius:18px;overflow:hidden">

          <tr>
            <td style="background:linear-gradient(135deg,#d32f2f,#b71c1c);padding:48px;text-align:center;color:#fff">
              <img src="https://indian-nepaliswad.fr/etc/logo.png" style="height:80px;margin-bottom:14px" />
              <h1 style="margin:0;font-size:32px;font-weight:800">Compte créé avec succès 🎉</h1>
              <p style="margin:12px 0 0;font-size:15px;opacity:0.95">Account successfully created</p>
            </td>
          </tr>

          <tr><td style="padding:40px 32px">
            <p style="font-size:17px;color:#1f2937;line-height:1.7;margin-bottom:28px">
              Bonjour / Hello <strong style="color:#d32f2f;font-size:18px">${name}</strong>,<br><br>
              Votre compte est maintenant actif — bienvenue dans la famille INS !<br>
              <span style="color:#6b7280; font-size:14px;">Your account is now active — welcome to the INS family!</span>
            </p>

            <table width="100%" style="background:#fef2f2;border:2px solid #fee2e2;border-radius:12px;overflow:hidden">
              <tr>
                <td style="background:#d32f2f;padding:18px;color:#fff;font-size:12px;font-weight:600;text-transform:uppercase">
                  Informations du compte / Account Information
                </td>
              </tr>
              <tr>
                <td style="padding:24px">
                  <p style="margin:0;font-size:14px;color:#374151"><strong>Nom / Name :</strong> ${name}</p>
                  <p style="margin:8px 0 0;font-size:14px;color:#374151"><strong>Email :</strong> ${email}</p>
                </td>
              </tr>
            </table>

            <div style="margin-top:32px;text-align:center">
              <a href="https://indian-nepaliswad.fr"
                style="display:inline-block;background:#d32f2f;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700">
                Explorer le menu / Explore Menu
              </a>
            </div>

            <p style="margin-top:24px;font-size:12px;color:#6b7280;text-align:center">
              Nous ne vous demanderons jamais de mot de passe — connectez-vous simplement avec votre email ou WhatsApp.<br>
              <span style="font-size:11px;">We will never ask for a password — simply log in with your email or WhatsApp.</span>
            </p>
            <p style="margin-top:32px;font-size:12px;color:#6b7280;text-align:center">
              © 2026 Indian Nepali Swad — Tous droits réservés / All rights reserved
            </p>
          </td></tr>

        </table>
      </td></tr>
    </table>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const { email, type, name } = await request.json();

    if (!email || !type) {
      return NextResponse.json(
        { error: "Email et type requis. / Email and type required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const normalizedEmail = email.toLowerCase();
    const now = new Date();

    // ---------------------------------------------------------------------
    // 1. CHECK IF USER EXISTS
    // ---------------------------------------------------------------------
    let existingUser = await Subscriber.findOne({ email: normalizedEmail });

    // USER EXISTS → SIGNUP SHOULD SWITCH TO SIGN-IN
    if (existingUser && type === "signup") {
      return NextResponse.json(
        {
          error: "Un compte existe déjà avec cet email. / Account already exists.",
          forceMode: "signin",
        },
        { status: 400 }
      );
    }

    // USER DOES NOT EXIST → SIGN-IN SHOULD SWITCH TO SIGNUP
    if (!existingUser && type === "signin") {
      return NextResponse.json(
        {
          error: "Aucun compte trouvé. / No account found.",
          forceMode: "signup",
        },
        { status: 400 }
      );
    }

    // USER EXISTS BUT IS BANNED
    if (existingUser && !existingUser.isActive) {
      return NextResponse.json(
        { error: "Votre compte est suspendu. / Your account is suspended." },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------------------
    // 2. SIGNUP & NEWSLETTER FLOW (NO OTP)
    // ---------------------------------------------------------------------
    if (type === "signup" || type === "newsletter") {
      const isNewsletter = type === "newsletter";

      if (existingUser) {
        // NEWSLETTER → activate + send confirmation email ONCE
        if (isNewsletter) {
          if (!existingUser.newsletterSubscribed) {
            existingUser.newsletterSubscribed = true;
            await existingUser.save();

            const html = generateNewsletterEmail(existingUser.name || "Cher client");

            await resend.emails.send({
              from: "Indian Nepali Swad <noreply@bot.indian-nepaliswad.fr>",
              to: [normalizedEmail],
              subject: "Bienvenue dans la newsletter INS / Welcome to INS newsletter",
              html,
            });
          }

          return NextResponse.json({
            success: true,
            user: existingUser,
            message: "Newsletter activée. / Newsletter activated.",
          });
        }
      }

      // USER DOES NOT EXIST → CREATE ACCOUNT
      const newUser = await Subscriber.create({
        email: normalizedEmail,
        name: name?.trim() || "Utilisateur",
        subscribedAt: new Date(),
        isActive: true,
        newsletterSubscribed: isNewsletter,
        loginCount: 1, // Automatically logged in, so count is 1
        lastLoginAt: new Date()
      });

      // SEND SINGLE WELCOME EMAIL (ACCOUNT OR NEWSLETTER)
      const html = isNewsletter
        ? generateNewsletterEmail(newUser.name)
        : generateAccountCreatedEmail(newUser.name, normalizedEmail);

      const subject = isNewsletter
        ? "Bienvenue dans la newsletter INS / Welcome to INS Newsletter"
        : "Votre compte a été créé avec succès 🎉 / Account created successfully 🎉";

      await resend.emails.send({
        from: "Indian Nepali Swad <noreply@bot.indian-nepaliswad.fr>",
        to: [normalizedEmail],
        subject,
        html,
      });

      return NextResponse.json({
        success: true,
        user: newUser, // Return new user to trigger auto-login
        message: isNewsletter
          ? "Inscription réussie / Successfully subscribed."
          : "Compte créé avec succès / Account created successfully.",
      });
    }


    // ---------------------------------------------------------------------
    // 3. SIGN-IN FLOW (OTP)
    // ---------------------------------------------------------------------
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

    // Build login URL + QR
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
                    Code de Connexion<br>
                    <span style="color:#6b7280; font-size:20px;">Login Code</span>
                  </h1>

                  <p style="margin:12px 0 0; font-size:16px; color:#6b7280; font-weight:500;">
                    Authentification sécurisée / Secure Auth
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 40px 48px;">
                  <div style="height:1px; background-color:#f1f5f9; margin-bottom:40px;"></div>

                  <p style="font-size:16px; color:#374151; margin-bottom:32px; line-height:1.6; text-align:center;">
                    Bonjour / Hello\${existingUser?.name ? ' <strong>' + existingUser.name + '</strong>' : ''},<br>
                    Voici votre code de connexion. Il expirera dans <strong>10 minutes</strong>.<br>
                    <span style="color:#6b7280; font-size:14px;">Here is your login code. It will expire in <strong>10 minutes</strong>.</span>
                  </p>

                  <!-- Code Box -->
                  <div class="code-box" style="background-color:#f8fafc; border:2px solid #f1f5f9; border-radius:24px; padding:40px; text-align:center; margin-bottom:32px;">
                    <div class="code" style="font-size:48px; font-weight:900; color:#ef4444; letter-spacing:12px; font-family:ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace;">
                      \${code}
                    </div>
                    <div style="margin-top:16px; font-size:11px; color:#94a3b8; text-transform:uppercase; font-weight:700; letter-spacing:2px;">
                      Code de vérification INS / INS Verification Code
                    </div>
                  </div>

                  <!-- QR Code -->
                  <div style="text-align:center; margin-bottom:32px;">
                    <div style="padding:16px; background-color:#e0e7ff; display:inline-block; border-radius:16px; margin-bottom:14px; ">
                      <img src="\${qrUrl}" alt="QR Code" class="qr" style="width:220px; height:220px;" />
                    </div>
                    <p style="font-size:13px; color:#6b7280; margin-top:12px;">
                      Scannez pour vous connecter / Scan to log in
                    </p>
                  </div>

                  <!-- Sign In Button -->
                  <div style="text-align:center; margin-bottom:32px;">
                    <a href="\${loginUrl}"
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
                      Connexion automatique / Auto Login
                    </a>
                  </div>

                  <p style="font-size:14px; color:#94a3b8; text-align:center; line-height:1.6; margin:0;">
                    Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email. Ne partagez jamais ce code.<br>
                    <span style="font-size:12px;">If you did not request this, simply ignore this email. Never share this code.</span>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:40px 32px; background-color:#111827; text-align:center;">
                  <p style="margin:0; font-size:13px; color:#94a3b8; font-weight:500;">
                    &copy; 2026 Indian Nepali Swad. Tous droits réservés / All rights reserved.
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
    const expirationTime = new Date(
      now.getTime() + 10 * 60 * 1000
    ).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const subject = `${code} est votre code de connexion / is your login code`;

    const { error: sendError } = await resend.emails.send({
      from: "Indian Nepali Swad <noreply@bot.indian-nepaliswad.fr>",
      to: [normalizedEmail],
      subject,
      html: htmlContent,
    });

    if (sendError) {
      console.error("Email send error:", sendError);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, otp: true });
  } catch (error) {
    console.error("Erreur API send-code:", error);
    return NextResponse.json(
      { error: "Erreur interne. Réessayez plus tard." },
      { status: 500 }
    );
  }
}
