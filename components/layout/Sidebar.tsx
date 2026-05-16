"use client";

import Icon from "@/components/ui/Icon";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useEffect, useRef, useState } from "react";

export interface NavItem {
  label: string;
  icon: string;
  href: string;
}

interface SidebarProps {
  items: NavItem[];
  bottomItems?: NavItem[];
  role: "student" | "hr" | "admin" | "superadmin";
}

const COLLAPSED_WIDTH = "w-[72px]";
const EXPANDED_WIDTH = "w-[260px]";

const roleLabels: Record<string, string> = {
  student: "Mahasiswa",
  hr: "HR Portal",
  admin: "Administrator",
  superadmin: "Superadmin",
};

interface RoleBranding {
  icon: string;
  logoBgClass: string;
  logoTextClass: string;
  activeBgClass: string;
  activeTextClass: string;
  hoverBgClass: string;
  hoverTextClass: string;
}

const roleBranding: Record<string, RoleBranding> = {
  student: {
    icon: "school",
    logoBgClass: "bg-primary-container",
    logoTextClass: "text-on-primary",
    activeBgClass: "bg-primary-container",
    activeTextClass: "text-on-primary-container",
    hoverBgClass: "hover:bg-primary-fixed",
    hoverTextClass: "hover:text-on-surface-variant",
  },
  hr: {
    icon: "work_history",
    logoBgClass: "bg-tertiary-container",
    logoTextClass: "text-on-tertiary",
    activeBgClass: "bg-tertiary-fixed",
    activeTextClass: "text-on-tertiary-container",
    hoverBgClass: "hover:bg-tertiary-fixed",
    hoverTextClass: "hover:text-on-surface-variant",
  },
  admin: {
    icon: "admin_panel_settings",
    logoBgClass: "bg-[#4f46e5]",
    logoTextClass: "text-white",
    activeBgClass: "bg-[#4f46e5]",
    activeTextClass: "text-white",
    hoverBgClass: "hover:bg-[#4f46e5]",
    hoverTextClass: "hover:text-white",
  },
  superadmin: {
    icon: "verified",
    logoBgClass: "bg-primary-fixed-dim",
    logoTextClass: "text-primary",
    activeBgClass: "bg-primary-fixed-dim",
    activeTextClass: "text-primary",
    hoverBgClass: "hover:bg-primary-fixed-dim",
    hoverTextClass: "hover:text-on-surface-variant",
  },
};

/* ─── Brand section ─── */
const Brand = memo(function Brand({
  expanded,
  role,
}: {
  expanded: boolean;
  role: string;
}) {
  const brand = roleBranding[role] || roleBranding.student;
  return (
    <div className="flex items-center h-14 mb-4 px-4">
      <div
        className={`w-10 h-10 rounded-xl ${brand.logoBgClass} flex items-center justify-center shrink-0 shadow-sm`}
      >
        <Icon
          name={brand.icon}
          filled
          className={`${brand.logoTextClass} text-xl`}
        />
      </div>
      <div
        className={`overflow-hidden transition-[max-width,opacity,margin-left] duration-300 ease-in-out ${
          expanded ? "max-w-50 opacity-100 ml-3" : "max-w-0 opacity-0 ml-0"
        }`}
      >
        <h2 className="font-headline text-lg font-bold text-primary tracking-tight whitespace-nowrap">
          CareerSync
        </h2>
        <p className="font-label text-xs text-on-surface-variant font-medium whitespace-nowrap">
          {roleLabels[role]}
        </p>
      </div>
    </div>
  );
});

/* ─── Nav link renderer ─── */
const NavLink = memo(function NavLink({
  item,
  expanded,
  showTooltip = false,
  role,
}: {
  item: NavItem;
  expanded: boolean;
  showTooltip?: boolean;
  role?: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const brand = roleBranding[role || "student"];

  const linkContent = (
    <Link
      href={item.href}
      className={`relative flex items-center rounded-xl font-label text-sm px-3 py-2.5 transition-colors duration-200 group
        ${
          isActive
            ? `${brand.activeBgClass} ${brand.activeTextClass} font-bold`
            : `text-on-surface-variant ${brand.hoverBgClass} ${brand.hoverTextClass}`
        }`}
    >
      <div className="flex items-center justify-center w-6 h-6 shrink-0 transition-transform duration-200 group-hover:scale-110">
        <Icon name={item.icon} filled={isActive} size={22} />
      </div>
      <span
        className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin-left] duration-300 ease-in-out ${
          expanded ? "max-w-50 opacity-100 ml-3" : "max-w-0 opacity-0 ml-0"
        }`}
      >
        {item.label}
      </span>
    </Link>
  );

  if (showTooltip && !expanded) {
    return (
      <Tooltip>
        <TooltipTrigger render={<div />}>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
});

/* ─── Sign Out link ─── */
const SignOutLink = memo(function SignOutLink({
  expanded,
  showTooltip = false,
}: {
  expanded: boolean;
  showTooltip?: boolean;
}) {
  const linkContent = (
    <Link
      href="/login"
      className="flex items-center rounded-xl font-label text-sm px-3 py-2.5 transition-colors duration-200 group
        text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
    >
      <div className="flex items-center justify-center w-6 h-6 shrink-0 transition-transform duration-200 group-hover:scale-110 text-error">
        <Icon name="logout" size={22} />
      </div>
      <span
        className={`overflow-hidden whitespace-nowrap text-error font-medium transition-[max-width,opacity,margin-left] duration-300 ease-in-out ${
          expanded ? "max-w-50 opacity-100 ml-3" : "max-w-0 opacity-0 ml-0"
        }`}
      >
        Sign Out
      </span>
    </Link>
  );

  if (showTooltip && !expanded) {
    return (
      <Tooltip>
        <TooltipTrigger render={<div />}>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          Sign Out
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
});

export default function Sidebar({ items, bottomItems, role }: SidebarProps) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setMobileOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const handleMouseEnter = () => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    setHovered(true);
  };

  const handleMouseLeave = () => {
    leaveTimer.current = setTimeout(() => setHovered(false), 100);
  };

  return (
    <TooltipProvider delay={300}>
      {/* ═══ Mobile: Hamburger button ═══ */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant flex items-center justify-center text-on-surface-variant"
        aria-label="Toggle menu"
      >
        <Icon name="menu" size={22} />
      </button>

      {/* ═══ Mobile: Sheet Drawer ═══ */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-70 p-0 bg-surface-container-low border-r border-outline-variant/30"
          showCloseButton={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full py-6">
            <div className="flex justify-end px-3 mb-2">
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
                aria-label="Close menu"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <Brand expanded role={role} />

            <div className="mx-3 mb-2 border-t border-outline-variant/20" />

            <div className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3">
              {items.map((item) => (
                <NavLink key={item.href} item={item} expanded role={role} />
              ))}
            </div>

            <div className="mt-auto space-y-1 pt-4 px-3">
              <div className="mb-2 border-t border-outline-variant/20" />
              {bottomItems?.map((item) => (
                <NavLink key={item.href} item={item} expanded role={role} />
              ))}
              <SignOutLink expanded />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══ Desktop: Hover sidebar ═══ */}
      <nav
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`hidden md:flex h-screen fixed left-0 top-0 flex-col py-6 z-40
          bg-surface-container-low border-r border-outline-variant/30
          transition-[width,box-shadow] duration-300 ease-in-out
          ${hovered ? `${EXPANDED_WIDTH} shadow-2xl` : COLLAPSED_WIDTH}`}
      >
        <Brand expanded={hovered} role={role} />

        <div className="mx-3 mb-2 border-t border-outline-variant/20" />

        <div className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3">
          {items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              expanded={hovered}
              showTooltip={!hovered}
              role={role}
            />
          ))}
        </div>

        <div className="mt-auto space-y-1 pt-4 px-3">
          <div className="mb-2 border-t border-outline-variant/20" />
          {bottomItems?.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              expanded={hovered}
              showTooltip={!hovered}
              role={role}
            />
          ))}
          <SignOutLink expanded={hovered} showTooltip={!hovered} />
        </div>
      </nav>
    </TooltipProvider>
  );
}
