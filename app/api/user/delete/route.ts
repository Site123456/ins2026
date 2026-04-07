import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Subscriber from "@/models/Subscriber";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Jeton invalide." }, { status: 400 });
    }

    const email = Buffer.from(token, 'base64').toString('ascii');

    await dbConnect();
    const user = await Subscriber.findByEmail(email);

    if (!user) {
      return NextResponse.json({ error: "Compte non trouvé ou déjà supprimé." }, { status: 404 });
    }
    
    await Subscriber.deleteOne({ _id: user._id });

    // Return HTML success page
    const htmlResponse = `
    <html>
      <head>
        <title>Compte Supprimé</title>
        <style>
          body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0a0a0f; color: white; margin: 0; }
          .container { text-align: center; padding: 40px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
          h1 { color: #f43f5e; }
          a { color: #10b981; text-decoration: none; margin-top: 20px; display: inline-block; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Votre compte a été supprimé.</h1>
          <p>Toutes vos données (réservations, favoris, profil) ont été effacées.</p>
          <a href="/">Retour à l'accueil</a>
        </div>
      </body>
    </html>
    `;

    return new NextResponse(htmlResponse, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error("Delete process error", error);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
