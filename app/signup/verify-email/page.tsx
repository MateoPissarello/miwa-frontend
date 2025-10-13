// app/signup/verify-email/page.tsx
import VerifyEmailForm from "@/components/VerifyEmailForm";

type SP = {
  email?: string | string[];
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const email = Array.isArray(sp.email) ? sp.email[0] ?? "" : sp.email ?? "";
  return <VerifyEmailForm email={email} onSuccessRedirect="/login" />;
}
