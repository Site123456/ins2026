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

    // Find verification code
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

    // Find subscriber
    const user = await Subscriber.findOne({ email });

    if (!user) {
      return NextResponse.redirect("https://indian-nepaliswad.fr/auth/error?reason=notfound");
    }

    // Mark code as used
    record.used = true;
    await record.save();

    // Update login stats
    user.lastLoginAt = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // Store session in cookie (simple version)
    const response = NextResponse.redirect("https://indian-nepaliswad.fr");
    response.cookies.set("ins_session", JSON.stringify({ email }), {
      httpOnly: true,
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
