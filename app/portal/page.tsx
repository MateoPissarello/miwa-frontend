"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, User, Video } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function PortalPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Sidebar Toggle */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-gray-100"
                >
                  <Menu className="h-5 w-5 text-gray-600" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">menu</SheetTitle>
                <div className="flex h-full flex-col bg-white">
                  {/* Sidebar Header */}
                  <div className="border-b border-gray-200 p-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      MIWA
                    </h2>
                  </div>

                  {/* Sidebar Menu */}
                  <nav className="flex-1 p-4">
                    <div className="space-y-2">
                      <Link href="/portal/recordings">
                        <Button
                          variant="ghost"
                          className="w-full justify-start hover:bg-teal-50 hover:text-teal-700"
                        >
                          <Video className="mr-3 h-4 w-4" />
                          Meeting Recordings
                        </Button>
                      </Link>
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            {/* MIWA Logo/Name */}
            <h1 className="text-xl font-bold text-gray-900">MIWA</h1>
          </div>

          {/* User Avatar */}
          <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-teal-500 hover:ring-offset-2 transition-all">
            <AvatarFallback className="bg-teal-100 text-teal-700">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to MIWA
            </h2>
            <p className="text-gray-600">
              Your Manager and Intelligent Work Assistant
            </p>
          </div>

          {/* Content placeholder */}
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="max-w-md mx-auto">
              <Video className="h-12 w-12 text-teal-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Get Started
              </h3>
              <p className="text-gray-600 mb-4">
                Use the sidebar to navigate through your workspace features.
              </p>
              <Button
                onClick={() => setSidebarOpen(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                Open Menu
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
