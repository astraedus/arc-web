import { createClient } from "@/lib/supabase/server";
import MirrorClient from "@/components/MirrorClient";
import MirrorInsights from "@/components/MirrorInsights";
import type { Reflection } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MirrorPage() {
  const supabase = await createClient();
  const { data: reflections } = await supabase
    .from("reflections")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const list = (reflections ?? []) as Reflection[];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">The Mirror</h1>
        <p className="mt-1 text-sm text-warm-gray">
          Your journal, reflected back to you.
        </p>
      </div>

      <MirrorClient initialReflections={list} />

      <MirrorInsights />
    </div>
  );
}
