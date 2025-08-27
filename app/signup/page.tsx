// app/signup/page.tsx
import SignupForm from "@/components/SignupForm";

export default function Page() {
  return <SignupForm title="Create your account" onSuccessRedirect="/login" />;
}
