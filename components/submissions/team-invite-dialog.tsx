"use client";

import { Check, Copy, Loader2, Send } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteTeamMember } from "@/lib/actions/submissions";

interface TeamInviteDialogProps {
	submissionId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function TeamInviteDialog({
	submissionId,
	open,
	onOpenChange,
}: TeamInviteDialogProps) {
	const [userId, setUserId] = useState("");
	const [inviteLink, setInviteLink] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [isPending, startTransition] = useTransition();

	function handleInvite() {
		if (!userId.trim()) {
			toast.error("Ingresa el ID del usuario");
			return;
		}

		startTransition(async () => {
			const result = await inviteTeamMember(submissionId, userId.trim());
			if (result.success && result.data) {
				const link = `${window.location.origin}/invite/${result.data.token}`;
				setInviteLink(link);
				toast.success("Invitacion enviada");
				setUserId("");
			} else {
				toast.error(result.error ?? "Error al enviar la invitacion");
			}
		});
	}

	async function handleCopy() {
		if (!inviteLink) return;
		await navigator.clipboard.writeText(inviteLink);
		setCopied(true);
		toast.success("Enlace copiado al portapapeles");
		setTimeout(() => setCopied(false), 2000);
	}

	function handleClose(value: boolean) {
		if (!value) {
			setUserId("");
			setInviteLink(null);
			setCopied(false);
		}
		onOpenChange(value);
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Invitar miembro</DialogTitle>
					<DialogDescription>
						Invita a un usuario a unirse a tu equipo
					</DialogDescription>
				</DialogHeader>

				<DialogBody>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="user-id">ID del usuario</Label>
							<div className="flex gap-2">
								<Input
									id="user-id"
									placeholder="user_abc123..."
									value={userId}
									onChange={(e) => setUserId(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") handleInvite();
									}}
									disabled={isPending}
								/>
								<Button
									onClick={handleInvite}
									disabled={isPending || !userId.trim()}
									size="default"
								>
									{isPending ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Send className="h-4 w-4" />
									)}
								</Button>
							</div>
						</div>

						{inviteLink && (
							<div className="space-y-2">
								<Label>Enlace de invitacion</Label>
								<div className="flex gap-2">
									<Input
										readOnly
										value={inviteLink}
										className="text-xs font-mono"
									/>
									<Button
										variant="outline"
										size="icon"
										onClick={handleCopy}
										className="shrink-0"
									>
										{copied ? (
											<Check className="h-4 w-4 text-emerald-500" />
										) : (
											<Copy className="h-4 w-4" />
										)}
									</Button>
								</div>
								<p className="text-xs text-muted-foreground">
									Comparte este enlace con el usuario para que acepte la
									invitacion
								</p>
							</div>
						)}
					</div>
				</DialogBody>

				<DialogFooter>
					<Button variant="outline" onClick={() => handleClose(false)}>
						Cerrar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
