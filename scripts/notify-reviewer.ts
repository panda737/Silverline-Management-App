/**
 * Tell a reviewer that documents are waiting — ONE email for the whole batch.
 *
 * Why one email matters here: the reviewer this was built for loses attachments
 * in his inbox ("I am checking my emails and cant find the AEL application you
 * said I must review", 27 July 2026). Sixteen separate notifications would
 * recreate exactly that problem. One email, one link, one list.
 *
 * The link is a Supabase magic link that signs him in and lands him on the
 * review queue, so there is no password step between the email and the work.
 *
 *   npx tsx scripts/notify-reviewer.ts <batch-id>
 *   npx tsx scripts/notify-reviewer.ts <batch-id> --send   (needs RESEND_API_KEY)
 *
 * Without --send it prints the subject and body ready to paste into Outlook,
 * which is deliberate: it works today with no email provider configured, and
 * keeps a human in the loop on anything that leaves the building.
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local, and
 * SITE_URL (defaults to the production domain).
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}
const db = createClient(url, serviceKey);

const SITE_URL =
  process.env.SITE_URL ?? "https://www.silverline-management.co.za";

async function main() {
  const batchId = process.argv[2];
  const send = process.argv.includes("--send");

  if (!batchId) {
    console.error("Usage: npx tsx scripts/notify-reviewer.ts <batch-id> [--send]");
    process.exit(1);
  }

  const { data: batch } = await db
    .from("review_batches")
    .select("id, note, notified_at, reviewer:profiles!review_batches_reviewer_id_fkey ( id, full_name, email )")
    .eq("id", batchId)
    .maybeSingle();

  if (!batch) {
    console.error(`No review batch with id ${batchId}.`);
    process.exit(1);
  }

  const reviewer = batch.reviewer as unknown as {
    id: string;
    full_name: string;
    email: string;
  };

  const { data: reviews } = await db
    .from("document_reviews")
    .select("id, document:documents ( name, project:projects ( name ) )")
    .eq("batch_id", batchId);

  const items = (reviews ?? []).map(
    (r) =>
      r.document as unknown as { name: string; project: { name: string } | null }
  );

  if (items.length === 0) {
    console.error("That batch has no documents.");
    process.exit(1);
  }

  // Magic link straight to the queue. The redirect target must be listed in
  // Supabase → Authentication → URL Configuration → Redirect URLs, or GoTrue
  // will silently fall back to the Site URL.
  const redirectTo = `${SITE_URL}/auth/confirm?next=${encodeURIComponent("/reviews")}`;
  const { data: link, error: linkError } = await db.auth.admin.generateLink({
    type: "magiclink",
    email: reviewer.email,
    options: { redirectTo },
  });

  if (linkError || !link) {
    console.error(`Could not generate the sign-in link: ${linkError?.message}`);
    process.exit(1);
  }

  const actionLink = link.properties.action_link;
  const firstName = (reviewer.full_name || "").split(" ")[0] || "there";
  const count = items.length;

  const subject = `${count} document${count === 1 ? "" : "s"} for your review — Silverline portal`;

  const list = items
    .map((d, i) => `  ${i + 1}. ${d.name}${d.project ? ` (${d.project.name})` : ""}`)
    .join("\n");

  const body = [
    `Dear ${firstName}`,
    "",
    `${count} document${count === 1 ? " is" : "s are"} ready for your review:`,
    "",
    list,
    "",
    batch.note ? `${batch.note}\n` : "",
    "Open them here — the link signs you in, there is no password:",
    "",
    actionLink,
    "",
    "You can read each document in the browser and leave a comment on any section, or download it, comment in Word as usual, and upload your copy back. When you are done, press Approve or Request changes.",
    "",
    "Kind regards",
    "Silverline",
  ]
    .filter((l) => l !== undefined)
    .join("\n");

  if (!send) {
    console.log("─".repeat(70));
    console.log(`To:      ${reviewer.full_name} <${reviewer.email}>`);
    console.log(`Subject: ${subject}`);
    console.log("─".repeat(70));
    console.log(body);
    console.log("─".repeat(70));
    console.log("\nNot sent. Paste the above into Outlook, or re-run with --send");
    console.log("once RESEND_API_KEY is set in .env.local.");
    console.log("\nNote: the sign-in link is single-use and expires in 1 hour.");
    return;
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("--send needs RESEND_API_KEY in .env.local.");
    process.exit(1);
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.REVIEW_FROM_EMAIL ?? "Silverline <admin@slco.co.za>",
      to: [reviewer.email],
      subject,
      text: body,
    }),
  });

  if (!res.ok) {
    console.error(`Send failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }

  await db
    .from("review_batches")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", batchId);

  console.log(`Sent to ${reviewer.email}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
