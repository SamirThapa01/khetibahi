// ─────────────────────────────────────────────
//  KhetiBahi – /crops/[crop] (Server Component)
//
//  Next.js hands dynamic route params here as a
//  Promise. This tiny server wrapper awaits it and
//  passes a plain string down to the client
//  component that does the actual rendering — the
//  same split used by the API routes in this app.
// ─────────────────────────────────────────────

import CropDetailClient from "./CropDetailClient";

export default async function CropDetailPage({
  params,
}: {
  params: Promise<{ crop: string }>;
}) {
  const { crop } = await params;
  return <CropDetailClient cropParam={decodeURIComponent(crop)} />;
}
