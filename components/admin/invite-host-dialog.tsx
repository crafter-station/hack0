"use client";

import { Mail, Send } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteHost } from "@/lib/actions/host-claims";

interface InviteHostDialogProps {
	lumaHostApiId: string;
	hostName: string;
	hostAvatarUrl: string | null;
	existingEmail?: string | null;
}

export function InviteHostDialog({
	lumaHostApiId,
	hostName,
	hostAvatarUrl,
	existingEmail,
}: InviteHostDialogProps) {
	const [open, setOpen] = useState(false);
	const [email, setEmail] = useState(existingEmail || "");
	const [isPending, startTransition] = useTransition();

	const handleInvite = () => {
		if (!email.trim()) {
			toast.error("Ingresa un email");
			return;
		}

		startTransition(async () => {
			const result = await inviteHost(lumaHostApiId, email.trim());
			if (result.success) {
				toast.success("Invitación enviada", {
					description: result.message,
				});
				setOpen(false);
			} else {
				toast.error(result.error);
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" className="gap-1.5 text-xs">
					<Mail className="h-3.5 w-3.5" />
					Invitar
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Invitar host</DialogTitle>
					<DialogDescription>
						Envía una invitación a {hostName} para vincular su perfil de Luma con Hack0.
					</DialogDescription>
				</DialogHeader>

				<div className="py-4 space-y-4">
					<div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
						<Avatar className="h-10 w-10">
							<AvatarImage src={hostAvatarUrl || undefined} alt={hostName} />
							<AvatarFallback>{hostName.charAt(0)}</AvatarFallback>
						</Avatar>
						<div>
							<p className="font-medium">{hostName}</p>
							<p className="text-xs text-muted-foreground">Host de Luma</p>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="email">Email del host</Label>
						<Input
							id="email"
							type="email"
							placeholder="host@ejemplo.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
						<p className="text-xs text-muted-foreground">
							El host recibirá una invitación para crear su cuenta en Hack0.
						</p>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancelar
					</Button>
					<Button onClick={handleInvite} disabled={isPending} className="gap-1.5">
						{isPending ? (
							"Enviando..."
						) : (
							<>
								<Send className="h-4 w-4" />
								Enviar invitación
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
