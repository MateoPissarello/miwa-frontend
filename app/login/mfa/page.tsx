import MfaCodeForm from "@/components/MfaCodeForm";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ session?: string; email?: string; next?: string }>;
}) {
  const sp = await searchParams; // evita el warning de Next
  const session = sp.session ?? "";
  const email = sp.email ?? "";
  const next = sp.next ?? "/portal";
  return (
    <MfaCodeForm session={session} email={email} onSuccessRedirect={next} />
  );
}
