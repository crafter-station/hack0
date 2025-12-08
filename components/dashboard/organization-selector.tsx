"use client";

import { Building2, Crown, Shield, Users, UserPlus, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Organization } from "@/lib/db/schema";

interface OrganizationWithRole {
  organization: Organization;
  role: "owner" | "admin" | "member" | "follower";
}

interface OrganizationSelectorProps {
  organizations: OrganizationWithRole[];
}

const ROLE_CONFIG = {
  owner: {
    label: "Owner",
    icon: Crown,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  member: {
    label: "Miembro",
    icon: Users,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  follower: {
    label: "Seguidor",
    icon: UserPlus,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
};

export function OrganizationSelector({ organizations }: OrganizationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrganizations = useMemo(() => {
    if (!searchQuery.trim()) return organizations;

    const query = searchQuery.toLowerCase();
    return organizations.filter(({ organization }) => {
      const name = (organization.displayName || organization.name).toLowerCase();
      const slug = organization.slug.toLowerCase();
      const description = organization.description?.toLowerCase() || "";

      return name.includes(query) || slug.includes(query) || description.includes(query);
    });
  }, [organizations, searchQuery]);

  if (organizations.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-16">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>No tienes comunidades</EmptyTitle>
            <EmptyDescription>
              Crea tu primera comunidad para comenzar a organizar eventos y conectar con tu audiencia.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/onboarding">Crear comunidad</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Tus comunidades</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona una comunidad para administrar
        </p>
      </div>

      {organizations.length > 4 && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar comunidades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      <div className="max-h-[600px] overflow-y-auto pr-2">
        {filteredOrganizations.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No se encontraron comunidades que coincidan con "{searchQuery}"
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredOrganizations.map(({ organization, role }) => {
              const roleConfig = ROLE_CONFIG[role];
              const RoleIcon = roleConfig.icon;

              return (
                <Link
                  key={organization.id}
                  href={`/c/${organization.slug}`}
                  className="group relative rounded-lg border border-border bg-card p-5 transition-all hover:border-foreground/20 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {organization.logoUrl ? (
                        <div className="h-10 w-10 rounded-lg border border-border overflow-hidden shrink-0">
                          <img
                            src={organization.logoUrl}
                            alt={organization.displayName || organization.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-lg border border-border bg-muted flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h2 className="font-medium truncate">
                          {organization.displayName || organization.name}
                        </h2>
                        <p className="text-sm text-muted-foreground truncate">
                          /{organization.slug}
                        </p>
                        {organization.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {organization.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${roleConfig.bgColor} ${roleConfig.color}`}
                      >
                        <RoleIcon className="h-3 w-3" />
                        {roleConfig.label}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/onboarding">
            <Building2 className="h-4 w-4" />
            Crear nueva comunidad
          </Link>
        </Button>
      </div>
    </div>
  );
}
