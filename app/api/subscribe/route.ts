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
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);">
  <div style="max-width: 650px; margin: 0 auto; padding: 20px;">
    
    <!-- Header with background -->
    <div style="background: linear-gradient(135deg, #d32f2f 0%, #c41c1c 100%); border-radius: 16px 16px 0 0; padding: 50px 30px; text-align: center; position: relative; overflow: hidden;">
      <div style="position: absolute; top: -40px; right: -40px; width: 200px; height: 200px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.5;"></div>
      <div style="position: absolute; bottom: -60px; left: -60px; width: 250px; height: 250px; background: rgba(255,255,255,0.05); border-radius: 50%; opacity: 0.3;"></div>
      <div style="position: relative; z-index: 1;">
        <img src="https://indian-nepaliswad.fr/etc/logo.png" alt="Indian Nepali Swad" style="height: 70px; margin-bottom: 25px; filter: brightness(0) invert(1);">
        <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 800; letter-spacing: -0.8px;">
          Account Created Successfully! 🎉
        </h1>
        <p style="margin: 12px 0 0; color: rgba(255,255,255,0.95); font-size: 15px; font-weight: 500;">
          Welcome to Indian Nepali Swad
        </p>
      </div>
    </div>

    <!-- Main content -->
    <div style="background: white; padding: 45px 35px; border-radius: 0 0 16px 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
      
      <!-- Greeting -->
      <p style="margin: 0 0 30px; font-size: 17px; line-height: 1.7; color: #1f2937; font-weight: 500;">
        Hi <span style="color: #d32f2f; font-weight: 700; font-size: 18px;">${name}</span>,<br><br>
        Your account has been created and you're now part of the <strong>Indian Nepali Swad</strong> community! 🙏<br><br>
        <span style="color: #6b7280; font-size: 15px;">Explore an entirely fresh experience with personalized features, exclusive content, and much more.</span>
      </p>

      <!-- Account Info Section -->
      <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #fecaca; border-radius: 14px; padding: 25px; margin-bottom: 30px;">
        <p style="margin: 0 0 18px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #c41c1c;">📋 Account Information</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 15px;">
          <div>
            <p style="margin: 0 0 6px; font-size: 12px; color: #9ca3af; font-weight: 600;">Account Name</p>
            <p style="margin: 0; font-size: 15px; color: #1f2937; font-weight: 700;">${name}</p>
          </div>
          <div>
            <p style="margin: 0 0 6px; font-size: 12px; color: #9ca3af; font-weight: 600;">Email Address</p>
            <p style="margin: 0; font-size: 15px; color: #1f2937; font-weight: 700; word-break: break-all;">${email}</p>
          </div>
        </div>
        <div style="border-top: 1px solid #fca5a5; padding-top: 15px;">
          <p style="margin: 0 0 6px; font-size: 12px; color: #9ca3af; font-weight: 600;">Status</p>
          <p style="margin: 0; font-size: 14px; color: #10b981; font-weight: 700;">✓ Active & Ready to Use</p>
        </div>
      </div>

      <!-- Access & Permissions -->
      <div style="margin-bottom: 30px;">
        <p style="margin: 0 0 18px; font-size: 14px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.5px;">🔓 Your Access & Permissions</p>
        
        <!-- Features Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div style="background: #f0fdf4; border: 2px solid #dcfce7; border-radius: 10px; padding: 16px; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 20px;">📅</p>
            <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #15803d;">Manage Reservations</p>
            <p style="margin: 0; font-size: 12px; color: #4b5563;">Book & manage your table reservations</p>
          </div>
          
          <div style="background: #eff6ff; border: 2px solid #bfdbfe; border-radius: 10px; padding: 16px; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 20px;">⭐</p>
            <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #1e40af;">Reviews & Ratings</p>
            <p style="margin: 0; font-size: 12px; color: #4b5563;">Rate & review our delicious dishes</p>
          </div>

          <div style="background: #fef3c7; border: 2px solid #fcd34d; border-radius: 10px; padding: 16px; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 20px;">❤️</p>
            <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #92400e;">Manage Favorites</p>
            <p style="margin: 0; font-size: 12px; color: #4b5563;">Save your favorite dishes & meals</p>
          </div>

          <div style="background: #f5f3ff; border: 2px solid #e9d5ff; border-radius: 10px; padding: 16px; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 20px;">💬</p>
            <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #6b21a8;">Comments & Feedback</p>
            <p style="margin: 0; font-size: 12px; color: #4b5563;">Share your experience with our food</p>
          </div>
        </div>

        <!-- Coming Soon -->
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 5px solid #f59e0b; border-radius: 8px; padding: 16px; margin-top: 16px;">
          <p style="margin: 0; font-size: 13px; color: #78350f; line-height: 1.6;">
            <strong>🚀 Coming Soon:</strong> More exclusive features are on the way! Order history, loyalty rewards, special member-only deals, and much more to enhance your experience.
          </p>
        </div>
      </div>

      <!-- Divider -->
      <div style="height: 2px; background: linear-gradient(to right, transparent, #e5e7eb, transparent); margin: 30px 0;"></div>

      <!-- Newsletter Info -->
      <div style="background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 18px; margin-bottom: 30px;">
        <p style="margin: 0 0 10px; font-size: 13px; font-weight: 700; color: #1e40af;">📬 You're Also Subscribed to Our Newsletter</p>
        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #1e3a8a;">
          Enjoy exclusive offers, menu updates, special promotions, and be the first to know about our latest events and dishes!
        </p>
      </div>

      <!-- CTA Buttons -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 30px;">
        <a href="https://www.indian-nepaliswad.fr" style="display: block; background: white; color: #d32f2f; padding: 16px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; border: 2px solid #d32f2f; text-align: center; transition: background 0.2s;">
          Explore Our Menu
        </a>
      </div>

      <!-- Footer Section -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 25px;">
        <div style="text-align: center; font-size: 12px; color: #4b5563; line-height: 1.9;">
          <p style="margin: 0 0 12px;">
            <strong style="color: #1f2937; display: block; margin-bottom: 4px;">Indian Nepali Swad</strong>
            4 Rue Bargue, 75015 Paris, France<br>
            <span style="font-size: 11px; color: #9ca3af;">🍛 Experience authentic Indian & Nepali cuisine</span>
          </p>
          
          <div style="margin: 15px 0; display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
            <a href="https://www.indian-nepaliswad.fr" style="color: #d32f2f; text-decoration: none; font-weight: 600; font-size: 11px;">Website</a>
            <span style="color: #d1d5db;">•</span>
            <a href="https://www.facebook.com/people/Indian-Nepali-Swad/" style="color: #d32f2f; text-decoration: none; font-weight: 600; font-size: 11px;">Facebook</a>
            <span style="color: #d1d5db;">•</span>
            <a href="https://www.instagram.com/indiannepaliswad/" style="color: #d32f2f; text-decoration: none; font-weight: 600; font-size: 11px;">Instagram</a>
            <span style="color: #d1d5db;">•</span>
            <a href="https://www.youtube.com/channel/UCHPsdHfepFygMiWvlLclhcA" style="color: #d32f2f; text-decoration: none; font-weight: 600; font-size: 11px;">YouTube</a>
          </div>

          <p style="margin: 15px 0 0; font-size: 10px; color: #9ca3af; padding-top: 15px; border-top: 1px solid #e5e7eb;">
            © 2026 Indian Nepali Swad - All Rights Reserved<br>
            You're receiving this email because you created an account and subscribed to our newsletter or made an action with our bot via WhatsApp.<br>
            <a href="#" style="color: #d32f2f; text-decoration: none;">Manage preferences</a> • <a href="#" style="color: #d32f2f; text-decoration: none;">Unsubscribe</a>
          </p>
        </div>
      </div>

    </div>

  </div>
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