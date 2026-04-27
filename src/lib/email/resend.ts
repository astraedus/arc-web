import { Resend } from "resend";

let _client: Resend | null = null;

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  if (!_client) _client = new Resend(key);
  return _client;
}

// astraedus.dev is the verified sending domain (same as arc-landing waitlist).
// arc.diary is the customer-facing brand domain but isn't yet verified in Resend.
const FROM = process.env.LTD_EMAIL_FROM ?? "Arc Mirror <hello@astraedus.dev>";

export async function sendLtdClaimEmail(params: {
  to: string;
  claimUrl: string;
}): Promise<void> {
  const { to, claimUrl } = params;
  const resend = getResend();

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Set your password to open Arc Mirror",
    text: buildText(claimUrl),
    html: buildHtml(claimUrl),
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}

function buildText(claimUrl: string): string {
  return [
    "Your Arc Mirror lifetime access is in.",
    "",
    "Click the link below to set a password and open your Mirror.",
    "The link expires in 60 minutes.",
    "",
    claimUrl,
    "",
    "If you didn't buy Arc Mirror, you can ignore this email.",
    "",
    "Arc",
  ].join("\n");
}

function buildHtml(claimUrl: string): string {
  // Inline styles only -- many email clients strip <style>.
  return `
<!doctype html>
<html><body style="font-family: ui-serif, Georgia, serif; background: #faf7f2; color: #2a2622; padding: 32px;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 520px; margin: 0 auto;">
    <tr><td style="padding-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; letter-spacing: 0.18em; text-transform: uppercase; color: #8a7d6f;">ARC MIRROR</p>
    </td></tr>
    <tr><td style="padding-bottom: 16px;">
      <h1 style="margin: 0; font-size: 24px; line-height: 1.3; color: #2a2622;">Your lifetime access is ready.</h1>
    </td></tr>
    <tr><td style="padding-bottom: 24px;">
      <p style="margin: 0; font-size: 16px; line-height: 1.5; color: #4a3f33;">Click the button below to set a password and open your Mirror. The link expires in 60 minutes.</p>
    </td></tr>
    <tr><td style="padding-bottom: 32px;">
      <a href="${claimUrl}" style="display: inline-block; background: #c89545; color: #2a2622; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">Set password and open Arc</a>
    </td></tr>
    <tr><td style="padding-bottom: 16px;">
      <p style="margin: 0; font-size: 13px; color: #8a7d6f;">Or paste this URL into your browser:</p>
      <p style="margin: 8px 0 0; font-size: 12px; color: #6a5d4f; word-break: break-all;">${claimUrl}</p>
    </td></tr>
    <tr><td style="padding-top: 24px; border-top: 1px solid #e6dfd2;">
      <p style="margin: 0; font-size: 12px; color: #8a7d6f;">If you didn't buy Arc Mirror, you can ignore this email.</p>
    </td></tr>
  </table>
</body></html>
  `.trim();
}
