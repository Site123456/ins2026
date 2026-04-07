import { NextRequest, NextResponse } from "next/server";
import { encrypt, decrypt } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  try {
    const { action, payload, token } = await request.json();

    if (action === "encrypt") {
      if (!payload) return NextResponse.json({ error: "No payload provided." }, { status: 400 });
      const encryptedToken = encrypt(JSON.stringify(payload));
      return NextResponse.json({ success: true, token: encryptedToken });
    }

    if (action === "decrypt") {
      if (!token) return NextResponse.json({ error: "No token provided." }, { status: 400 });
      const decryptedString = decrypt(token);
      if (!decryptedString) return NextResponse.json({ error: "Invalid token." }, { status: 401 });
      
      const parsedPayload = JSON.parse(decryptedString);
      return NextResponse.json({ success: true, payload: parsedPayload });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });

  } catch (error) {
    console.error("Session route error", error);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
