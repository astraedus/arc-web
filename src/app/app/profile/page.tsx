import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ExportButton from "@/components/ExportButton";
import UserIdToggle from "@/components/UserIdToggle";

export const dynamic = "force-dynamic";

async function signOutAction() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Count the user's notes for a bit of state visibility.
  const { count } = await supabase
    .from("journal_entries")
    .select("id", { count: "exact", head: true });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-warm-gray">
          Your account and vault controls.
        </p>
      </div>

      <section className="rounded-2xl border border-card-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-warm-gray">
          Account
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-warm-gray">Email</dt>
            <dd className="text-foreground">{user?.email ?? "Unknown"}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-warm-gray">Total notes</dt>
            <dd className="text-foreground">{count ?? 0}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-warm-gray">User ID</dt>
            <dd>
              <UserIdToggle userId={user?.id ?? null} />
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-card-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-warm-gray">
          Export
        </h2>
        <p className="mt-2 text-sm text-warm-gray">
          Download every note, mind map node, and insight in your vault as a
          single zip. Your data, always yours.
        </p>
        <div className="mt-5">
          <ExportButton />
        </div>
      </section>

      <section className="rounded-2xl border border-card-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-warm-gray">
          Session
        </h2>
        <p className="mt-2 text-sm text-warm-gray">
          Sign out of this browser. Your phone session will stay signed in.
        </p>
        <form action={signOutAction} className="mt-5">
          <button
            type="submit"
            className="rounded-lg border border-card-border px-4 py-2 text-sm text-warm-gray transition-colors hover:border-amber/40 hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </section>
    </div>
  );
}
