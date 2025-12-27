"use client";

import * as React from "react";
import {
	Dialog,
	DialogBody,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogInset,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface ResponsiveModalProps {
	children: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

interface ResponsiveModalTriggerProps {
	children: React.ReactNode;
	asChild?: boolean;
}

interface ResponsiveModalContentProps {
	children: React.ReactNode;
	className?: string;
}

interface ResponsiveModalHeaderProps {
	children: React.ReactNode;
	className?: string;
}

interface ResponsiveModalTitleProps {
	children: React.ReactNode;
	className?: string;
}

interface ResponsiveModalDescriptionProps {
	children: React.ReactNode;
	className?: string;
}

interface ResponsiveModalFooterProps {
	children: React.ReactNode;
	className?: string;
}

interface ResponsiveModalCloseProps {
	children: React.ReactNode;
	asChild?: boolean;
}

const ResponsiveModalContext = React.createContext<{ isDesktop: boolean }>({
	isDesktop: true,
});

function ResponsiveModal({
	children,
	open,
	onOpenChange,
}: ResponsiveModalProps) {
	const isDesktop = useMediaQuery("(min-width: 768px)");

	if (isDesktop) {
		return (
			<ResponsiveModalContext.Provider value={{ isDesktop }}>
				<Dialog open={open} onOpenChange={onOpenChange}>
					{children}
				</Dialog>
			</ResponsiveModalContext.Provider>
		);
	}

	return (
		<ResponsiveModalContext.Provider value={{ isDesktop }}>
			<Drawer open={open} onOpenChange={onOpenChange}>
				{children}
			</Drawer>
		</ResponsiveModalContext.Provider>
	);
}

function ResponsiveModalTrigger({
	children,
	asChild,
}: ResponsiveModalTriggerProps) {
	const { isDesktop } = React.useContext(ResponsiveModalContext);

	if (isDesktop) {
		return <DialogTrigger asChild={asChild}>{children}</DialogTrigger>;
	}

	return <DrawerTrigger asChild={asChild}>{children}</DrawerTrigger>;
}

function ResponsiveModalContent({
	children,
	className,
}: ResponsiveModalContentProps) {
	const { isDesktop } = React.useContext(ResponsiveModalContext);

	if (isDesktop) {
		return <DialogContent className={className}>{children}</DialogContent>;
	}

	return <DrawerContent className={className}>{children}</DrawerContent>;
}

function ResponsiveModalHeader({
	children,
	className,
}: ResponsiveModalHeaderProps) {
	const { isDesktop } = React.useContext(ResponsiveModalContext);

	if (isDesktop) {
		return <DialogHeader className={className}>{children}</DialogHeader>;
	}

	return <DrawerHeader className={className}>{children}</DrawerHeader>;
}

function ResponsiveModalTitle({
	children,
	className,
}: ResponsiveModalTitleProps) {
	const { isDesktop } = React.useContext(ResponsiveModalContext);

	if (isDesktop) {
		return <DialogTitle className={className}>{children}</DialogTitle>;
	}

	return <DrawerTitle className={className}>{children}</DrawerTitle>;
}

function ResponsiveModalDescription({
	children,
	className,
}: ResponsiveModalDescriptionProps) {
	const { isDesktop } = React.useContext(ResponsiveModalContext);

	if (isDesktop) {
		return (
			<DialogDescription className={className}>{children}</DialogDescription>
		);
	}

	return (
		<DrawerDescription className={className}>{children}</DrawerDescription>
	);
}

function ResponsiveModalFooter({
	children,
	className,
}: ResponsiveModalFooterProps) {
	const { isDesktop } = React.useContext(ResponsiveModalContext);

	if (isDesktop) {
		return <DialogFooter className={className}>{children}</DialogFooter>;
	}

	return <DrawerFooter className={className}>{children}</DrawerFooter>;
}

interface ResponsiveModalBodyProps {
	children: React.ReactNode;
	className?: string;
}

function ResponsiveModalBody({
	children,
	className,
}: ResponsiveModalBodyProps) {
	const { isDesktop } = React.useContext(ResponsiveModalContext);

	if (isDesktop) {
		return <DialogBody className={className}>{children}</DialogBody>;
	}

	return (
		<div className={cn("flex flex-col gap-4 px-4 pb-4", className)}>
			{children}
		</div>
	);
}

interface ResponsiveModalInsetProps {
	children: React.ReactNode;
	className?: string;
}

function ResponsiveModalInset({
	children,
	className,
}: ResponsiveModalInsetProps) {
	const { isDesktop } = React.useContext(ResponsiveModalContext);

	if (isDesktop) {
		return <DialogInset className={className}>{children}</DialogInset>;
	}

	return (
		<div
			className={cn(
				"flex flex-col gap-6 bg-muted/50 border-y px-4 py-4",
				className,
			)}
		>
			{children}
		</div>
	);
}

function ResponsiveModalClose({
	children,
	asChild,
}: ResponsiveModalCloseProps) {
	const { isDesktop } = React.useContext(ResponsiveModalContext);

	if (isDesktop) {
		return <DialogClose asChild={asChild}>{children}</DialogClose>;
	}

	return <DrawerClose asChild={asChild}>{children}</DrawerClose>;
}

export {
	ResponsiveModal,
	ResponsiveModalBody,
	ResponsiveModalClose,
	ResponsiveModalContent,
	ResponsiveModalDescription,
	ResponsiveModalFooter,
	ResponsiveModalHeader,
	ResponsiveModalInset,
	ResponsiveModalTitle,
	ResponsiveModalTrigger,
};
