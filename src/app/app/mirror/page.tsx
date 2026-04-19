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
    <div className="mx-auto max-w-4xl">
      <header className="pt-4 pb-16 text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-warm-gray-light">
          The Mirror
        </p>
        <p
          className="mt-4 text-2xl italic text-foreground"
          style={{
            fontFamily:
              "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
          }}
        >
          Your journal, reflected back to you.
        </p>
      </header>

      <section className="mb-24">
        <MirrorClient initialReflections={list} />
      </section>

      <section className="border-t border-card-border pt-16">
        <MirrorInsights />
      </section>

      <div className="mt-24 mb-8 text-center">
        <span className="text-warm-gray-light/40 text-xs tracking-[0.3em]">
          • • •
        </span>
      </div>
    </div>
  );
}
