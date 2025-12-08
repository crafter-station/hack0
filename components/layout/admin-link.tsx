"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { isAdmin } from "@/lib/actions/claims";

export function AdminLink() {
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    isAdmin().then(setShowAdmin);
  }, []);

  if (!showAdmin) return null;

  return (
    <Link
      href="/admin"
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Shield className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">God Mode</span>
    </Link>
  );
}
