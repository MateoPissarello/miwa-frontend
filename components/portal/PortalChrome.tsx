"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, User } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode; // ya pasas el icono listo (así no cambiamos clases)
};

export function PortalChrome({
  children,
  title = "MIWA",
  nav = [],
}: {
  children: React.ReactNode;
  title?: string;
  nav: NavItem[];
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const LinkBtn = ({ href, label, icon, active }: NavItem & { active: boolean }) => (
    <Link href={href} onClick={() => setSidebarOpen(false)}>
      <Button
        variant="ghost"
        className={[
          "w-full justify-start",
          active ? "bg-teal-50 text-teal-700" : "hover:bg-teal-50 hover:text-teal-700",
        ].join(" ")}
      >
        {icon}
        {label}
      </Button>
    </Link>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar (idéntico a tu estilo) */}
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Toggle del sidebar (mobile) */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                  <Menu className="h-5 w-5 text-gray-600" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0" aria-label="Sidebar navigation">
                <SheetHeader className="sr-only">
                  <SheetTitle>Sidebar</SheetTitle>
                </SheetHeader>
                <div className="flex h-full flex-col bg-white">
                  {/* Header del sidebar */}
                  <div className="border-b border-gray-200 p-4">
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                  </div>
                  {/* Menú */}
                  <nav className="flex-1 p-4">
                    <div className="space-y-2">
                      {nav.map((n) => (
                        <LinkBtn
                          key={n.href}
                          href={n.href}
                          label={n.label}
                          icon={n.icon}
                          active={pathname === n.href}
                        />
                      ))}
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo / nombre */}
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          </div>

          {/* Avatar usuario */}
          <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-teal-500 hover:ring-offset-2 transition-all">
            <AvatarFallback className="bg-teal-100 text-teal-700">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Contenido principal (mantiene tus paddings) */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
