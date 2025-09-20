'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { SidebarItem } from '@/types';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ChevronDown, Search, Settings, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface SidebarProps {
  sidebarItems: SidebarItem[];
  expandedItems: Record<string, boolean>;
  toggleExpanded: (title: string) => void;
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar = ({
  sidebarItems,
  expandedItems,
  toggleExpanded,
  sidebarOpen,
  mobileMenuOpen,
  setMobileMenuOpen,
}: SidebarProps) => {
  return (
    <>
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Mobile */}
      <nav
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-background/95 backdrop-blur-md transition-all duration-500 ease-out md:hidden',
          mobileMenuOpen
            ? 'translate-x-0 shadow-2xl'
            : '-translate-x-full shadow-none'
        )}
        aria-label="Mobile navigation"
      >
        <SidebarContent
          sidebarItems={sidebarItems}
          expandedItems={expandedItems}
          toggleExpanded={toggleExpanded}
          onClose={() => setMobileMenuOpen(false)}
        />
      </nav>

      {/* Sidebar - Desktop */}
      <nav
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden w-64 transform border-r border-border/50 bg-background/95 backdrop-blur-md transition-all duration-500 ease-out md:block',
          sidebarOpen
            ? 'translate-x-0 shadow-lg'
            : '-translate-x-full shadow-none'
        )}
      >
        <SidebarContent
          sidebarItems={sidebarItems}
          expandedItems={expandedItems}
          toggleExpanded={toggleExpanded}
        />
      </nav>
    </>
  );
};

interface SidebarContentProps {
  sidebarItems: SidebarItem[];
  expandedItems: Record<string, boolean>;
  toggleExpanded: (title: string) => void;
  onClose?: () => void;
}

const SidebarContent = ({
  sidebarItems,
  expandedItems,
  toggleExpanded,
  onClose,
}: SidebarContentProps) => {
  return (
    <div className="flex h-full flex-col border-r border-border/50 bg-[#0C0E12]">
      <div className="flex items-center justify-between p-4">
        <div>
          <Image src="/svg/logo.svg" alt="logo" width={189} height={32} />
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[#8E8E93]" />
          <Input
            type="search"
            placeholder="Search"
            className="w-full rounded-2xl bg-[#1C1C1E] border-[#4A4A4C] pl-9 pr-20 py-2 text-[#8E8E93] placeholder:text-[#8E8E93] focus:border-[#4A4A4C] focus:ring-0"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="rounded-lg bg-[#3A3A3C] px-2 py-1 text-xs text-[#8E8E93] font-medium">
              ⌘K
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-1">
          {sidebarItems.map((item) => (
            <Link href={`${item?.items?.[0]?.url || '/'}`} key={item.title}>
              <div key={item.title} className="mb-1">
                <button
                  className={cn(
                    'flex w-full items-center justify-between px-4 py-3 text-sm font-medium transition-colors',
                    item.isActive
                      ? 'text-white'
                      : 'text-[#8E8E93] hover:text-white'
                  )}
                  onClick={() => item.items && toggleExpanded(item.title)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      item.items && toggleExpanded(item.title);
                    }
                  }}
                  aria-expanded={
                    item.items ? expandedItems[item.title] : undefined
                  }
                  aria-current={item.isActive ? 'page' : undefined}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'transition-colors',
                        item.isActive ? 'text-white' : 'text-[#8E8E93]'
                      )}
                    >
                      {item.icon}
                    </div>
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <Badge
                      variant="outline"
                      className="ml-auto rounded-full px-2 py-0.5 text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                  {item.items && (
                    <ChevronDown
                      className={cn(
                        'ml-2 h-4 w-4 transition-transform duration-300 ease-out',
                        item.isActive ? 'text-white' : 'text-[#8E8E93]',
                        expandedItems[item.title] ? 'rotate-180' : ''
                      )}
                    />
                  )}
                </button>

                {item.items && expandedItems[item.title] && (
                  <div className="mt-1 ml-6 space-y-1 border-l border-[#4A4A4C] pl-3 animate-in slide-in-from-top-2 duration-300">
                    {item.items.map((subItem) => (
                      <a
                        key={subItem.title}
                        href={subItem.url}
                        className="flex items-center justify-between px-3 py-2 text-sm text-[#8E8E93] hover:text-white transition-colors"
                      >
                        {subItem.title}
                        {subItem.badge && (
                          <Badge
                            variant="outline"
                            className="ml-auto rounded-full px-2 py-0.5 text-xs"
                          >
                            {subItem.badge}
                          </Badge>
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-[#4A4A4C] p-4">
        <button className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-[#8E8E93] hover:text-white transition-colors">
          {/* <Settings className="h-5 w-5" />
          <span>Settings</span> */}
          {/* <ConnectButton chainStatus={'icon'} /> */}
          {/* <ConnectWalletBTN /> */}
        </button>
      </div>
    </div>
  );
};
