"use client";

import { useState } from "react";
import { Shield, Crown, UserPlus, Link as LinkIcon, Trash2, Check, Copy, MoreVertical, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMMUNITY_ROLE_LABELS } from "@/lib/db/schema";
import type { CommunityMember, CommunityInvite } from "@/lib/db/schema";
import { createCommunityInvite, removeCommunityMember, updateMemberRole, revokeInvite } from "@/lib/actions/community-members";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
  imageUrl: string | null;
}

interface MembersManagementProps {
  communitySlug: string;
  communityId: string;
  ownerUserId: string;
  members: CommunityMember[];
  invites: CommunityInvite[];
  users: User[];
  currentUserId: string | null;
  isOwner: boolean;
  isAdmin: boolean;
}

export function MembersManagement({
  communitySlug,
  communityId,
  ownerUserId,
  members,
  invites,
  users,
  currentUserId,
  isOwner,
  isAdmin,
}: MembersManagementProps) {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"admin" | "member" | "follower">("member");
  const [generatedInvite, setGeneratedInvite] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleCreateInvite = async () => {
    setLoading(true);
    const result = await createCommunityInvite(communityId, selectedRole);

    if (result.success && result.invite) {
      const inviteUrl = `${window.location.origin}/invite/${result.invite.inviteToken}`;
      setGeneratedInvite(inviteUrl);
    }
    setLoading(false);
  };

  const handleCopyInvite = () => {
    if (generatedInvite) {
      navigator.clipboard.writeText(generatedInvite);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("¿Estás seguro de remover este miembro?")) return;

    setLoading(true);
    await removeCommunityMember(memberId);
    setLoading(false);
    window.location.reload();
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm("¿Revocar esta invitación?")) return;

    setLoading(true);
    await revokeInvite(inviteId);
    setLoading(false);
    window.location.reload();
  };

  const canManage = isOwner || isAdmin;

  const InviteFormContent = () => (
    <>
      {!generatedInvite ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rol a otorgar</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="follower">{COMMUNITY_ROLE_LABELS.follower}</option>
              <option value="member">{COMMUNITY_ROLE_LABELS.member}</option>
              <option value="admin">{COMMUNITY_ROLE_LABELS.admin}</option>
            </select>
          </div>

          <Button onClick={handleCreateInvite} disabled={loading} className="w-full">
            Generar link de invitación
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md bg-muted p-3 font-mono text-sm break-all">
            {generatedInvite}
          </div>
          <Button onClick={handleCopyInvite} variant="outline" className="w-full gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar link
              </>
            )}
          </Button>
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header with Invite Button */}
      {canManage && users.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {users.length} miembro{users.length !== 1 ? "s" : ""}
          </p>
          <Button onClick={() => setShowInviteDialog(true)} variant="outline" size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invitar
          </Button>
        </div>
      )}

      {/* Responsive Dialog/Drawer */}
      {isDesktop ? (
        <Dialog open={showInviteDialog} onOpenChange={(open) => {
          setShowInviteDialog(open);
          if (!open) setGeneratedInvite(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invitar miembros</DialogTitle>
              <DialogDescription>
                Genera un link de invitación para agregar personas a tu comunidad.
              </DialogDescription>
            </DialogHeader>
            <InviteFormContent />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={showInviteDialog} onOpenChange={(open) => {
          setShowInviteDialog(open);
          if (!open) setGeneratedInvite(null);
        }}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>Invitar miembros</DrawerTitle>
              <DrawerDescription>
                Genera un link de invitación para agregar personas a tu comunidad.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4">
              <InviteFormContent />
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Members List */}
      {users.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>No hay miembros</EmptyTitle>
            <EmptyDescription>
              Esta comunidad aún no tiene miembros.
              {canManage && " Invita a personas para comenzar a construir tu equipo."}
            </EmptyDescription>
          </EmptyHeader>
          {canManage && (
            <EmptyContent>
              <Button onClick={() => setShowInviteDialog(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invitar miembros
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {users.map((user) => {
              const userIsOwner = user.id === ownerUserId;
              const member = members.find((m) => m.userId === user.id);
              const canRemove = canManage && !userIsOwner && user.id !== currentUserId;

              return (
                <div key={user.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
                      {user.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt={user.firstName || "User"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">
                          {(
                            user.firstName?.[0] ||
                            user.emailAddresses[0]?.emailAddress[0] ||
                            "?"
                          ).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.firstName ||
                              user.emailAddresses[0]?.emailAddress ||
                              "Unknown"}
                        </p>
                        {userIsOwner && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500 shrink-0">
                            <Crown className="h-3 w-3" />
                            Owner
                          </span>
                        )}
                        {member?.role === "admin" && !userIsOwner && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500 shrink-0">
                            <Shield className="h-3 w-3" />
                            Admin
                          </span>
                        )}
                        {member?.role === "member" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground shrink-0">
                            Miembro
                          </span>
                        )}
                        {member?.role === "follower" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground shrink-0">
                            Seguidor
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.emailAddresses[0]?.emailAddress}
                      </p>
                    </div>
                  </div>

                  {canRemove && member && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Invites */}
      {canManage && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Invitaciones activas</h3>
          {invites.filter((i) => i.isActive).length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LinkIcon className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>No hay invitaciones activas</EmptyTitle>
                <EmptyDescription>
                  Crea una invitación para agregar nuevos miembros a tu comunidad.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setShowInviteDialog(true)} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invitar
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="divide-y divide-border">
                {invites.filter((i) => i.isActive).map((invite) => (
                  <div
                    key={invite.id}
                    className="px-5 py-4 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {COMMUNITY_ROLE_LABELS[invite.roleGranted]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          • {invite.usedCount || 0} uso{invite.usedCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Creada {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = `${window.location.origin}/invite/${invite.inviteToken}`;
                          navigator.clipboard.writeText(url);
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeInvite(invite.id)}
                        disabled={loading}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
