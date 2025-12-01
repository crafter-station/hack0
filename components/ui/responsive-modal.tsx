"use client";

import * as React from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";

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

function ResponsiveModal({ children, open, onOpenChange }: ResponsiveModalProps) {
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

function ResponsiveModalTrigger({ children, asChild }: ResponsiveModalTriggerProps) {
  const { isDesktop } = React.useContext(ResponsiveModalContext);

  if (isDesktop) {
    return <DialogTrigger asChild={asChild}>{children}</DialogTrigger>;
  }

  return <DrawerTrigger asChild={asChild}>{children}</DrawerTrigger>;
}

function ResponsiveModalContent({ children, className }: ResponsiveModalContentProps) {
  const { isDesktop } = React.useContext(ResponsiveModalContext);

  if (isDesktop) {
    return <DialogContent className={className}>{children}</DialogContent>;
  }

  return <DrawerContent className={className}>{children}</DrawerContent>;
}

function ResponsiveModalHeader({ children, className }: ResponsiveModalHeaderProps) {
  const { isDesktop } = React.useContext(ResponsiveModalContext);

  if (isDesktop) {
    return <DialogHeader className={className}>{children}</DialogHeader>;
  }

  return <DrawerHeader className={className}>{children}</DrawerHeader>;
}

function ResponsiveModalTitle({ children, className }: ResponsiveModalTitleProps) {
  const { isDesktop } = React.useContext(ResponsiveModalContext);

  if (isDesktop) {
    return <DialogTitle className={className}>{children}</DialogTitle>;
  }

  return <DrawerTitle className={className}>{children}</DrawerTitle>;
}

function ResponsiveModalDescription({ children, className }: ResponsiveModalDescriptionProps) {
  const { isDesktop } = React.useContext(ResponsiveModalContext);

  if (isDesktop) {
    return <DialogDescription className={className}>{children}</DialogDescription>;
  }

  return <DrawerDescription className={className}>{children}</DrawerDescription>;
}

function ResponsiveModalFooter({ children, className }: ResponsiveModalFooterProps) {
  const { isDesktop } = React.useContext(ResponsiveModalContext);

  if (isDesktop) {
    return <DialogFooter className={className}>{children}</DialogFooter>;
  }

  return <DrawerFooter className={className}>{children}</DrawerFooter>;
}

function ResponsiveModalClose({ children, asChild }: ResponsiveModalCloseProps) {
  const { isDesktop } = React.useContext(ResponsiveModalContext);

  if (isDesktop) {
    return <DialogClose asChild={asChild}>{children}</DialogClose>;
  }

  return <DrawerClose asChild={asChild}>{children}</DrawerClose>;
}

export {
  ResponsiveModal,
  ResponsiveModalTrigger,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalClose,
};
