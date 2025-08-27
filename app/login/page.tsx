import { LoginForm } from "@/components/LoginForm";

export default function Page() {
  return (
    <LoginForm title="MIWA" onSuccessRedirect="/portal" />
  );
}
