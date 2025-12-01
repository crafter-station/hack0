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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Pencil } from "lucide-react";
import { updateEvent } from "@/lib/actions/claims";
import type { Hackathon } from "@/lib/db/schema";

interface EditEventDialogProps {
  event: Hackathon;
  children?: React.ReactNode;
}

export function EditEventDialog({ event, children }: EditEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(event.name);
  const [description, setDescription] = useState(event.description || "");
  const [startDate, setStartDate] = useState(
    event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : ""
  );
  const [endDate, setEndDate] = useState(
    event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : ""
  );
  const [registrationDeadline, setRegistrationDeadline] = useState(
    event.registrationDeadline
      ? new Date(event.registrationDeadline).toISOString().slice(0, 16)
      : ""
  );
  const [format, setFormat] = useState<"virtual" | "in-person" | "hybrid">(
    event.format || "virtual"
  );
  const [city, setCity] = useState(event.city || "");
  const [prizePool, setPrizePool] = useState(
    event.prizePool?.toString() || ""
  );
  const [prizeDescription, setPrizeDescription] = useState(
    event.prizeDescription || ""
  );
  const [websiteUrl, setWebsiteUrl] = useState(event.websiteUrl || "");
  const [registrationUrl, setRegistrationUrl] = useState(
    event.registrationUrl || ""
  );
  const [logoUrl, setLogoUrl] = useState(event.logoUrl || "");
  const [bannerUrl, setBannerUrl] = useState(event.bannerUrl || "");
  const [isJuniorFriendly, setIsJuniorFriendly] = useState(
    event.isJuniorFriendly || false
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await updateEvent({
      eventId: event.id,
      name,
      description: description || undefined,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      registrationDeadline: registrationDeadline
        ? new Date(registrationDeadline)
        : null,
      format,
      city: city || undefined,
      prizePool: prizePool ? parseInt(prizePool, 10) : null,
      prizeDescription: prizeDescription || undefined,
      websiteUrl: websiteUrl || undefined,
      registrationUrl: registrationUrl || undefined,
      logoUrl: logoUrl || undefined,
      bannerUrl: bannerUrl || undefined,
      isJuniorFriendly,
    });

    setLoading(false);

    if (result.success) {
      setOpen(false);
    } else {
      setError(result.error || "Error al guardar los cambios");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Editar evento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar evento
          </DialogTitle>
          <DialogDescription>
            Modifica la información de {event.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Información básica
            </h3>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre del evento</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Fechas</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de inicio</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha de fin</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationDeadline">
                Cierre de inscripciones
              </Label>
              <Input
                id="registrationDeadline"
                type="datetime-local"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Ubicación
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="format">Formato</Label>
                <Select value={format} onValueChange={(v) => setFormat(v as typeof format)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="virtual">Virtual</SelectItem>
                    <SelectItem value="in-person">Presencial</SelectItem>
                    <SelectItem value="hybrid">Híbrido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Lima, Buenos Aires..."
                />
              </div>
            </div>
          </div>

          {/* Prizes */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Premios</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prizePool">Premio total (USD)</Label>
                <Input
                  id="prizePool"
                  type="number"
                  value={prizePool}
                  onChange={(e) => setPrizePool(e.target.value)}
                  placeholder="10000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prizeDescription">Descripción del premio</Label>
                <Input
                  id="prizeDescription"
                  value={prizeDescription}
                  onChange={(e) => setPrizeDescription(e.target.value)}
                  placeholder="1er lugar: $5000..."
                />
              </div>
            </div>
          </div>

          {/* URLs */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Enlaces</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Sitio web</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationUrl">URL de inscripción</Label>
                <Input
                  id="registrationUrl"
                  type="url"
                  value={registrationUrl}
                  onChange={(e) => setRegistrationUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">URL del logo</Label>
                <Input
                  id="logoUrl"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bannerUrl">URL del banner</Label>
                <Input
                  id="bannerUrl"
                  type="url"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Flags */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isJuniorFriendly">Junior Friendly</Label>
              <p className="text-sm text-muted-foreground">
                Marcar si el evento es apto para principiantes
              </p>
            </div>
            <Switch
              id="isJuniorFriendly"
              checked={isJuniorFriendly}
              onCheckedChange={setIsJuniorFriendly}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

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
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
