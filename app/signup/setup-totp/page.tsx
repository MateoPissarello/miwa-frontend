import SetupTotpForm from "@/components/SetupTotpForm";


export default async function Page({
  searchParams,
}: {
  searchParams: { session?: string; email?: string };
}) {
  const session = (await searchParams?.session) ?? "";
  const email = (await searchParams?.email) ?? "";
  return (
    <SetupTotpForm
      session={session}
      email={email}
      onSuccessRedirect="/portal"
    />
  );
}
