"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Bell,
  ChevronDown,
  Menu,
  PanelLeft,
  Search,
  Settings,
} from "lucide-react";
import { memo } from "react";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  notifications: number;
  activeTab?: string;
}

export const Header = memo(
  ({
    sidebarOpen,
    setSidebarOpen,
    setMobileMenuOpen,
    notifications,
    activeTab = "home",
  }: HeaderProps) => {
    return (
      <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open mobile menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex transition-transform duration-200 hover:scale-110 active:scale-95"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <PanelLeft
            className={cn(
              "h-5 w-5 transition-transform duration-300 ease-out",
              !sidebarOpen && "rotate-180"
            )}
          />
        </Button>

        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-md text-[#414651] font-medium capitalize">
            {activeTab}
          </h1>
          <div className="flex items-center gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-2xl">
                    <Search className="h-5 w-5 text-[#8E8E93]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Search</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-2xl">
                    <Settings className="h-5 w-5 text-[#8E8E93]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-2xl relative"
                  >
                    <Bell className="h-5 w-5 text-[#8E8E93]" />
                    {notifications > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                        {notifications}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="flex items-center gap-2 px-3 py-2 rounded-lg border-[#E5E7EB] bg-white hover:bg-gray-50"
              >
                <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                </div>
                <span className="text-[#414651] font-medium">Monad</span>
                <ChevronDown className="h-4 w-4 text-[#8E8E93]" />
              </Button>

              <Avatar className="h-9 w-9 border-2 border-[#E5E7EB]">
                <AvatarImage src="/placeholder-user.jpg" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>
    );
  }
);

Header.displayName = "Header";
