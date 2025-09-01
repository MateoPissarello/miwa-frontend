// app/signup/verify-email/page.tsx
import VerifyEmailForm from "@/components/VerifyEmailForm";

export default function Page({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams?.email ?? "";
  return <VerifyEmailForm email={email} onSuccessRedirect="/login" />;
}
