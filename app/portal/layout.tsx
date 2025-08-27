import RequireAuth from "@/components/RequireAuth";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}
