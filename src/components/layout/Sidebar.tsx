"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  BookOpen,
  Swords,
  Users,
  Trophy,
  LogOut,
  Sparkles,
} from "lucide-react";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",    icon: LayoutDashboard, label: "Dashboard"    },
  { href: "/pokedex",      icon: BookOpen,         label: "Pokédex"      },
  { href: "/collection",   icon: Sparkles,         label: "Collection"   },
  { href: "/team",         icon: Users,  label: "Team Builder" },
  { href: "/competitive",  icon: Swords, label: "Competitive"  },
  { href: "/achievements", icon: Trophy, label: "Achievements" },
];

interface SidebarProps {
  user: User;
  onSignOut: () => void;
}

export function Sidebar({ user, onSignOut }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-white/6 bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/6 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-dex-accent/15 ring-1 ring-dex-accent/30">
          <svg width="16" height="16" viewBox="0 0 40 40" fill="none" className="text-dex-accent">
            <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="3" />
            <path d="M2 20h36M14 20a6 6 0 0 1 12 0 6 6 0 0 1-12 0Z" stroke="currentColor" strokeWidth="3" />
            <circle cx="20" cy="20" r="3" fill="currentColor" />
          </svg>
        </div>
        <span className="font-pixel text-[9px] tracking-wider text-foreground">DEX.GG</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 scrollbar-dex">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, icon: Icon, label, disabled }) => {
            const isActive =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(`${href}/`));

            return (
              <li key={href}>
                <Link
                  href={disabled ? "#" : href}
                  aria-disabled={disabled}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
                    isActive
                      ? "bg-dex-accent/15 text-dex-accent font-medium ring-1 ring-dex-accent/20"
                      : disabled
                      ? "cursor-not-allowed opacity-35"
                      : "text-muted-foreground hover:bg-dex-elevated hover:text-foreground"
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  <span>{label}</span>
                  {disabled && (
                    <span className="ml-auto font-pixel text-[6px] text-muted-foreground/40">
                      SOON
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-white/6 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="relative h-7 w-7 shrink-0">
            {user.user_metadata?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.user_metadata.avatar_url as string}
                alt={(user.user_metadata?.full_name as string) ?? "User"}
                className="h-7 w-7 rounded-full object-cover ring-1 ring-white/10"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-dex-elevated text-xs font-medium ring-1 ring-white/10">
                {(user.email?.[0] ?? "?").toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">
              {(user.user_metadata?.full_name as string) ?? user.email ?? "Trainer"}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
          </div>

          <button
            onClick={onSignOut}
            className="shrink-0 rounded p-1 text-muted-foreground/60 transition-colors hover:text-foreground"
            title="Sign out"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
