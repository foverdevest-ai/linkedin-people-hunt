import { HuntDetailClient } from "./HuntDetailClient";

export const dynamic = "force-dynamic";

export default async function HuntDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HuntDetailClient runId={id} />;
}
