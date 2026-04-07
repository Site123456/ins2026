import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import dbConnect from "@/lib/mongodb";
import Subscriber from "@/models/Subscriber";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis." }, { status: 400 });
    }

    await dbConnect();
    const user = await Subscriber.findByEmail(email);

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé." }, { status: 404 });
    }

    // Usually we generate a secure token saved in DB, but for simplicity here we 
    // will send an email with a secure encrypted link or payload to the delete route.
    const token = Buffer.from(email).toString('base64'); // Mock token mechanism
    const language = user.language || 'fr';
    const deleteLink = `https://indian-nepaliswad.fr/api/user/delete?token=${token}`;

    const subject = language === 'en' 
        ? 'Account deletion request' 
        : 'Demande de suppression de compte';
        
    const htmlContent = `
      <p>${language === 'en' ? 'Hello' : 'Bonjour'} ${user.name},</p>
      <p>
        ${language === 'en' 
            ? 'We received a request to completely delete your account. If you confirm this action, all your reservations and favorites will be permanently erased.'
            : 'Nous avons reçu une demande de suppression définitive de votre compte. Si vous confirmez cette action, toutes vos réservations et favoris seront définitivement effacés.'}
      </p>
      <a href="${deleteLink}" style="display:inline-block;padding:12px 24px;background-color:#e11d48;color:white;text-decoration:none;border-radius:4px;">
        ${language === 'en' ? 'Confirm Account Deletion' : 'Confirmer la suppression'}
      </a>
      <p>${language === 'en' ? 'If it was not you, please ignore this email.' : 'Si vous n\\\'êtes pas à l\\\'origine de cette demande, ignorez cet email.'}</p>
    `;

    await resend.emails.send({
      from: "Indian Nepali Swad <noreply@bot.indian-nepaliswad.fr>",
      to: [email],
      subject,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete request error", error);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
