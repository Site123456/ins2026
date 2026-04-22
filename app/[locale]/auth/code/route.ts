import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import VerificationCode from "@/models/VerificationCode";
import Subscriber from "@/models/Subscriber";
import { blindIndex } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const email = req.nextUrl.searchParams.get("email")?.toLowerCase();
    const code = req.nextUrl.searchParams.get("code");

    if (!email || !code) {
      return NextResponse.redirect(new URL("/auth/error?reason=missing", req.url));
    }

    // 1. Find the verification record using Blind Index
    const blind = blindIndex(email);
    const record = await VerificationCode.findOne({
      blindEmail: blind,
      code,
      type: "signin",
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      // Increment attempts if record exists but code is wrong
      const wrongCodeRecord = await VerificationCode.findOne({ blindEmail: blind, type: "signin", used: false });
      if (wrongCodeRecord) {
        wrongCodeRecord.attempts = (wrongCodeRecord.attempts || 0) + 1;
        if (wrongCodeRecord.attempts >= 5) {
          wrongCodeRecord.used = true; // Burn the code after 5 failures
        }
        await wrongCodeRecord.save();
      }
      return NextResponse.redirect(new URL("/auth/error?reason=invalid", req.url));
    }

    // 2. Find the user using Blind Indexing
    const user = await Subscriber.findByEmail(email);

    if (!user) {
      return NextResponse.redirect(new URL("/auth/error?reason=notfound", req.url));
    }

    // 3. Security: Check if account is active
    if (!user.isActive) {
      return NextResponse.redirect(new URL("/auth/error?reason=banned", req.url));
    }

    // 4. Consume the code
    record.used = true;
    await record.save();

    // 5. Update user stats
    user.lastLoginAt = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // 6. Create session payload
    const sessionPayload = {
      email: user.email,
      name: user.name,
      subscribedAt: user.subscribedAt,
      newsletterSubscribed: user.newsletterSubscribed,
      lastLoginAt: user.lastLoginAt,
      loginCount: user.loginCount,
    };

    // 7. Success redirect with session cookie
    const response = NextResponse.redirect(new URL("/", req.url));

    response.cookies.set("ins_user", JSON.stringify(sessionPayload), {
      httpOnly: false, // Essential for client-side AuthProvider
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days persistence
    });

    return response;

  } catch (error) {
    console.error("Magic link processing error:", error);
    return NextResponse.redirect(new URL("/auth/error?reason=server", req.url));
  }
}
