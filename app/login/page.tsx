// app/login/page.tsx
import { LoginForm } from "@/components/LoginForm";

type LoginPageProps = {
  searchParams: Promise<{ email?: string; verified?: string } | undefined>;
};

export default async function Page({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const defaultEmail = params?.email ?? "";
  const justVerified = params?.verified === "1";

  return (
    <LoginForm
      title="MIWA"
      onSuccessRedirect="/portal"
      defaultEmail={defaultEmail}
      justVerified={justVerified}
    />
  );
}
