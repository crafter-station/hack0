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
import { TrophyIcon } from "@/components/icons/trophy";
import { createWinnerClaim } from "@/lib/actions/claims";

interface WinnerClaimDialogProps {
  eventId: string;
  eventName: string;
  children: React.ReactNode;
}

export function WinnerClaimDialog({
  eventId,
  eventName,
  children,
}: WinnerClaimDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [position, setPosition] = useState<number>(1);
  const [teamName, setTeamName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [proofDescription, setProofDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!proofUrl) {
      setError("El enlace de prueba es obligatorio");
      setLoading(false);
      return;
    }

    const result = await createWinnerClaim({
      eventId,
      position,
      teamName: teamName || undefined,
      projectName: projectName || undefined,
      projectUrl: projectUrl || undefined,
      proofUrl,
      proofDescription: proofDescription || undefined,
    });

    setLoading(false);

    if (result.success) {
      setOpen(false);
      // Reset form
      setPosition(1);
      setTeamName("");
      setProjectName("");
      setProjectUrl("");
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
            <TrophyIcon className="h-5 w-5 text-amber-500" />
            Registrar victoria
          </DialogTitle>
          <DialogDescription>
            Registra tu puesto en el podio de {eventName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Position */}
          <div className="space-y-2">
            <Label>Posición en el podio</Label>
            <div className="flex gap-2">
              {[1, 2, 3].map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setPosition(pos)}
                  className={`flex-1 h-12 rounded-md border text-lg font-medium transition-colors ${
                    position === pos
                      ? "border-amber-500 bg-amber-500/10 text-amber-500"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {pos === 1 ? "🥇" : pos === 2 ? "🥈" : "🥉"}
                </button>
              ))}
            </div>
          </div>

          {/* Team name */}
          <div className="space-y-2">
            <Label htmlFor="teamName">Nombre del equipo (opcional)</Label>
            <Input
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Ej: Los Innovadores"
            />
          </div>

          {/* Project name */}
          <div className="space-y-2">
            <Label htmlFor="projectName">Nombre del proyecto (opcional)</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Ej: EcoTrack App"
            />
          </div>

          {/* Project URL */}
          <div className="space-y-2">
            <Label htmlFor="projectUrl">URL del proyecto (opcional)</Label>
            <Input
              id="projectUrl"
              type="url"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              placeholder="https://devpost.com/..."
            />
          </div>

          {/* Proof URL - Required */}
          <div className="space-y-2">
            <Label htmlFor="proofUrl">
              Enlace de prueba <span className="text-red-500">*</span>
            </Label>
            <Input
              id="proofUrl"
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://..."
              required
            />
            <p className="text-xs text-muted-foreground">
              Link al anuncio de ganadores, captura de pantalla, o publicación oficial
            </p>
          </div>

          {/* Proof description */}
          <div className="space-y-2">
            <Label htmlFor="proofDescription">Descripción adicional (opcional)</Label>
            <Input
              id="proofDescription"
              value={proofDescription}
              onChange={(e) => setProofDescription(e.target.value)}
              placeholder="Información adicional..."
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
