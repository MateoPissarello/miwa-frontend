"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Calendar, Menu, User, Video } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function PortalPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
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
