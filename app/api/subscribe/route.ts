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
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    /* Mobile overrides */
    @media only screen and (max-width: 600px) {
      .container { padding: 16px !important; }
      .grid-2 { width: 100% !important; display: block !important; }
      .feature-box { margin-bottom: 14px !important; }
    }
  </style>
</head>

<body style="margin:0; padding:0; background:#f5f6f8; font-family:'Segoe UI', Tahoma, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8; padding:20px 0;">
    <tr>
      <td align="center">

        <!-- MAIN WRAPPER -->
        <table width="650" cellpadding="0" cellspacing="0" class="container" style="background:#fff; border-radius:18px; overflow:hidden; box-shadow:0 8px 28px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#d32f2f,#b71c1c); padding:48px 32px; text-align:center; color:#fff; position:relative;">
              <!-- Logo with distinct white background -->
              <div style="display:inline-block; background:#fff; padding:6px 6px; border-radius:16px; margin-bottom:14px; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                <img src="https://indian-nepaliswad.fr/etc/logo.png" alt="INS" style="height:80px; display:block;" />
              </div>
              
              <h1 style="margin:0; font-size:32px; font-weight:800; letter-spacing:-0.5px;">Account Created Successfully 🎉</h1>
              <p style="margin:12px 0 0; font-size:15px; opacity:0.95; font-weight:500;">Welcome to Indian Nepali Swad</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:40px 32px;">

              <!-- GREETING -->
              <p style="font-size:17px; color:#1f2937; line-height:1.7; margin:0 0 28px;">
                Hi <strong style="color:#d32f2f; font-size:18px;">${name}</strong>,<br><br>
                Your account is now active — welcome to the <strong>Indian Nepali Swad</strong> family!  
                <span style="color:#6b7280; font-size:14px; display:block; margin-top:10px;">
                  Enjoy a personalized experience, exclusive features, and more.
                </span>
              </p>

              <!-- ACCOUNT INFO -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #fef2f2 0%, #ffe4e6 100%); border:2px solid #fee2e2; border-radius:12px; padding:0; overflow:hidden;">
                <!-- Header with icon -->
                <tr>
                  <td style="background:linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%); padding:18px 24px; color:#fff;">
                    <p style="margin:0; font-size:12px; font-weight:600; color:#fff; text-transform:uppercase; letter-spacing:0.8px; opacity:0.95;">
                      📋 Account Information
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="grid-2" width="50%" style="padding-right:12px;">
                          <p style="margin:0; font-size:11px; font-weight:600; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px;">Name</p>
                          <p style="margin:8px 0 0; font-size:16px; font-weight:700; color:#1f2937; line-height:1.4;">${name}</p>
                        </td>

                        <td class="grid-2" width="50%" style="padding-left:12px;">
                          <p style="margin:0; font-size:11px; font-weight:600; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px;">Email</p>
                          <p style="margin:8px 0 0; font-size:16px; font-weight:700; color:#1f2937; word-break:break-all; line-height:1.4;">${email}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- FEATURES TITLE -->
              <p style="margin:32px 0 16px; font-size:14px; font-weight:700; color:#111827; text-transform:uppercase;">
                Your Access & Features
              </p>

              <!-- FEATURES GRID (Email-safe table grid) -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="grid-2" width="50%" style="padding:7px;">
                    <div class="feature-box" style="background:#f0fdf4; border:1px solid #dcfce7; padding:16px; border-radius:10px; text-align:center;">
                      <div style="font-size:20px;">📅</div>
                      <div style="font-size:13px; font-weight:700; color:#15803d;">Reservations</div>
                      <div style="font-size:12px; color:#4b5563;">Book & manage tables</div>
                    </div>
                  </td>

                  <td class="grid-2" width="50%" style="padding:7px;">
                    <div class="feature-box" style="background:#eff6ff; border:1px solid #bfdbfe; padding:16px; border-radius:10px; text-align:center;">
                      <div style="font-size:20px;">⭐</div>
                      <div style="font-size:13px; font-weight:700; color:#1e40af;">Reviews</div>
                      <div style="font-size:12px; color:#4b5563;">Rate dishes</div>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td class="grid-2" width="50%" style="padding:7px;">
                    <div class="feature-box" style="background:#fef3c7; border:1px solid #fde68a; padding:16px; border-radius:10px; text-align:center;">
                      <div style="font-size:20px;">❤️</div>
                      <div style="font-size:13px; font-weight:700; color:#92400e;">Favorites</div>
                      <div style="font-size:12px; color:#4b5563;">Save dishes</div>
                    </div>
                  </td>

                  <td class="grid-2" width="50%" style="padding:7px;">
                    <div class="feature-box" style="background:#f5f3ff; border:1px solid #e9d5ff; padding:16px; border-radius:10px; text-align:center;">
                      <div style="font-size:20px;">💬</div>
                      <div style="font-size:13px; font-weight:700; color:#6b21a8;">Feedback</div>
                      <div style="font-size:12px; color:#4b5563;">Share experience</div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- COMING SOON -->
              <div style="margin-top:18px; background:#fff7e6; border-left:4px solid #f59e0b; padding:14px; border-radius:8px;">
                <p style="margin:0; font-size:13px; color:#78350f;">
                  🚀 <strong>Coming Soon:</strong> Loyalty rewards, order history, and more.
                </p>
              </div>

              <!-- CTA -->
              <div style="margin:32px 0;">
                <a href="https://www.indian-nepaliswad.fr" 
                   style="display:block; background:#d32f2f; color:#fff; padding:16px; border-radius:10px; text-align:center; text-decoration:none; font-weight:700; font-size:15px;">
                  Explore Our Menu
                </a>
              </div>

              <!-- FOOTER -->
              <div style="text-align:center; font-size:12px; color:#6b7280; margin-top:20px;">
                <p style="margin:0 0 10px;">
                  <strong style="color:#1f2937;">Indian Nepali Swad</strong><br />
                  4 Rue Bargue, 75015 Paris, France<br />
                  79 Rue du Landy, 93300 Aubervilliers, France
                </p>

                <p style="margin:16px 0 0; font-size:10px; color:#9ca3af;">
                  © 2026 Indian Nepali Swad — All Rights Reserved
                </p>
              </div>

            </td>
          </tr>
          <tr>
            <td style="background:#f5f6f8; height:8px;"></td>
          </tr>
          <tr>
            <td style="padding:24px 32px; background:#f9fafb; border-top:1px solid #e5e7eb;">

                <h3 style="margin:0 0 12px; font-size:14px; font-weight:700; color:#374151; text-transform:uppercase; letter-spacing:0.5px;">
                Legal & Account Policies
                </h3>

                <!-- ACCOUNT USAGE -->
                <p style="margin:0 0 14px; font-size:12px; line-height:1.7; color:#4b5563;">
                <strong style="color:#111827;">Account Usage:</strong>  
                By creating an account with Indian Nepali Swad, you agree to use our services responsibly and in compliance with our platform rules.  
                Misuse of features, fraudulent activity, unauthorized access attempts, or actions that disrupt our service may result in temporary or permanent restrictions.
                </p>

                <!-- TERMINATION -->
                <p style="margin:0 0 14px; font-size:12px; line-height:1.7; color:#4b5563;">
                <strong style="color:#111827;">Account Termination:</strong>  
                We reserve the right to suspend or terminate accounts that violate our policies, engage in harmful behavior, or compromise the safety of our platform or community.  
                You may request voluntary account deletion at any time by contacting our support team.
                </p>

                <!-- PRIVACY -->
                <p style="margin:0; font-size:12px; line-height:1.7; color:#4b5563;">
                <strong style="color:#111827;">Privacy & Data Protection:</strong>  
                Your personal information is handled securely and used only to provide and improve our services.  
                For full details, please review our Privacy Policy on our website.
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

    const { data, error } = await resend.emails.send({
      from: 'Indian Nepali Swad <noreply@bot.indian-nepaliswad.fr>',
      to: [email],
      subject: 'Welcome to Indian Nepali Swad! Your Account Has Been Created 🎉',
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