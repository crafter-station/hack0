"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteEvent } from "@/lib/actions/events";

interface DeleteEventButtonProps {
	eventId: string;
	eventName: string;
	communitySlug: string;
}

export function DeleteEventButton({
	eventId,
	eventName,
	communitySlug,
}: DeleteEventButtonProps) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isOpen, setIsOpen] = useState(false);

	const handleDelete = async () => {
		setError(null);
		setIsDeleting(true);

		const result = await deleteEvent(eventId);

		if (result.success) {
			setIsOpen(false);
			toast.success("Evento eliminado");
			window.location.href = `/c/${communitySlug}`;
		} else {
			setError(result.error || "Error al borrar el evento");
			setIsOpen(false);
			setIsDeleting(false);
		}
	};

	return (
		<>
			<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
				<AlertDialogTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/20 dark:hover:text-red-300"
						disabled={isDeleting}
					>
						{isDeleting ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Trash2 className="h-4 w-4" />
						)}
						Borrar evento
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción no se puede deshacer. Se borrará permanentemente el
							evento <span className="font-semibold">{eventName}</span> y todos
							sus datos asociados (sponsors, ganadores, etc.).
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>
							Cancelar
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleDelete();
							}}
							disabled={isDeleting}
							className="bg-red-600 hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800"
						>
							{isDeleting ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
									Borrando...
								</>
							) : (
								"Sí, borrar evento"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-800 dark:text-red-200">
					{error}
				</div>
			)}
		</>
	);
}
