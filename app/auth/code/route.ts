import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import VerificationCode from "@/models/VerificationCode";
import Subscriber from "@/models/Subscriber";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const email = req.nextUrl.searchParams.get("email")?.toLowerCase();
    const code = req.nextUrl.searchParams.get("code");

    if (!email || !code) {
      return NextResponse.redirect("https://indian-nepaliswad.fr/auth/error?reason=missing");
    }

    // Validate OTP
    const record = await VerificationCode.findOne({
      email,
      code,
      type: "signin",
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return NextResponse.redirect("https://indian-nepaliswad.fr/auth/error?reason=invalid");
    }

    // Find user
    const user = await Subscriber.findOne({ email });

    if (!user) {
      return NextResponse.redirect("https://indian-nepaliswad.fr/auth/error?reason=notfound");
    }

    // Mark OTP as used
    record.used = true;
    await record.save();

    // Update login stats
    user.lastLoginAt = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // Create session cookie
    const sessionPayload = {
      email: user.email,
      name: user.name,
      subscribedAt: user.subscribedAt,
      newsletterSubscribed: user.newsletterSubscribed,
      lastLoginAt: user.lastLoginAt,
      loginCount: user.loginCount,
    };

    const response = NextResponse.redirect("https://indian-nepaliswad.fr");

    response.cookies.set("ins_user", JSON.stringify(sessionPayload), {
      httpOnly: false, // must be readable by AuthProvider
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;

  } catch (error) {
    console.error("Magic link error:", error);
    return NextResponse.redirect("https://indian-nepaliswad.fr/auth/error?reason=server");
  }
}
