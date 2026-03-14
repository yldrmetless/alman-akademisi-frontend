"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useUpdateCategoryMutation } from "@/lib/features/blog/blogApi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "react-hot-toast";

const categoryUpdateSchema = z.object({
    name: z.string()
        .min(2, "Kategori adı en az 2 karakter olmalıdır.")
        .max(50, "Kategori adı en fazla 50 karakter olabilir."),
});

interface UpdateCategoryModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    editingCategory: { id: number | string; name: string } | null;
}

export function UpdateCategoryModal({ isOpen, onOpenChange, editingCategory }: UpdateCategoryModalProps) {
    const router = useRouter();
    const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

    const form = useForm<z.infer<typeof categoryUpdateSchema>>({
        resolver: zodResolver(categoryUpdateSchema),
        defaultValues: { name: "" },
    });

    useEffect(() => {
        if (editingCategory && isOpen) {
            form.reset({ name: editingCategory.name });
        }
    }, [editingCategory, isOpen, form]);

    const handleSuccess = async (values: z.infer<typeof categoryUpdateSchema>) => {
        if (!editingCategory) return;
        try {
            const res = await updateCategory({
                id: editingCategory.id,
                ...values
            }).unwrap();

            toast.success(res?.message || "Kategori başarıyla güncellendi.");
            onOpenChange(false);
            router.refresh();
        } catch (error: any) {
            if (error?.data?.name) {
                toast.error(`Hata: ${error.data.name[0]}`);
            } else {
                toast.error("Kategori güncellenirken hata meydana geldi.");
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Kategoriyi Düzenle</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSuccess)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Kategori Adı</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Örn: Almanca, Gramer..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={isUpdating}
                                className="cursor-pointer bg-[#1A3EB1] hover:bg-[#15308A] text-white"
                            >
                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Güncelle
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
