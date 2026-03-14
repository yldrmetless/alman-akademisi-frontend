"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetCourseListQuery, type Course } from "@/lib/features/course/courseApi";
import { Loader2, MapPin, MonitorPlay } from "lucide-react";
import Link from "next/link";

const turkishDateFormatter = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
});

const turkishWeekdayFormatter = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
});

const normalizeWeekday = (value: string) => {
    if (!value) return "";
    return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatStartDate = (dateValue?: string) => {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";
    return turkishDateFormatter.format(date);
};

const resolveDayLabel = (dayValue?: string, dateValue?: string) => {
    if (dayValue && dayValue.trim()) return dayValue.trim();
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";
    return normalizeWeekday(turkishWeekdayFormatter.format(date));
};

const LEVEL_SLUG_MAP: Record<string, string> = {
    A1: "a1-almanca-kursu",
    A2: "a2-almanca-kursu",
    B1: "b1-almanca-kursu",
    B2: "b2-almanca-kursu",
    C1: "c1-almanca-kursu",
    C2: "c2-almanca-kursu",
    SPECIAL: "almanca-ozel-ders",
};

const buildCourseDetailPath = (course: Course) => {
    const normalizedLevel = (course.level || "").trim().toUpperCase();
    const mappedSlug = LEVEL_SLUG_MAP[normalizedLevel];
    const levelSlug = mappedSlug || `${normalizedLevel.toLowerCase()}-almanca-kursu`;
    return `/kurslar/${levelSlug}/${course.id}`;
};

const getCourseStatus = (course: Course) => {
    const quota = Number(course.quota ?? 0);
    const registered = Number(course.registered ?? course.registered_students ?? 0);
    const remaining = Math.max(0, quota - registered);

    if (remaining <= 0) {
        return {
            text: "Kontenjan Doldu",
            badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
            isFull: true,
        };
    }

    if (remaining <= 3) {
        return {
            text: `Son ${remaining} Kişilik Yer`,
            badgeClass: "bg-red-50 text-red-700 border-red-200",
            isFull: false,
        };
    }

    return {
        text: "Kayıtlar Başladı",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        isFull: false,
    };
};

type CourseColumnProps = {
    courses: Course[];
    isLoading: boolean;
    title: string;
    icon: "online" | "offline";
};

function CourseColumn({ courses, isLoading, title, icon }: CourseColumnProps) {
    const isOnline = icon === "online";

    return (
        <div className="space-y-6">
            <h3 className="flex items-center text-xl font-bold text-slate-800">
                {isOnline ? (
                    <MonitorPlay className="w-6 h-6 mr-2 text-primary" />
                ) : (
                    <MapPin className="w-6 h-6 mr-2 text-secondary" />
                )}
                {title}
            </h3>

            {isLoading ? (
                <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            ) : courses.length === 0 ? (
                <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-center text-sm text-slate-500">
                    Şu anda listelenecek uygun kurs bulunamadı.
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {courses.map((course) => {
                        const status = getCourseStatus(course);
                        const scheduleInfo = `${formatStartDate(course.start_date)} • ${resolveDayLabel(course.first_day, course.start_date)} - ${resolveDayLabel(course.last_day, course.end_date)}`;
                        const level = course.level || "-";

                        return (
                            <Card
                                key={course.id}
                                className={`overflow-hidden border-2 border-transparent transition-colors ${isOnline ? "hover:border-primary/20" : "hover:border-secondary/20"}`}
                            >
                                <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                                    <div
                                        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold ${isOnline ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}
                                    >
                                        {level}
                                    </div>

                                    <div className="flex-1 text-center sm:text-left">
                                        <h4 className="font-bold text-lg">{course.name}</h4>
                                        <p className="text-sm text-muted-foreground">{scheduleInfo}</p>
                                    </div>

                                    <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
                                        <Badge variant="outline" className={`border ${status.badgeClass}`}>
                                            {status.text}
                                        </Badge>
                                        {status.isFull ? (
                                            <Button
                                                variant={isOnline ? "default" : "secondary"}
                                                disabled
                                                className={`w-full sm:w-auto ${isOnline ? "" : "text-white"}`}
                                            >
                                                Doldu
                                            </Button>
                                        ) : (
                                            <Button
                                                asChild
                                                variant={isOnline ? "default" : "secondary"}
                                                className={`w-full sm:w-auto ${isOnline ? "" : "text-white"}`}
                                            >
                                                <Link href={buildCourseDetailPath(course)}>
                                                    Hemen Başvur
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export function CourseScheduleSection() {
    const {
        data: onlineCourseResponse,
        isLoading: isOnlineLoading,
        isFetching: isOnlineFetching,
    } = useGetCourseListQuery({
        type: "online",
        available: true,
    });

    const {
        data: offlineCourseResponse,
        isLoading: isOfflineLoading,
        isFetching: isOfflineFetching,
    } = useGetCourseListQuery({
        type: "offline",
        available: true,
    });

    const onlineCourses = (onlineCourseResponse?.results || []).slice(0, 3);
    const offlineCourses = (offlineCourseResponse?.results || []).slice(0, 3);

    return (
        <section className="py-16 md:py-24 bg-slate-50">
            <div className="container mx-auto px-4 md:px-6">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl mb-4">
                        Gelecek Kurs Dönemleri
                    </h2>
                    <p className="text-muted-foreground">
                        Hedefinize uygun kursu seçin ve Almanca yolculuğunuza bugün başlayın.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                    <CourseColumn
                        courses={onlineCourses}
                        isLoading={isOnlineLoading || isOnlineFetching}
                        title="Online Almanca Kursları"
                        icon="online"
                    />
                    <CourseColumn
                        courses={offlineCourses}
                        isLoading={isOfflineLoading || isOfflineFetching}
                        title="Yüz Yüze Kurslar (Samsun)"
                        icon="offline"
                    />
                </div>
            </div>
        </section>
    );
}
