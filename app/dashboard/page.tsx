// app/admin/page.tsx
import AdminDashboard from "@/components/AdminDashboard";
import RequireAuth from "@/components/RequireAuth";

export default function AdminPage() {
  return (
    <RequireAuth>
      <AdminDashboard />
    </RequireAuth>
  );
}
