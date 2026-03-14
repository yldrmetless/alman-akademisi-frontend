import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RefundModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
}

export function RefundModal({ isOpen, onClose, onConfirm, isLoading }: RefundModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-slate-900">İade Onayı</DialogTitle>
                    <DialogDescription className="text-slate-600">
                        İadeyi onaylıyor musunuz?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    >
                        İptal
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {isLoading ? "İşleniyor..." : "Evet"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
