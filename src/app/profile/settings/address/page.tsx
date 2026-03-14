"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Loader2,
    Plus,
    PenLine,
    Trash2,
    ShieldCheck,
    MapPin,
} from "lucide-react";
import { StudentSidebar } from "@/components/profile/StudentSidebar";
import {
    useGetAddressQuery,
    useCreateAddressMutation,
    useUpdateAddressMutation,
    useDeleteAddressMutation,
    type UserAddress,
} from "@/lib/features/auth/authApi";
import toast from "react-hot-toast";
import { z } from "zod";

const addressSchema = z.object({
    address_data: z.object({
        city: z.string().min(1, "İl alanı zorunludur"),
        district: z.string().min(1, "İlçe alanı zorunludur"),
        neighborhood: z.string().min(1, "Mahalle alanı zorunludur"),
        full_address: z.string().min(1, "Adres detayı zorunludur"),
        zip_code: z.string().min(1, "Posta kodu zorunludur"),
        first_name: z.string().min(1, "Ad zorunludur"),
        last_name: z.string().min(1, "Soyad zorunludur"),
        phone: z.string().min(1, "Telefon zorunludur"),
        address_title: z.string().min(1, "Adres başlığı zorunludur")
    })
});

// Turkish city list (top cities for quick implementation)
const CITY_OPTIONS = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya",
    "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik",
    "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum",
    "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir",
    "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul",
    "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale",
    "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa",
    "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye",
    "Rize", "Sakarya", "Samsun", "Şanlıurfa", "Siirt", "Sinop", "Sivas", "Şırnak",
    "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak",
];

interface AddressFormData {
    address_title: string;
    first_name: string;
    last_name: string;
    phone: string;
    city: string;
    district: string;
    neighborhood: string;
    zip_code: string;
    full_address: string;
}

const EMPTY_FORM: AddressFormData = {
    address_title: "",
    first_name: "",
    last_name: "",
    phone: "",
    city: "",
    district: "",
    neighborhood: "",
    zip_code: "",
    full_address: "",
};

export default function AddressPage() {
    const { data: addressListData, isLoading: isAddressLoading } = useGetAddressQuery();
    const [createAddress, { isLoading: isCreating }] = useCreateAddressMutation();
    const [updateAddress, { isLoading: isUpdating }] = useUpdateAddressMutation();
    const [deleteAddress, { isLoading: isDeleting }] = useDeleteAddressMutation();

    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
    const [formData, setFormData] = useState<AddressFormData>(EMPTY_FORM);
    
    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingAddressId, setDeletingAddressId] = useState<number | null>(null);

    const savedAddress = addressListData?.address_data;
    // Check if address is fully empty or undefined
    const isAddressEmpty = !savedAddress || Object.keys(savedAddress).length === 0;
    const isSaving = isCreating || isUpdating;

    // Auto-show form if no addresses exist
    useEffect(() => {
        if (!isAddressLoading && isAddressEmpty) {
            setIsFormVisible(true);
        }
    }, [isAddressLoading, isAddressEmpty]);

    const handleInputChange = (field: keyof AddressFormData, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleNewAddressClick = () => {
        setFormData(EMPTY_FORM);
        setIsEditingAddress(false);
        setEditingAddressId(null);
        setIsFormVisible(true);
    };

    const handleEditClick = (address: UserAddress) => {
        setFormData({ ...address });
        setIsEditingAddress(true);
        setEditingAddressId(addressListData?.id || 1); 
        setIsFormVisible(true);
    };

    const handleCancelForm = () => {
        setFormData(EMPTY_FORM);
        setIsFormVisible(false);
        setIsEditingAddress(false);
        setEditingAddressId(null);
    };

    const handleDeleteClick = (addressId: number) => {
        setDeletingAddressId(addressId);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingAddressId) return;

        try {
            await deleteAddress(deletingAddressId).unwrap();
            toast.success("Adres başarıyla silindi.");
            setIsDeleteModalOpen(false);
            window.location.reload();
        } catch {
            toast.error("Adres silinemedi. Lütfen tekrar deneyin.");
        } finally {
            setDeletingAddressId(null);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Validate via Zod schema which enforces nested structure
            const validatedPayload = addressSchema.parse({ address_data: formData });

            if (isEditingAddress && editingAddressId) {
                await updateAddress({ 
                    id: editingAddressId, 
                    addressData: validatedPayload.address_data 
                }).unwrap();
                toast.success("Address updated successfully.");
                window.location.reload();
            } else {
                await createAddress(validatedPayload.address_data).unwrap();
                toast.success("Adres başarıyla oluşturuldu.");
                window.location.reload();
            }
            handleCancelForm();
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                toast.error((error as any).errors[0].message);
            } else {
                const apiError = error as { data?: { detail?: string; message?: string } };
                toast.error(apiError?.data?.detail || apiError?.data?.message || "Invalid format. Update failed.");
            }
        }
    };

    return (
        <StudentSidebar>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
                <Link href="/profile" className="hover:text-slate-600 transition-colors">Profil</Link>
                <span>›</span>
                <Link href="/profile/settings/account" className="hover:text-slate-600 transition-colors">Ayarlar</Link>
                <span>›</span>
                <span className="text-slate-700 font-medium">Adres</span>
            </div>

            {/* Page Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">Adres</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Kayıtlı adreslerinizi buradan yönetebilir, yeni adres ekleyebilir veya varsayılan adresinizi belirleyebilirsiniz.
                </p>
            </div>

            {/* ===================== SAVED ADDRESSES CARD ===================== */}
            <Card className="rounded-2xl border-slate-100 shadow-sm">
                <CardContent className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-800">Kayıtlı Adreslerim</h2>
                        <Button
                            onClick={handleNewAddressClick}
                            className="rounded-xl px-4 h-10 text-sm font-semibold bg-[#1A3EB1] hover:bg-[#1A3EB1]/90 text-white transition-all"
                        >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Yeni Adres Ekle
                        </Button>
                    </div>

                    {/* Empty State Fallback (If form logic somehow closes, this shows up but the card is hidden for empty states essentially) */}
                    {isAddressLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-[#1A3EB1]" />
                        </div>
                    ) : isAddressEmpty ? null : (
                        <div className="space-y-4">
                            <div className="border border-[#1A3EB1]/15 bg-[#1A3EB1]/[0.02] rounded-xl p-5 relative">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        {/* Title */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-base font-bold text-slate-800">{savedAddress.address_title}</h3>
                                        </div>

                                        {/* Address Details */}
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-slate-700">{savedAddress.first_name} {savedAddress.last_name}</p>
                                            <p className="text-sm text-slate-500">{savedAddress.phone}</p>
                                            <p className="text-sm text-slate-500">
                                                {savedAddress.city}{savedAddress.district ? ` / ${savedAddress.district}` : ""} - {savedAddress.zip_code || ""}
                                            </p>
                                            <p className="text-sm text-slate-500">{savedAddress.neighborhood} Mah. {savedAddress.full_address}</p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex sm:flex-col gap-2 shrink-0">
                                        <button
                                            onClick={() => handleEditClick(savedAddress)}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all"
                                        >
                                            <PenLine className="h-3.5 w-3.5" />
                                            Düzenle
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(addressListData?.id || 1)}
                                            disabled={isDeleting && deletingAddressId === (addressListData?.id || 1)}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                                        >
                                            {isDeleting && deletingAddressId === 1 ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                            Sil
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ===================== ADDRESS FORM CARD ===================== */}
            {isFormVisible && (
                <Card className="rounded-2xl border-slate-100 shadow-sm">
                    <CardContent className="p-6 sm:p-8">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-slate-800">
                                {isEditingAddress ? "Adresi Düzenle" : "Yeni Adres Ekle"}
                            </h2>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-6">
                            {/* Address Title */}
                            <div>
                                <label htmlFor="addressTitle" className="text-sm font-semibold text-slate-700 block mb-1.5">
                                    Adres Başlığı
                                </label>
                                <input
                                    id="addressTitle"
                                    type="text"
                                    value={formData.address_title}
                                    onChange={(e) => handleInputChange("address_title", e.target.value)}
                                    placeholder="Örn: Ev, İş, Diğer"
                                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3EB1] focus-visible:ring-offset-0 transition-all"
                                />
                            </div>

                            {/* Full Name */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="firstName" className="text-sm font-semibold text-slate-700 block mb-1.5">
                                        Ad
                                    </label>
                                    <input
                                        id="firstName"
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => handleInputChange("first_name", e.target.value)}
                                        placeholder="Adınız"
                                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3EB1] focus-visible:ring-offset-0 transition-all"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="lastName" className="text-sm font-semibold text-slate-700 block mb-1.5">
                                        Soyad
                                    </label>
                                    <input
                                        id="lastName"
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => handleInputChange("last_name", e.target.value)}
                                        placeholder="Soyadınız"
                                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3EB1] focus-visible:ring-offset-0 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Phone + City/District */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="phoneNumber" className="text-sm font-semibold text-slate-700 block mb-1.5">
                                        Telefon Numarası
                                    </label>
                                    <input
                                        id="phoneNumber"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange("phone", e.target.value)}
                                        placeholder="+90"
                                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3EB1] focus-visible:ring-offset-0 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 block mb-1.5">
                                        İl / İlçe
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            value={formData.city}
                                            onChange={(e) => handleInputChange("city", e.target.value)}
                                            className="flex-1 h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3EB1] focus-visible:ring-offset-0 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">İl Seçiniz</option>
                                            {CITY_OPTIONS.map((city) => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            value={formData.district}
                                            onChange={(e) => handleInputChange("district", e.target.value)}
                                            placeholder="İlçe Seçiniz"
                                            className="flex-1 h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3EB1] focus-visible:ring-offset-0 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Neighborhood + Zip Code */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="neighborhood" className="text-sm font-semibold text-slate-700 block mb-1.5">
                                        Mahalle / Semt
                                    </label>
                                    <input
                                        id="neighborhood"
                                        type="text"
                                        value={formData.neighborhood}
                                        onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                                        placeholder="Mahalle veya Semt adını giriniz"
                                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3EB1] focus-visible:ring-offset-0 transition-all"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="zipCode" className="text-sm font-semibold text-slate-700 block mb-1.5">
                                        Posta Kodu
                                    </label>
                                    <input
                                        id="zipCode"
                                        type="text"
                                        value={formData.zip_code || ""}
                                        onChange={(e) => handleInputChange("zip_code", e.target.value)}
                                        placeholder="Örn: 27000"
                                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3EB1] focus-visible:ring-offset-0 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Address Detail */}
                            <div>
                                <label htmlFor="addressDetail" className="text-sm font-semibold text-slate-700 block mb-1.5">
                                    Açık Adres
                                </label>
                                <textarea
                                    id="addressDetail"
                                    value={formData.full_address}
                                    onChange={(e) => handleInputChange("full_address", e.target.value)}
                                    placeholder="Sokak, kapı no, daire no vb. detayları belirtiniz"
                                    rows={3}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3EB1] focus-visible:ring-offset-0 resize-none transition-all"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-4 pt-2">
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="rounded-xl px-6 h-11 text-sm font-semibold bg-[#1A3EB1] hover:bg-[#1A3EB1]/90 text-white transition-all"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Kaydediliyor...
                                        </>
                                    ) : (
                                        "Adresi Kaydet"
                                    )}
                                </Button>
                                <button
                                    type="button"
                                    onClick={handleCancelForm}
                                    className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                    İptal
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* ===================== INFO BOX ===================== */}
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="h-10 w-10 rounded-full bg-[#1A3EB1]/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5 text-[#1A3EB1]" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1">Adres Bilgilendirmesi</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Adres bilgileriniz KVKK kapsamında güvenli sunucularımızda şifrelenmiş olarak saklanmaktadır.
                        Kayıtlı adresleriniz, sipariş işlemlerinizi hızlandırmak ve fatura süreçlerinizi doğru yönetmek
                        için kullanılmaktadır. İstediğiniz zaman bu bilgileri güncelleyebilir veya silebilirsiniz.
                    </p>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900">Adresi Sil</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-slate-600 text-sm">
                            Bu adresi silmek istediğinize emin misiniz?
                        </p>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="border-slate-200 text-slate-600 hover:bg-slate-50"
                            disabled={isDeleting}
                        >
                            İptal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Siliniyor...
                                </>
                            ) : (
                                "Evet"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </StudentSidebar>
    );
}
