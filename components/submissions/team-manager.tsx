"use client";

import { Loader2, LogOut, Shield, Trash2, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { leaveTeam, removeTeamMember } from "@/lib/actions/submissions";
import type { SubmissionTeamMember } from "@/lib/db/schema";
import { TeamInviteDialog } from "./team-invite-dialog";

const ROLE_LABELS: Record<string, string> = {
	lead: "Lider",
	developer: "Desarrollador",
	designer: "Disenador",
	pm: "Project Manager",
	other: "Otro",
};

const STATUS_LABELS: Record<string, string> = {
	pending: "Pendiente",
	accepted: "Aceptado",
	declined: "Rechazado",
	removed: "Removido",
};

const STATUS_VARIANT: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	pending: "outline",
	accepted: "default",
	declined: "destructive",
	removed: "destructive",
};

interface TeamManagerProps {
	submissionId: string;
	teamMembers: SubmissionTeamMember[];
	isLead: boolean;
	maxTeamSize: number;
}

export function TeamManager({
	submissionId,
	teamMembers,
	isLead,
	maxTeamSize,
}: TeamManagerProps) {
	const [members, setMembers] = useState(teamMembers);
	const [inviteOpen, setInviteOpen] = useState(false);
	const [removingId, setRemovingId] = useState<string | null>(null);
	const [isLeaving, startLeaving] = useTransition();

	const activeMembers = members.filter(
		(m) => m.status === "accepted" || m.status === "pending",
	);
	const canInvite = isLead && activeMembers.length < maxTeamSize;

	async function handleRemove(memberUserId: string) {
		setRemovingId(memberUserId);
		const result = await removeTeamMember(submissionId, memberUserId);
		if (result.success) {
			setMembers((prev) =>
				prev.map((m) =>
					m.userId === memberUserId ? { ...m, status: "removed" } : m,
				),
			);
			toast.success("Miembro removido del equipo");
		} else {
			toast.error(result.error ?? "Error al remover miembro");
		}
		setRemovingId(null);
	}

	function handleLeave() {
		startLeaving(async () => {
			const result = await leaveTeam(submissionId);
			if (result.success) {
				toast.success("Has abandonado el equipo");
			} else {
				toast.error(result.error ?? "Error al abandonar el equipo");
			}
		});
	}

	return (
		<Card className="p-0">
			<div className="flex items-center justify-between border-b p-4">
				<div>
					<h3 className="text-sm font-medium">Equipo</h3>
					<p className="text-xs text-muted-foreground">
						{activeMembers.length} / {maxTeamSize} miembros
					</p>
				</div>

				{canInvite && (
					<Button
						variant="outline"
						size="sm"
						onClick={() => setInviteOpen(true)}
					>
						<UserPlus className="mr-1.5 h-3.5 w-3.5" />
						Invitar
					</Button>
				)}
			</div>

			<div className="divide-y">
				{members.map((member) => (
					<div
						key={member.id}
						className={`flex items-center justify-between gap-3 px-4 py-3 ${
							member.status === "removed" || member.status === "declined"
								? "opacity-50"
								: ""
						}`}
					>
						<div className="flex items-center gap-3 min-w-0">
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
								{member.userId.slice(0, 2).toUpperCase()}
							</div>
							<div className="min-w-0">
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium truncate">
										{member.userId}
									</span>
									{member.role === "lead" && (
										<Badge
											variant="secondary"
											className="gap-1 text-[10px] px-1.5 py-0"
										>
											<Shield className="h-2.5 w-2.5" />
											Lider
										</Badge>
									)}
								</div>
								<div className="flex items-center gap-2 mt-0.5">
									<span className="text-xs text-muted-foreground">
										{ROLE_LABELS[member.role ?? "developer"]}
									</span>
									<Badge
										variant={STATUS_VARIANT[member.status ?? "pending"]}
										className="text-[10px] px-1.5 py-0"
									>
										{STATUS_LABELS[member.status ?? "pending"]}
									</Badge>
								</div>
							</div>
						</div>

						{isLead &&
							member.role !== "lead" &&
							member.status !== "removed" &&
							member.status !== "declined" && (
								<Button
									variant="ghost"
									size="sm"
									className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
									onClick={() => handleRemove(member.userId)}
									disabled={removingId === member.userId}
								>
									{removingId === member.userId ? (
										<Loader2 className="h-3.5 w-3.5 animate-spin" />
									) : (
										<Trash2 className="h-3.5 w-3.5" />
									)}
								</Button>
							)}
					</div>
				))}

				{members.length === 0 && (
					<div className="px-4 py-6 text-center text-sm text-muted-foreground">
						No hay miembros en el equipo
					</div>
				)}
			</div>

			{!isLead && (
				<div className="border-t p-4">
					<Button
						variant="outline"
						size="sm"
						className="w-full text-destructive hover:text-destructive"
						onClick={handleLeave}
						disabled={isLeaving}
					>
						{isLeaving ? (
							<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
						) : (
							<LogOut className="mr-1.5 h-3.5 w-3.5" />
						)}
						Abandonar equipo
					</Button>
				</div>
			)}

			<TeamInviteDialog
				submissionId={submissionId}
				open={inviteOpen}
				onOpenChange={setInviteOpen}
			/>
		</Card>
	);
}
