/**
 * Company Settings Page
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Users,
  Camera,
  Save,
  Key,
  Bell,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

const companySchema = z.object({
  company_name: z.string().min(2, "Название компании обязательно / Kompaniya nomi majburiy"),
  company_description: z.string().max(2000).optional(),
  company_website: z.string().url("Неверный URL / Noto'g'ri URL").optional().or(z.literal("")),
  company_size: z.string().optional(),
  company_industry: z.string().optional(),
  full_name: z.string().min(2, "Имя контакта обязательно / Kontakt nomi majburiy"),
  email: z.string().email("Неверный email / Noto'g'ri email"),
  phone: z.string().optional(),
  location: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

const companySizes = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501-1000", label: "501-1000 employees" },
  { value: "1000+", label: "1000+ employees" },
];

const industries = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Retail",
  "Media",
  "Consulting",
  "Real Estate",
  "Transportation",
  "Other",
];

export default function CompanySettingsPage() {
  const { locale } = useTranslation();
  const isRu = locale === "ru";
  const { user, updateUser, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("company");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      company_name: user?.company_name || "",
      company_description: user?.company_description || "",
      company_website: user?.company_website || "",
      company_size: user?.company_size || "",
      company_industry: user?.company_industry || "",
      full_name: user?.full_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      location: user?.location || "",
    },
  });

  const onSubmit = async (data: CompanyFormData) => {
    try {
      await updateUser(data);
      toast.success(isRu ? "Настройки успешно обновлены!" : "Sozlamalar muvaffaqiyatli yangilandi!");
    } catch (error) {
      toast.error(isRu ? "Не удалось обновить настройки" : "Sozlamalarni yangilab bo'lmadi");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-white">
          {isRu ? "Настройки компании" : "Kompaniya sozlamalari"}
        </h1>
        <p className="mt-1 text-surface-500">
          {isRu ? "Управляйте профилем компании и аккаунтом" : "Kompaniya profili va akkaunt sozlamalarini boshqaring"}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="company">{isRu ? "Профиль компании" : "Kompaniya profili"}</TabsTrigger>
          <TabsTrigger value="account">{isRu ? "Аккаунт" : "Akkaunt"}</TabsTrigger>
          <TabsTrigger value="notifications">{isRu ? "Уведомления" : "Bildirishnomalar"}</TabsTrigger>
        </TabsList>

        {/* Company Profile Tab */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isRu ? "Информация о компании" : "Kompaniya ma'lumotlari"}</CardTitle>
              <CardDescription>
                {isRu ? "Эта информация будет отображаться в ваших вакансиях" : "Bu ma'lumotlar vakansiyalaringizda ko'rsatiladi"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Logo */}
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900 dark:to-brand-800">
                    {user?.company_logo_url ? (
                      <img
                        src={user.company_logo_url}
                        alt={user.company_name || (isRu ? "Компания" : "Kompaniya")}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <Building2 className="h-10 w-10 text-brand-600" />
                    )}
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      <Camera className="mr-2 h-4 w-4" />
                      {isRu ? "Yuklash" : "Logo yuklash"}
                    </Button>
                    <p className="mt-1 text-xs text-surface-500">
                      {isRu ? "Рекомендуется: 200x200px, PNG или JPG" : "Tavsiya: 200x200px, PNG yoki JPG"}
                    </p>
                  </div>
                </div>

                {/* Company Info */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">{isRu ? "Название компании" : "Kompaniya nomi"}</Label>
                    <Input
                      id="company_name"
                      icon={<Building2 className="h-5 w-5" />}
                      error={errors.company_name?.message}
                      {...register("company_name")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_website">{isRu ? "Veb-sayt" : "Veb-sayt"}</Label>
                    <Input
                      id="company_website"
                      icon={<Globe className="h-5 w-5" />}
                      placeholder="https://yourcompany.com"
                      error={errors.company_website?.message}
                      {...register("company_website")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_size">{isRu ? "Размер компании" : "Kompaniya hajmi"}</Label>
                    <Select
                      value={watch("company_size")}
                      onValueChange={(value) => setValue("company_size", value, { shouldDirty: true })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isRu ? "Выберите размер" : "Hajmni tanlang"} />
                      </SelectTrigger>
                      <SelectContent>
                        {companySizes.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {isRu
                              ? size.label
                                  .replace("employees", "сотрудников")
                                  .replace("employee", "сотрудник")
                              : size.label.replace("employees", "xodim")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_industry">{isRu ? "Отрасль" : "Soha"}</Label>
                    <Select
                      value={watch("company_industry")}
                      onValueChange={(value) => setValue("company_industry", value, { shouldDirty: true })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isRu ? "Выберите отрасль" : "Soha tanlang"} />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {isRu
                              ? ({
                                  Technology: "Технологии",
                                  Finance: "Финансы",
                                  Healthcare: "Здравоохранение",
                                  Education: "Образование",
                                  Manufacturing: "Производство",
                                  Retail: "Розничная торговля",
                                  Media: "Медиа",
                                  Consulting: "Консалтинг",
                                  "Real Estate": "Недвижимость",
                                  Transportation: "Транспорт",
                                  Other: "Другое",
                                } as Record<string, string>)[industry]
                              : ({
                                  Technology: "Texnologiya",
                                  Finance: "Moliya",
                                  Healthcare: "Sog'liqni saqlash",
                                  Education: "Ta'lim",
                                  Manufacturing: "Ishlab chiqarish",
                                  Retail: "Savdo",
                                  Media: "Media",
                                  Consulting: "Konsalting",
                                  "Real Estate": "Ko'chmas mulk",
                                  Transportation: "Transport",
                                  Other: "Boshqa",
                                } as Record<string, string>)[industry]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">{isRu ? "Локация" : "Joylashuv"}</Label>
                    <Input
                      id="location"
                      icon={<MapPin className="h-5 w-5" />}
                      placeholder={isRu ? "Ташкент, Узбекистан" : "Toshkent, O'zbekiston"}
                      error={errors.location?.message}
                      {...register("location")}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="company_description">{isRu ? "О компании" : "Kompaniya haqida"}</Label>
                  <Textarea
                    id="company_description"
                    placeholder={
                      isRu
                        ? "Расскажите кандидатам о компании, культуре и ваших преимуществах..."
                        : "Nomzodlarga kompaniyangiz, madaniyatingiz va ustunliklaringiz haqida yozing..."
                    }
                    className="min-h-[150px]"
                    error={errors.company_description?.message}
                    {...register("company_description")}
                  />
                </div>

                {/* Submit */}
                <div className="flex justify-end">
                  <Button type="submit" disabled={!isDirty} isLoading={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    {isRu ? "Сохранить" : "Saqlash"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isRu ? "Контактная информация" : "Kontakt ma'lumotlari"}</CardTitle>
              <CardDescription>
                {isRu ? "Основной контакт для аккаунта компании" : "Kompaniya akkaunti uchun asosiy kontakt"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">{isRu ? "Kontakt ismi" : "Kontakt nomi"}</Label>
                    <Input
                      id="full_name"
                      error={errors.full_name?.message}
                      {...register("full_name")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      icon={<Mail className="h-5 w-5" />}
                      error={errors.email?.message}
                      {...register("email")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{isRu ? "Телефон" : "Telefon"}</Label>
                    <Input
                      id="phone"
                      icon={<Phone className="h-5 w-5" />}
                      error={errors.phone?.message}
                      {...register("phone")}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={!isDirty} isLoading={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    {isRu ? "Сохранить" : "Saqlash"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isRu ? "Сменить пароль" : "Parolni o'zgartirish"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">{isRu ? "Текущий пароль" : "Joriy parol"}</Label>
                  <Input id="current_password" type="password" icon={<Key className="h-5 w-5" />} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">{isRu ? "Новый пароль" : "Yangi parol"}</Label>
                  <Input id="new_password" type="password" icon={<Key className="h-5 w-5" />} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">{isRu ? "Подтвердите новый пароль" : "Yangi parolni tasdiqlang"}</Label>
                  <Input id="confirm_password" type="password" icon={<Key className="h-5 w-5" />} />
                </div>
                <Button>{isRu ? "Обновить пароль" : "Parolni yangilash"}</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-600">{isRu ? "Опасная зона" : "Xavfli bo'lim"}</CardTitle>
              <CardDescription>
                {isRu ? "Навсегда удалить аккаунт компании" : "Kompaniya akkauntini butunlay o'chirish"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {isRu ? "Удалить аккаунт компании" : "Kompaniya akkauntini o'chirish"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isRu ? "Email уведомления" : "Email bildirishnomalari"}</CardTitle>
              <CardDescription>
                {isRu ? "Настройте, когда получать email уведомления" : "Qachon email bildirishnomalarini olishni sozlang"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  title: isRu ? "Новые заявки" : "Yangi arizalar",
                  description: isRu ? "Уведомлять, когда кто-то откликается на ваши вакансии" : "Vakansiyalarga kimdir ariza yuborsa xabar berish",
                },
                {
                  title: isRu ? "Обновления заявок" : "Ariza yangilanishlari",
                  description: isRu ? "Когда кандидат обновляет или отзывает заявку" : "Nomzodlar arizasini yangilasa yoki bekor qilsa",
                },
                {
                  title: isRu ? "Срок вакансии" : "Vakansiya muddati",
                  description: isRu ? "Напоминания перед истечением срока вакансии" : "Vakansiya muddati tugashidan oldingi eslatmalar",
                },
                {
                  title: isRu ? "Еженедельный отчёт" : "Haftalik hisobot",
                  description: isRu ? "Сводка заявок и просмотров по всем вакансиям" : "Barcha vakansiyalar bo'yicha ariza va ko'rishlar xulosasi",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 border-b border-surface-200 dark:border-surface-700 last:border-0"
                >
                  <div>
                    <p className="font-medium text-surface-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="text-sm text-surface-500">{item.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
















