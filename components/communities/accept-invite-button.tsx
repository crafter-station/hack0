"use client";

import { Check, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function AcceptInviteButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full gap-2" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Uniéndote...
        </>
      ) : (
        <>
          <Check className="h-4 w-4" />
          Unirme a la comunidad
        </>
      )}
    </Button>
  );
}
