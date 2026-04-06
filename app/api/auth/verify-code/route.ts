import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import VerificationCode from "@/models/VerificationCode";
import Subscriber from "@/models/Subscriber";

export async function POST(request: NextRequest) {
  try {
    const { email, code, type } = await request.json();

    if (!email || !code || !type) {
      return NextResponse.json(
        { error: "Email, code et type requis." },
        { status: 400 }
      );
    }

    await dbConnect();

    const normalizedEmail = email.toLowerCase();

    if (type !== "signin") {
      return NextResponse.json(
        {
          error:
            "La vérification par code n'est plus nécessaire pour cette action.",
        },
        { status: 400 }
      );
    }
    const record = await VerificationCode.findOne({
      email: normalizedEmail,
      type: "signin",
      code,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      await VerificationCode.updateOne(
        { email: normalizedEmail, type: "signin", used: false },
        { $inc: { attempts: 1 } }
      );

      return NextResponse.json(
        { error: "Code invalide ou expiré." },
        { status: 400 }
      );
    }
    record.used = true;
    await record.save();

    let user = await Subscriber.findOne({ email: normalizedEmail });

    if (!user) {
      user = await Subscriber.create({
        email: normalizedEmail,
        name: record.name || "Utilisateur",
        newsletterSubscribed: false,
        isActive: true,
        loginCount: 1,
        lastLoginAt: new Date(),
      });
    } else {
      // Normal login
      user.loginCount += 1;
      user.lastLoginAt = new Date();
      await user.save();
    }

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        subscribedAt: user.subscribedAt,
        newsletterSubscribed: user.newsletterSubscribed,
        lastLoginAt: user.lastLoginAt,
        loginCount: user.loginCount,
      },
    });
  } catch (error) {
    console.error("Erreur API verify-code:", error);
    return NextResponse.json(
      {
        error:
          "Erreur technique lors de la vérification. Veuillez réessayer plus tard.",
      },
      { status: 500 }
    );
  }
}
