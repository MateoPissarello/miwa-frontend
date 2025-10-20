"use client";

import RequireAuth from "@/components/RequireAuth";
import { PortalChrome } from "@/components/portal/PortalChrome";
import { Calendar, FileText, Video } from "lucide-react";

const nav = [
  { href: "/portal/recordings", label: "Meeting Recordings", icon: <Video className="mr-3 h-4 w-4" /> },
  { href: "/portal/summaries",  label: "Resúmenes de reuniones", icon: <FileText className="mr-3 h-4 w-4" /> },
  { href: "/portal/calendar",   label: "Calendar",           icon: <Calendar className="mr-3 h-4 w-4" /> },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <PortalChrome nav={nav} title="MIWA">
        {children}
      </PortalChrome>
    </RequireAuth>
  );
}
