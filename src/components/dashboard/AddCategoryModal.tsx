"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { useCreateCategoryMutation } from "@/lib/features/blog/blogApi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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

const categorySchema = z.object({
    name: z.string()
        .min(2, "Kategori adı en az 2 karakter olmalıdır.")
        .max(50, "Kategori adı en fazla 50 karakter olabilir."),
});

export function AddCategoryModal() {
    const router = useRouter();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();

    const form = useForm<z.infer<typeof categorySchema>>({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: "" },
    });

    const onSubmit = async (values: z.infer<typeof categorySchema>) => {
        try {
            await createCategory({ name: values.name }).unwrap();
            toast.success("Kategori başarıyla oluşturuldu.");
            form.reset();
            setIsCreateModalOpen(false);
            router.refresh();
        } catch (error) {
            toast.error("Kategori oluşturulurken hata meydana geldi.");
        }
    };

    return (
        <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
            setIsCreateModalOpen(open);
            if (!open) form.reset();
        }}>
            <DialogTrigger asChild>
                <Button className="cursor-pointer bg-[#1A3EB1] hover:bg-[#15308A] text-white">
                    <Plus className="mr-2 h-4 w-4" /> Yeni Kategori Ekle
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Yeni Kategori Ekle</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
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
                            <Button type="submit" disabled={isCreating} className="cursor-pointer bg-[#1A3EB1] hover:bg-[#15308A] text-white">
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Kaydet
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
