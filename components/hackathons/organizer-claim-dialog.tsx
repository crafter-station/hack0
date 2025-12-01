"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCheck } from "lucide-react";
import { createOrganizerClaim } from "@/lib/actions/claims";

interface OrganizerClaimDialogProps {
  eventId: string;
  eventName: string;
  children: React.ReactNode;
}

export function OrganizerClaimDialog({
  eventId,
  eventName,
  children,
}: OrganizerClaimDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [proofDescription, setProofDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email) {
      setError("El email es obligatorio");
      setLoading(false);
      return;
    }

    const result = await createOrganizerClaim({
      eventId,
      email,
      name: name || undefined,
      role: role || undefined,
      proofUrl: proofUrl || undefined,
      proofDescription: proofDescription || undefined,
    });

    setLoading(false);

    if (result.success) {
      setOpen(false);
      // Reset form
      setEmail("");
      setName("");
      setRole("");
      setProofUrl("");
      setProofDescription("");
    } else {
      setError(result.error || "Error al enviar la solicitud");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Solicitar verificación
          </DialogTitle>
          <DialogDescription>
            Solicita acceso como organizador de {eventName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email de contacto <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo (opcional)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Rol en el evento (opcional)</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Ej: Organizador, Co-organizador, Sponsor..."
            />
          </div>

          {/* Proof URL */}
          <div className="space-y-2">
            <Label htmlFor="proofUrl">Enlace de verificación (opcional)</Label>
            <Input
              id="proofUrl"
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://linkedin.com/in/..."
            />
            <p className="text-xs text-muted-foreground">
              Link a tu LinkedIn, perfil en la web del evento, o prueba de tu rol
            </p>
          </div>

          {/* Proof description */}
          <div className="space-y-2">
            <Label htmlFor="proofDescription">Información adicional (opcional)</Label>
            <Input
              id="proofDescription"
              value={proofDescription}
              onChange={(e) => setProofDescription(e.target.value)}
              placeholder="Cuéntanos más sobre tu rol..."
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar solicitud"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
