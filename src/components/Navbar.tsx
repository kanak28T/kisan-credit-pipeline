import { Link, useNavigate } from "@tanstack/react-router";
import { Sprout, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { RegisterLink } from "@/components/RegisterLink";

export function Navbar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const linkBase =
    "text-sm font-semibold text-foreground/80 hover:text-primary transition-colors px-3 py-2 rounded-md";

  return (
    <header className="w-full bg-white/95 backdrop-blur border-b border-border sticky top-0 z-40 shadow-sm">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3 gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Sprout className="w-7 h-7 text-primary" />
          <div className="leading-tight">
            <span className="text-lg font-bold text-primary block">किसान Credit</span>
            <span className="text-[10px] font-semibold text-foreground/45 uppercase tracking-wide hidden sm:block">
              Nagpur · Verified farms
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <RegisterLink
            className={linkBase}
            signedInLabel="My farm"
            signedOutLabel="For farmers"
            showArrow={false}
          />
          <Link to="/registry" className={`${linkBase} text-secondary hover:text-secondary`}>
            Buy credits
          </Link>
          <Link to="/about" className={linkBase}>
            About
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary max-w-[140px] truncate">
                <UserIcon className="w-3.5 h-3.5 shrink-0" />
                {user.email?.split("@")[0]}
              </span>
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
                className="inline-flex items-center gap-1 text-sm font-semibold text-foreground/60 hover:text-destructive px-2 py-2"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <RegisterLink
              className="kc-btn-primary text-sm px-4 py-2"
              signedInLabel="My farm"
              signedOutLabel="Farmer login"
            />
          )}
          <Link
            to="/registry"
            className="md:hidden kc-btn-outline-teal text-sm px-3 py-2"
          >
            Buy
          </Link>
        </div>
      </nav>
    </header>
  );
}
