import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Subscriber from "@/models/Subscriber";

export async function POST(request: NextRequest) {
  try {
    const { email, itemId } = await request.json();

    if (!email || !itemId) {
      return NextResponse.json({ error: "Données requises manquantes." }, { status: 400 });
    }

    await dbConnect();
    const user = await Subscriber.findByEmail(email);

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé." }, { status: 404 });
    }

    let favorites = user.favorites || [];
    if (favorites.includes(itemId)) {
      favorites = favorites.filter(id => id !== itemId);
    } else {
      favorites.push(itemId);
    }

    user.favorites = favorites;
    await user.save();

    return NextResponse.json({ success: true, favorites });
  } catch (error) {
    console.error("Favorite route error", error);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
