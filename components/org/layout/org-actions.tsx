"use client";

import { Shield, UserMinus, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FollowButtonAnimated } from "@/components/org/members/follow-button-animated";
import { JoinOrgDialog } from "@/components/org/members/join-org-dialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { followCommunity, unfollowCommunity } from "@/lib/actions/communities";

interface OrgActionsProps {
	communityId: string;
	communitySlug: string;
	communityName: string;
	userRole: "owner" | "admin" | "member" | "follower" | null;
	isAuthenticated: boolean;
}

export function OrgActions({
	communityId,
	communitySlug,
	communityName,
	userRole,
	isAuthenticated,
}: OrgActionsProps) {
	const router = useRouter();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogAction, setDialogAction] = useState<
		"request-member" | "request-admin"
	>("request-member");
	const [isFollowing, setIsFollowing] = useState(false);
	const [isUnfollowing, setIsUnfollowing] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);

	// Reset follow states when userRole changes (e.g., after unfollowing)
	useEffect(() => {
		if (userRole === null && (isFollowing || showSuccess)) {
			setIsFollowing(false);
			setShowSuccess(false);
		}
	}, [userRole, isFollowing, showSuccess]);

	const handleFollow = async () => {
		setIsFollowing(true);
		try {
			const result = await followCommunity(communityId);
			if (result.success) {
				setIsFollowing(false);
				setShowSuccess(true);
				toast.success("Ahora sigues esta comunidad");
				// Refresh after animation completes
				setTimeout(() => {
					router.refresh();
				}, 300);
			} else {
				toast.error(result.error || "Ocurrió un error");
				setIsFollowing(false);
			}
		} catch (_error) {
			toast.error("Ocurrió un error inesperado");
			setIsFollowing(false);
		}
	};

	const handleOpenDialog = (action: "request-member" | "request-admin") => {
		setDialogAction(action);
		setDialogOpen(true);
	};

	const handleUnfollow = async () => {
		setIsUnfollowing(true);
		try {
			const result = await unfollowCommunity(communityId);
			if (result.success) {
				toast.success("Has dejado de seguir la comunidad");
				router.refresh();
			} else {
				toast.error(result.error || "Ocurrió un error");
			}
		} catch (_error) {
			toast.error("Ocurrió un error inesperado");
		} finally {
			setIsUnfollowing(false);
		}
	};

	if (userRole === "owner" || userRole === "admin") {
		return (
			<Button
				size="sm"
				className="gap-1.5 h-7 text-xs"
				onClick={() => router.push(`/c/${communitySlug}/events/new`)}
			>
				<UserPlus className="h-3.5 w-3.5" />
				Nuevo evento
			</Button>
		);
	}

	if (userRole === "member") {
		return (
			<>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs">
							<Users className="h-3.5 w-3.5" />
							Miembro
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							onClick={() => router.push(`/c/${communitySlug}/members`)}
						>
							Ver miembros
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => handleOpenDialog("request-admin")}>
							<Shield className="h-4 w-4 mr-2" />
							Solicitar admin
						</DropdownMenuItem>
						<DropdownMenuItem onClick={handleUnfollow} disabled={isUnfollowing}>
							<UserMinus className="h-4 w-4 mr-2" />
							Dejar de seguir
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				<JoinOrgDialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					communityId={communityId}
					communityName={communityName}
					action={dialogAction}
				/>
			</>
		);
	}

	if (userRole === "follower") {
		return (
			<>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs">
							<Users className="h-3.5 w-3.5" />
							Seguidor
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							onClick={() => router.push(`/c/${communitySlug}/members`)}
						>
							Ver miembros
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => handleOpenDialog("request-member")}
						>
							<Shield className="h-4 w-4 mr-2" />
							Solicitar ser miembro
						</DropdownMenuItem>
						<DropdownMenuItem onClick={handleUnfollow} disabled={isUnfollowing}>
							<UserMinus className="h-4 w-4 mr-2" />
							Dejar de seguir
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				<JoinOrgDialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					communityId={communityId}
					communityName={communityName}
					action={dialogAction}
				/>
			</>
		);
	}

	// Not authenticated - redirect to sign in
	if (!isAuthenticated) {
		return (
			<Button
				size="sm"
				className="gap-1.5 h-7 text-xs"
				onClick={() =>
					router.push(
						`/sign-in?redirect_url=${encodeURIComponent(`/c/${communitySlug}`)}`,
					)
				}
			>
				<UserPlus className="h-3.5 w-3.5" />
				Seguir
			</Button>
		);
	}

	// Authenticated but no role - follow directly (no dialog)
	return (
		<Button
			size="sm"
			className="gap-1.5 h-7 text-xs"
			onClick={handleFollow}
			disabled={isFollowing || showSuccess}
		>
			<FollowButtonAnimated
				isFollowing={isFollowing}
				showSuccess={showSuccess}
			/>
		</Button>
	);
}
