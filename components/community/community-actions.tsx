"use client";

import { useState } from "react";
import { UserPlus, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

interface CommunityActionsProps {
  communitySlug: string;
  userRole: "owner" | "admin" | "member" | "follower" | null;
}

export function CommunityActions({ communitySlug, userRole }: CommunityActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  if (userRole === "owner" || userRole === "admin") {
    return (
      <Button className="gap-2" onClick={() => router.push(`/c/${communitySlug}/events/new`)}>
        <UserPlus className="h-4 w-4" />
        Nuevo evento
      </Button>
    );
  }

  if (userRole === "member" || userRole === "follower") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Users className="h-4 w-4" />
            {userRole === "member" ? "Miembro" : "Seguidor"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/c/${communitySlug}/members`)}>
            Ver miembros
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            // TODO: Implementar solicitud de upgrade de rol
            alert("Próximamente: solicitar upgrade de rol");
          }}>
            <Shield className="h-4 w-4 mr-2" />
            Solicitar admin
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button className="gap-2" onClick={() => {
      // TODO: Implementar unirse sin invitación (si es pública)
      alert("Próximamente: unirse a la comunidad");
    }}>
      <UserPlus className="h-4 w-4" />
      Unirse
    </Button>
  );
}
