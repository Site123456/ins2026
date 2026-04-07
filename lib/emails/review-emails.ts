/**
 * Bilingual email templates for the review system.
 * Uses the existing INS brand style (red gradient header, clean layout).
 */

export function reviewConfirmationEmail(
  name: string,
  dishName: string,
  rating: number,
  lang: 'fr' | 'en' = 'fr'
): string {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  const isFr = lang === 'fr';

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:20px 0;font-family:system-ui,-apple-system,sans-serif">
      <tr><td align="center">
        <table width="600" style="background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          <tr>
            <td style="background:linear-gradient(135deg,#d32f2f,#b71c1c);padding:40px;text-align:center;color:#fff">
              <div style="display:inline-block; background-color:#ffffff; padding:12px; border-radius:24px; margin-bottom:24px;">
                <img src="https://indian-nepaliswad.fr/etc/logo.png" style="height:60px;" />
              </div>
              <h1 style="margin:0;font-size:24px;font-weight:800">${isFr ? 'Merci pour votre avis !' : 'Thank you for your review!'}</h1>
            </td>
          </tr>
          <tr><td style="padding:32px">
            <p style="font-size:16px;color:#1f2937;line-height:1.7;margin:0 0 20px">
              ${isFr ? 'Bonjour' : 'Hello'} <strong style="color:#d32f2f">${name}</strong>,
            </p>
            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px">
              ${isFr
      ? `Votre avis sur <strong>${dishName}</strong> a bien été publié.`
      : `Your review for <strong>${dishName}</strong> has been published.`}
            </p>
            <div style="text-align:center;padding:20px;background:#fef2f2;border-radius:12px;margin:0 0 20px">
              <span style="font-size:28px;letter-spacing:4px;color:#d32f2f">${stars}</span>
            </div>
            <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0">
              ${isFr
      ? 'Votre avis aide les autres clients à découvrir nos meilleurs plats. Merci de faire partie de la communauté INS !'
      : 'Your review helps other customers discover our best dishes. Thank you for being part of the INS community!'}
            </p>
          </td></tr>
          <tr><td style="padding:20px;text-align:center;font-size:11px;color:#9ca3af">
            © 2026 Indian Nepali Swad — ${isFr ? 'Tous droits réservés' : 'All rights reserved'}
          </td></tr>
        </table>
      </td></tr>
    </table>
  `;
}

export function reviewReplyNotificationEmail(
  name: string,
  replierName: string,
  dishName: string,
  replySnippet: string,
  lang: 'fr' | 'en' = 'fr'
): string {
  const isFr = lang === 'fr';
  const snippet = replySnippet.length > 120 ? replySnippet.slice(0, 120) + '…' : replySnippet;

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:20px 0;font-family:system-ui,-apple-system,sans-serif">
      <tr><td align="center">
        <table width="600" style="background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          <tr>
            <td style="background:linear-gradient(135deg,#d32f2f,#b71c1c);padding:40px;text-align:center;color:#fff">
              <div style="display:inline-block; background-color:#ffffff; padding:12px; border-radius:24px; margin-bottom:24px;">
                <img src="https://indian-nepaliswad.fr/etc/logo.png" style="height:60px;" />
              </div>
              <h1 style="margin:0;font-size:22px;font-weight:800">${isFr ? 'Nouvelle réponse à votre avis' : 'New reply to your review'}</h1>
            </td>
          </tr>
          <tr><td style="padding:32px">
            <p style="font-size:16px;color:#1f2937;line-height:1.7;margin:0 0 20px">
              ${isFr ? 'Bonjour' : 'Hello'} <strong style="color:#d32f2f">${name}</strong>,
            </p>
            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px">
              <strong>${replierName}</strong> ${isFr
      ? `a répondu à votre avis sur <strong>${dishName}</strong> :`
      : `replied to your review on <strong>${dishName}</strong>:`}
            </p>
            <div style="padding:16px 20px;background:#f3f4f6;border-left:4px solid #d32f2f;border-radius:0 12px 12px 0;margin:0 0 20px">
              <p style="font-size:14px;color:#374151;line-height:1.6;margin:0;font-style:italic">"${snippet}"</p>
            </div>
            <div style="text-align:center;margin:24px 0">
              <a href="https://indian-nepaliswad.fr/search" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#d32f2f,#b71c1c);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px">
                ${isFr ? 'Voir la conversation' : 'View the conversation'}
              </a>
            </div>
          </td></tr>
          <tr><td style="padding:20px;text-align:center;font-size:11px;color:#9ca3af">
            © 2026 Indian Nepali Swad — ${isFr ? 'Tous droits réservés' : 'All rights reserved'}
          </td></tr>
        </table>
      </td></tr>
    </table>
  `;
}
