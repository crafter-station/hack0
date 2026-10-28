import { Show, UserButton } from "@clerk/nextjs";
import { Suspense } from "react";
import { Wordmark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LUMA } from "@/lib/site";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main>
      <header className="top">
        <a href="/" aria-label="hack0" style={{ textDecoration: "none" }}>
          <Wordmark size={26} />
        </a>
        <nav>
          <a href="/eventos">eventos</a>
          <a href="/#organizadores">organizadores</a>
          <a href={LUMA}>luma</a>
          {/* Only admins sign in; once they do, the panel link and Clerk's menu (with sign out) appear. */}
          <Suspense>
            <Show when="signed-in">
              <a href="/admin">admin</a>
              <UserButton />
            </Show>
          </Suspense>
          <ThemeToggle />
        </nav>
      </header>
      {children}
      <footer>
        <span>
          hack0 by <a href="https://crafter.run">Crafter Station</a>
        </span>
        <span>
          <a href="/eventos">eventos</a> · <a href="/brand">brand</a> · <a href="https://github.com/crafter-station/hack0">github</a>
        </span>
      </footer>
    </main>
  );
}
