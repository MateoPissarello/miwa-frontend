import SetupTotpForm from "@/components/SetupTotpForm";

type SP = {
  session?: string | string[];
  email?: string | string[];
};

export default async function Page({
  searchParams,
}: {
  // En Next 15: searchParams es Promise
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams; // await al objeto
  const session = Array.isArray(sp.session)
    ? sp.session[0] ?? ""
    : sp.session ?? "";
  const email = Array.isArray(sp.email) ? sp.email[0] ?? "" : sp.email ?? "";

  return (
    <SetupTotpForm
      session={session}
      email={email}
      onSuccessRedirect="/portal"
    />
  );
}
