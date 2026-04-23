import { notFound, redirect } from "next/navigation";

const LEGACY_APP_ROUTE_REDIRECTS: Record<string, string> = {
  river: "/app",
  compose: "/app/new",
  focus: "/app",
  insights: "/app/mirror",
};

export default async function LegacyAppRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const destination = LEGACY_APP_ROUTE_REDIRECTS[slug];

  if (!destination) {
    notFound();
  }

  redirect(destination);
}
