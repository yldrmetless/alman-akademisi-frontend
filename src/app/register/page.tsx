"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Lock, User, AtSign, RotateCcw, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRegisterMutation } from "@/lib/features/auth/authApi";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Form Validation Schema
const registerSchema = z.object({
    first_name: z.string().min(2, { message: "Ad en az 2 karakter olmalıdır." }),
    last_name: z.string().min(2, { message: "Soyad en az 2 karakter olmalıdır." }),
    email: z.string().email({ message: "Geçerli bir e-posta adresi giriniz." }),
    username: z.string().min(3, { message: "Kullanıcı adı en az 3 karakter olmalıdır." }),
    password: z.string().min(8, { message: "Şifre en az 8 karakter olmalıdır." }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["confirmPassword"],
});

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [register, { isLoading }] = useRegisterMutation();
    const router = useRouter();

    // Initialize React Hook Form
    const form = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            first_name: "",
            last_name: "",
            email: "",
            username: "",
            password: "",
            confirmPassword: "",
        },
    });

    const passwordValue = form.watch("password");

    // Simple password strength calculation
    const calculateStrength = (pass: string) => {
        let score = 0;
        if (!pass) return 0;
        if (pass.length > 8) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;
        return score; // Max 4
    };

    const strengthScore = calculateStrength(passwordValue);

    const onSubmit = async (values: z.infer<typeof registerSchema>) => {
        try {
            const res = await register({
                first_name: values.first_name,
                last_name: values.last_name,
                username: values.username,
                email: values.email,
                password: values.password,
                password_confirm: values.confirmPassword,
            }).unwrap();

            toast.success(res?.message || "Kayıt başarılı!");
            router.push("/login");
        } catch (err: any) {
            console.error("Register Error:", err);

            // Accommodate RTK parsing errors misfiring on a 201 created status.
            if (err?.status === 201 || err?.originalStatus === 201) {
                toast.success("Kayıt başarılı!");
                router.push("/login");
            } else {
                toast.error(err?.data?.message || err?.data?.detail || "Bir hata oluştu");
            }
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#FAFBFF] flex flex-col items-center justify-center p-4">
            {/* Register Card */}
            <Card className="w-full max-w-[450px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-none px-4 py-6 sm:px-8 sm:py-10">
                <CardHeader className="flex flex-col items-center p-0 mb-8 space-y-4">
                    <div>
                        <Link href="/">
                            <Image
                                src="/logo.webp"
                                alt="Alman Akademisi Logo"
                                width={200}
                                height={100}
                                className="h-32 w-auto object-contain"
                                priority
                            />
                        </Link>
                    </div>

                    <div className="text-center -mt-10">
                        <h1 className="text-xl font-bold text-slate-800 mb-1">Hesap Oluştur</h1>
                        <p className="text-sm text-slate-400">
                            Hemen kayıt olun ve öğrenmeye başlayın.
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                            {/* Name Fields Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* First Name Field */}
                                <FormField
                                    control={form.control}
                                    name="first_name"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                AD
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                                        <User className="h-4 w-4 text-slate-400" />
                                                    </div>
                                                    <Input
                                                        type="text"
                                                        placeholder="John"
                                                        className="pl-10 h-11 rounded-xl bg-transparent border-slate-200 focus-visible:ring-[#1A3EB1]/20 focus-visible:border-[#1A3EB1] text-sm"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />

                                {/* Last Name Field */}
                                <FormField
                                    control={form.control}
                                    name="last_name"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                SOYAD
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                                        <User className="h-4 w-4 text-slate-400" />
                                                    </div>
                                                    <Input
                                                        type="text"
                                                        placeholder="Doe"
                                                        className="pl-10 h-11 rounded-xl bg-transparent border-slate-200 focus-visible:ring-[#1A3EB1]/20 focus-visible:border-[#1A3EB1] text-sm"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Email Field */}
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                            E-POSTA ADRESİ
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                                    <Mail className="h-4 w-4 text-slate-400" />
                                                </div>
                                                <Input
                                                    type="email"
                                                    placeholder="ornek@email.com"
                                                    className="pl-10 h-11 rounded-xl bg-transparent border-slate-200 focus-visible:ring-[#1A3EB1]/20 focus-visible:border-[#1A3EB1] text-sm"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            {/* Username Field */}
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                            KULLANICI ADI
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                                    <AtSign className="h-4 w-4 text-slate-400" />
                                                </div>
                                                <Input
                                                    type="text"
                                                    placeholder="kullaniciadi"
                                                    className="pl-10 h-11 rounded-xl bg-transparent border-slate-200 focus-visible:ring-[#1A3EB1]/20 focus-visible:border-[#1A3EB1] text-sm"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            {/* Password Field */}
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                            ŞİFRE
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                                    <Lock className="h-4 w-4 text-slate-400" />
                                                </div>
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    className="pl-10 pr-10 h-11 rounded-xl bg-transparent border-slate-200 focus-visible:ring-[#1A3EB1]/20 focus-visible:border-[#1A3EB1] text-sm"
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </FormControl>

                                        {/* Password Strength Meter */}
                                        <div className="pt-1">
                                            <div className="flex gap-1 h-1">
                                                {[1, 2, 3, 4].map((step) => (
                                                    <div
                                                        key={step}
                                                        className={`flex-1 rounded-full ${strengthScore >= step ? 'bg-[#1A3EB1]' : 'bg-slate-100'}`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1">Şifreniz en az 8 karakterden oluşmalıdır.</p>
                                        </div>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            {/* Confirm Password Field */}
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                            ŞİFRE (TEKRAR)
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                                    <RotateCcw className="h-4 w-4 text-slate-400" />
                                                </div>
                                                <Input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    className="pl-10 pr-10 h-11 rounded-xl bg-transparent border-slate-200 focus-visible:ring-[#1A3EB1]/20 focus-visible:border-[#1A3EB1] text-sm"
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                                                >
                                                    {showConfirmPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            <div className="pt-2">
                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-11 bg-[#1A3EB1] hover:bg-[#1A3EB1]/90 text-white rounded-xl font-bold text-sm shadow-sm transition-all shadow-[#1A3EB1]/20"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Kayıt Olunuyor...
                                        </>
                                    ) : (
                                        "Kayıt Ol"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* Footer Links & Login */}
            <div className="mt-6 text-center space-y-5">
                <p className="text-xs text-slate-500">
                    Zaten hesabınız var mı?{" "}
                    <Link href="/login" className="font-bold text-[#1A3EB1] hover:underline">
                        Giriş Yap
                    </Link>
                </p>

                <div className="flex items-center justify-center gap-6 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    <Link href="#" className="hover:text-slate-600 transition-colors">
                        Hakkımızda
                    </Link>
                    <Link href="#" className="hover:text-slate-600 transition-colors">
                        Gizlilik
                    </Link>
                    <Link href="#" className="hover:text-slate-600 transition-colors">
                        Yardım
                    </Link>
                </div>
            </div>
        </div>
    );
}
