import { LoginForm } from "@/components/LoginForm";

export default function Page() {
  return (
    <LoginForm
      mode="admin"
      title="SUPER MIWA LOGIN"
      onSuccessRedirect="/dashboard"
    />
  );
}
