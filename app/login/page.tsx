// app/login/page.tsx
import { LoginForm } from "@/components/LoginForm";

export default async function Page({
  searchParams,
}: {
  searchParams: { email?: string; verified?: string };
}) {
  const defaultEmail = await searchParams?.email ?? "";
  const justVerified = await searchParams?.verified === "1";

  return (
    <LoginForm
      title="MIWA"
      onSuccessRedirect="/portal"
      defaultEmail={defaultEmail}
      justVerified={justVerified}
    />
  );
}
