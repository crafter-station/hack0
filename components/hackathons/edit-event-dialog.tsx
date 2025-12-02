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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Pencil,
  Globe,
  Link as LinkIcon,
  Calendar,
  MapPin,
  Trophy,
  Sparkles,
  Loader2,
} from "lucide-react";
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
          {/* Banner */}
          <Field>
            <FieldLabel>Banner</FieldLabel>
            <ImageUpload
              value={bannerUrl}
              onChange={setBannerUrl}
              onRemove={() => setBannerUrl("")}
              endpoint="bannerUploader"
              aspectRatio="banner"
            />
          </Field>

          {/* Title */}
          <Field>
            <FieldLabel htmlFor="name">Nombre del evento</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </InputGroup>
          </Field>

          {/* Logo + Description */}
          <div className="grid grid-cols-[120px_1fr] gap-4">
            <Field>
              <FieldLabel>Logo</FieldLabel>
              <ImageUpload
                value={logoUrl}
                onChange={setLogoUrl}
                onRemove={() => setLogoUrl("")}
                endpoint="imageUploader"
                aspectRatio="square"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Descripción</FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                />
              </InputGroup>
            </Field>
          </div>

          {/* Dates */}
          <FieldGroup className="gap-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fechas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="startDate">Fecha de inicio</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="startDate"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </InputGroup>
              </Field>

              <Field>
                <FieldLabel htmlFor="endDate">Fecha de fin</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="endDate"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </InputGroup>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="registrationDeadline">
                Cierre de inscripciones
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="registrationDeadline"
                  type="datetime-local"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                />
              </InputGroup>
            </Field>
          </FieldGroup>

          {/* Location */}
          <FieldGroup className="gap-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Ubicación
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="format">Formato</FieldLabel>
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
              </Field>

              <Field>
                <FieldLabel htmlFor="city">Ciudad</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Lima, Arequipa..."
                  />
                </InputGroup>
              </Field>
            </div>
          </FieldGroup>

          {/* Prizes */}
          <FieldGroup className="gap-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Premios
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="prizePool">Premio total (USD)</FieldLabel>
                <InputGroup>
                  <InputGroupAddon align="inline-start">$</InputGroupAddon>
                  <InputGroupInput
                    id="prizePool"
                    type="number"
                    value={prizePool}
                    onChange={(e) => setPrizePool(e.target.value)}
                    placeholder="10000"
                  />
                </InputGroup>
              </Field>

              <Field>
                <FieldLabel htmlFor="prizeDescription">Descripción</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="prizeDescription"
                    value={prizeDescription}
                    onChange={(e) => setPrizeDescription(e.target.value)}
                    placeholder="1er lugar: $5000..."
                  />
                </InputGroup>
              </Field>
            </div>
          </FieldGroup>

          {/* URLs */}
          <FieldGroup className="gap-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Enlaces
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="websiteUrl">Sitio web</FieldLabel>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Globe className="h-4 w-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="websiteUrl"
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </InputGroup>
              </Field>

              <Field>
                <FieldLabel htmlFor="registrationUrl">Inscripción</FieldLabel>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <LinkIcon className="h-4 w-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="registrationUrl"
                    type="url"
                    value={registrationUrl}
                    onChange={(e) => setRegistrationUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </InputGroup>
              </Field>
            </div>
          </FieldGroup>

          {/* Flags */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Junior Friendly</p>
                <p className="text-xs text-muted-foreground">
                  Apto para principiantes sin experiencia
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isJuniorFriendly}
              onClick={() => setIsJuniorFriendly(!isJuniorFriendly)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                isJuniorFriendly ? "bg-foreground" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
                  isJuniorFriendly ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-sm text-red-500">{error}</p>
            </div>
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
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
