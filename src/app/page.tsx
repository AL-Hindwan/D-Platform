"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  Layers3,
  Menu,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  Users,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PublicService, type CategoryData, type FeaturedCourse, type PlatformStats } from "@/lib/public-service"
import { getFileUrl } from "@/lib/utils"
import { PLATFORM_NAME } from "@/lib/brand"
import { usePlatform } from "@/contexts/platform-context"

type NavItem = { href: string; label: string }

const navItems: NavItem[] = [
  { href: "/courses", label: "الدورات" },
  { href: "#categories", label: "التصنيفات" },
  { href: "/institutes", label: "المعاهد" },
  { href: "/auth/register?role=trainer", label: "للمدربين" },
]

const whyItems = [
  {
    title: "تعلم حضوري وأونلاين",
    description: "اختر الأسلوب المناسب لك بين الجلسات الحضورية المباشرة والتعلم عن بُعد.",
    icon: CalendarClock,
  },
  {
    title: "مدربون ومعاهد موثوقة",
    description: "كل دورة تُدار عبر جهات موثقة لضمان جودة المحتوى وتجربة التعلم.",
    icon: UserCheck,
  },
  {
    title: "تسجيل ودفع ومتابعة بسهولة",
    description: "نظام واضح لإرسال الطلبات، متابعة القبول، وإدارة عمليات الدفع.",
    icon: ShieldCheck,
  },
  {
    title: "واجهة عربية مصممة لك",
    description: "تجربة عربية RTL متكاملة تسهّل عليك الوصول لكل ما تحتاجه بسرعة.",
    icon: Sparkles,
  },
]

const steps = [
  { id: 1, title: "اختر الدورة المناسبة", desc: "ابحث حسب المجال، المستوى، ونمط التدريب." },
  { id: 2, title: "أرسل طلب التسجيل", desc: "قدّم طلبك للدورة وتابع حالة القبول من حسابك." },
  { id: 3, title: "ابدأ التعلم والمتابعة", desc: "احضر الجلسات وتابع تقدمك خطوة بخطوة." },
]

const testimonials = [
  {
    name: "سارة أحمد",
    role: "طالبة - مسار البرمجة",
    text: "المنصة مرتبة جدًا وسهلة. قدرت أختار دورة مناسبة وانتهيت منها بثقة.",
  },
  {
    name: "محمد علي",
    role: "طالب - تحليل البيانات",
    text: "المحتوى قوي والمتابعة ممتازة، خصوصًا وضوح مواعيد الجلسات والتسجيل.",
  },
  {
    name: "نور خالد",
    role: "طالبة - التصميم",
    text: "أفضل تجربة عربية للتعلم حتى الآن. كل شيء واضح من البداية للنهاية.",
  },
]

function categoryIcon(name: string) {
  const key = name.toLowerCase()
  if (key.includes("برم") || key.includes("program")) return BookOpen
  if (key.includes("تصميم") || key.includes("design")) return Sparkles
  if (key.includes("إدارة") || key.includes("business")) return Layers3
  if (key.includes("لغة") || key.includes("language")) return GraduationCap
  if (key.includes("بيانات") || key.includes("data")) return Building2
  return Star
}

function imageOrFallback(src?: string | null) {
  const url = src ? getFileUrl(src) : null
  return url || "/images/course-placeholder.png"
}

function LandingHeader() {
  const [open, setOpen] = useState(false)
  const { settings } = usePlatform()
  const siteName = settings?.general.siteName || PLATFORM_NAME

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 shadow-sm backdrop-blur-md" dir="rtl">
      <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="relative h-9 w-9">
              <Image src="/images/logo.png" alt={siteName} fill className="object-contain" />
            </span>
            <span className="text-xl font-extrabold text-[#2563EB]">{siteName}</span>
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-semibold text-slate-700 transition-colors hover:text-[#2563EB]">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" className="h-10 rounded-[6.5px] text-slate-700 hover:bg-slate-100">
            <Link href="/auth/login">تسجيل الدخول</Link>
          </Button>
          <Button asChild className="h-10 rounded-[6.5px] bg-[#2563EB] text-white hover:bg-[#1d4ed8]">
            <Link href="/auth/register">إنشاء حساب</Link>
          </Button>
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="القائمة">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-semibold text-slate-700">
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              <Button asChild variant="outline" className="h-10 flex-1 rounded-[6.5px]">
                <Link href="/auth/login">تسجيل الدخول</Link>
              </Button>
              <Button asChild className="h-10 flex-1 rounded-[6.5px] bg-[#2563EB] text-white">
                <Link href="/auth/register">إنشاء حساب</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function HeroSection() {
  const { settings } = usePlatform()
  const siteName = settings?.general.siteName || PLATFORM_NAME

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-white via-[#F8FBFF] to-[#EEF6FF] pt-8 pb-10 md:pt-10 md:pb-14" dir="rtl">
      <style jsx global>{`
        @keyframes dal-hero-rise {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes dal-hero-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .dal-hero-animate,
          .dal-hero-float {
            animation: none !important;
          }
        }
      `}</style>

      <div className="absolute left-[8%] top-20 -z-10 h-64 w-64 rounded-full bg-blue-300/25 blur-3xl" />
      <div className="absolute right-0 top-0 -z-10 h-48 w-48 rounded-full bg-cyan-200/20 blur-3xl" />

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 px-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
        <div className="text-right dal-hero-animate [animation:dal-hero-rise_650ms_ease-out_both]">
          <h1 className="max-w-3xl text-[2.35rem] font-extrabold leading-[1.2] text-slate-950 sm:text-5xl lg:text-[3.35rem]">
            {siteName} تجمع التعليم، التدريب، والمعاهد في{" "}
            <span className="bg-gradient-to-l from-[#2563EB] via-[#0EA5E9] to-[#1D4ED8] bg-clip-text text-transparent">
              مكان واحد
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
            اكتشف دورات موثوقة، سجّل بسهولة، وتابع رحلتك التعليمية من لوحة واحدة.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild className="h-12 rounded-[6.5px] bg-[#2563EB] px-7 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-[#1d4ed8]">
              <Link href="/courses" className="inline-flex items-center gap-2">
                ابدأ كطالب
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-[6.5px] border-[#2563EB] bg-white px-7 text-base font-bold text-[#2563EB] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-50">
              <Link href="/auth/register" className="inline-flex items-center gap-2">
                انضم كمدرب أو معهد
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto h-[410px] w-full max-w-[590px] sm:h-[470px] lg:h-[520px] dal-hero-animate [animation:dal-hero-rise_750ms_120ms_ease-out_both]">
          <div className="absolute inset-x-8 top-14 h-72 rounded-full bg-[#2563EB]/20 blur-3xl sm:inset-x-12 sm:top-20" />

          <div className="absolute left-1/2 top-1/2 w-[min(92vw,410px)] -translate-x-1/2 -translate-y-1/2 rounded-[6.5px] border border-slate-200 bg-white p-4 text-right shadow-2xl shadow-blue-950/10 sm:w-[430px]">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">لوحة الطالب</p>
                <h2 className="mt-1 text-lg font-extrabold text-slate-950">دورة تصميم واجهات المستخدم</h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-[6.5px] bg-blue-50 text-[#2563EB]">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>تقدم الدورة</span>
                  <span className="text-[#2563EB]">68%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 w-[68%] rounded-full bg-gradient-to-l from-[#2563EB] to-[#38BDF8]" />
                </div>
              </div>
              <Badge className="rounded-[6.5px] bg-emerald-50 px-3 py-1.5 text-emerald-700 hover:bg-emerald-50">
                تسجيل مؤكد
              </Badge>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-[6.5px] border border-slate-100 bg-slate-50 p-3">
                <CalendarClock className="mb-2 h-4 w-4 text-[#2563EB]" />
                <p className="text-xs font-semibold text-slate-500">الجلسة</p>
                <p className="mt-1 text-sm font-bold text-slate-900">7:00 م</p>
              </div>
              <div className="rounded-[6.5px] border border-slate-100 bg-slate-50 p-3">
                <Users className="mb-2 h-4 w-4 text-[#2563EB]" />
                <p className="text-xs font-semibold text-slate-500">الطلاب</p>
                <p className="mt-1 text-sm font-bold text-slate-900">24</p>
              </div>
              <div className="rounded-[6.5px] border border-slate-100 bg-slate-50 p-3">
                <Building2 className="mb-2 h-4 w-4 text-[#2563EB]" />
                <p className="text-xs font-semibold text-slate-500">القاعة</p>
                <p className="mt-1 text-sm font-bold text-slate-900">B-12</p>
              </div>
            </div>
          </div>

          <div className="dal-hero-float absolute right-2 top-8 rounded-[6.5px] border border-emerald-100 bg-white px-4 py-3 text-right shadow-xl shadow-blue-950/10 [animation:dal-hero-float_5s_ease-in-out_infinite] sm:right-8">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-bold text-slate-900">تم قبول تسجيلك</span>
            </div>
          </div>

          <div className="dal-hero-float absolute left-3 top-20 hidden rounded-[6.5px] border border-blue-100 bg-white px-4 py-3 text-right shadow-xl shadow-blue-950/10 [animation:dal-hero-float_5.8s_300ms_ease-in-out_infinite] sm:block">
            <div className="flex items-center gap-3">
              <CalendarClock className="h-5 w-5 text-[#2563EB]" />
              <span className="text-sm font-bold text-slate-900">جلسة اليوم 7:00 مساءً</span>
            </div>
          </div>

          <div className="dal-hero-float absolute bottom-20 right-0 rounded-[6.5px] border border-slate-200 bg-white px-4 py-3 text-right shadow-xl shadow-blue-950/10 [animation:dal-hero-float_6s_600ms_ease-in-out_infinite] sm:right-10">
            <div className="flex items-center gap-3">
              <UserCheck className="h-5 w-5 text-[#2563EB]" />
              <span className="text-sm font-bold text-slate-900">مدرب معتمد</span>
            </div>
          </div>

          <div className="dal-hero-float absolute bottom-8 left-4 hidden rounded-[6.5px] border border-cyan-100 bg-white px-4 py-3 text-right shadow-xl shadow-blue-950/10 [animation:dal-hero-float_5.4s_900ms_ease-in-out_infinite] sm:block">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-cyan-600" />
              <span className="text-sm font-bold text-slate-900">قاعة متاحة</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatsSection({ stats, loading }: { stats: PlatformStats | null; loading: boolean }) {
  const items = [
    { label: "طالب نشط", value: stats?.students ?? 0, icon: Users },
    { label: "دورة تدريبية", value: stats?.courses ?? 0, icon: BookOpen },
    { label: "مدرب خبير", value: stats?.trainers ?? 0, icon: UserCheck },
    { label: "معهد معتمد", value: stats?.institutes ?? 0, icon: Building2 },
  ]

  return (
    <section className="bg-slate-50 pb-10" dir="rtl">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-3 px-4 sm:px-6 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="rounded-[6.5px] border border-slate-200 bg-white shadow-sm">
                <CardContent className="p-4">
                  <Skeleton className="mb-3 h-8 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))
          : items.map((item) => (
              <Card key={item.label} className="rounded-[6.5px] border border-slate-200 bg-white shadow-sm transition-transform hover:-translate-y-0.5">
                <CardContent className="p-4 text-right">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-2xl font-extrabold text-slate-900">+{item.value}</span>
                    <span className="rounded-[6.5px] bg-blue-50 p-2 text-[#2563EB]"><item.icon className="h-4 w-4" /></span>
                  </div>
                  <p className="text-sm font-semibold text-slate-600">{item.label}</p>
                </CardContent>
              </Card>
            ))}
      </div>
    </section>
  )
}

function WhyDalSection() {
  const { settings } = usePlatform()
  const siteName = settings?.general.siteName || PLATFORM_NAME

  return (
    <section className="bg-slate-50 py-12" dir="rtl">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <h2 className="text-right text-2xl font-extrabold text-slate-900 md:text-3xl">لماذا تختار {siteName}؟</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {whyItems.map((item) => (
            <Card key={item.title} className="rounded-[6.5px] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="p-4 text-right">
                <item.icon className="mb-3 h-5 w-5 text-[#2563EB]" />
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function CategoriesSection({ categories, loading }: { categories: CategoryData[]; loading: boolean }) {
  return (
    <section id="categories" className="bg-white py-12" dir="rtl">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <h2 className="text-right text-2xl font-extrabold text-slate-900 md:text-3xl">استكشف أهم التصنيفات</h2>
        <p className="mt-2 text-right text-slate-600">اختر المجال المناسب وابدأ رحلتك التعليمية</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="rounded-[6.5px] border border-slate-200 bg-white">
                  <CardContent className="p-4">
                    <Skeleton className="mb-3 h-6 w-6" />
                    <Skeleton className="mb-2 h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))
            : categories.map((cat) => {
                const Icon = categoryIcon(cat.name)
                return (
                  <Link key={cat.id} href={`/courses?category=${cat.id}`}>
                    <Card className="rounded-[6.5px] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
                      <CardContent className="p-4 text-right">
                        <Icon className="mb-3 h-5 w-5 text-[#2563EB]" />
                        <h3 className="text-base font-bold text-slate-900">{cat.name}</h3>
                        <p className="mt-1 text-sm text-slate-600">{cat._count?.courses ?? 0} دورات</p>
                        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#2563EB]">استعرض <ArrowLeft className="h-4 w-4" /></span>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
        </div>
      </div>
    </section>
  )
}

function FeaturedCoursesSection({ courses, loading }: { courses: FeaturedCourse[]; loading: boolean }) {
  return (
    <section className="bg-white py-12" dir="rtl">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-right text-2xl font-extrabold text-slate-900 md:text-3xl">دورات مميزة اخترناها لك</h2>
            <p className="mt-2 text-right text-slate-600">الأكثر طلبًا وتقييمًا من الطلاب</p>
          </div>
          <Button asChild variant="outline" className="rounded-[6.5px]">
            <Link href="/courses">عرض كل الدورات</Link>
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden rounded-[6.5px] border border-slate-200">
                  <Skeleton className="h-44 w-full" />
                  <CardContent className="space-y-3 p-4">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))
            : courses.map((course) => {
                const instructorName = course.trainer?.name || course.staffTrainer?.name || course.institute?.name || "غير محدد"
                return (
                  <Link key={course.id} href={`/courses/${course.id}`}>
                    <Card className="overflow-hidden rounded-[6.5px] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <div className="relative h-44 w-full">
                        <Image src={imageOrFallback(course.image)} alt={course.title} fill className="object-cover" unoptimized />
                      </div>
                      <CardContent className="p-4 text-right">
                        <Badge className="mb-3 rounded-[6.5px] bg-blue-50 text-[#2563EB]">{course.category?.name || "غير مصنف"}</Badge>
                        <h3 className="line-clamp-2 min-h-[3rem] text-base font-bold text-slate-900">{course.title}</h3>
                        <p className="mt-2 text-sm text-slate-600">{instructorName}</p>
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                          <div className="text-sm font-bold text-slate-900">{course.price} ر.ي</div>
                          <span className="rounded-[6.5px] bg-slate-900 p-2 text-white"><ArrowUpRight className="h-4 w-4" /></span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  return (
    <section className="bg-slate-50 py-12" dir="rtl">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <h2 className="text-right text-2xl font-extrabold text-slate-900 md:text-3xl">كيف تبدأ؟</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.id} className="rounded-[6.5px] border border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4 text-right">
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-[6.5px] bg-blue-50 font-bold text-[#2563EB]">{step.id}</div>
                <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function PartnerCTASection() {
  return (
    <section className="bg-white py-12" dir="rtl">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-4 sm:px-6 md:grid-cols-2">
        <Card className="rounded-[6.5px] border-0 bg-gradient-to-l from-[#2563EB] to-[#1d4ed8] text-white shadow-sm">
          <CardContent className="p-6 text-right">
            <h3 className="text-2xl font-extrabold">درّب طلابك ووسّع حضورك</h3>
            <p className="mt-3 text-blue-100">أنشئ دوراتك، تابع تسجيلات الطلاب، وأدر جدولك بسهولة.</p>
            <Button asChild className="mt-5 rounded-[6.5px] bg-white text-[#2563EB] hover:bg-slate-100">
              <Link href="/auth/register?role=trainer">انضم كمدرب</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[6.5px] border border-blue-200 bg-white shadow-sm">
          <CardContent className="p-6 text-right">
            <h3 className="text-2xl font-extrabold text-slate-900">أدر معهدك وقاعاتك من مكان واحد</h3>
            <p className="mt-3 text-slate-600">أنشئ الدورات، أدر القاعات، تابع المدربين والتسجيلات.</p>
            <Button asChild variant="outline" className="mt-5 rounded-[6.5px] border-[#2563EB] text-[#2563EB]">
              <Link href="/auth/register?role=institute_admin">انضم كمعهد</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  return (
    <section className="bg-slate-50 py-12" dir="rtl">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <h2 className="text-right text-2xl font-extrabold text-slate-900 md:text-3xl">ماذا يقول طلابنا؟</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="rounded-[6.5px] border border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4 text-right">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-bold text-[#2563EB]">{t.name.slice(0, 1)}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
                <div className="mb-2 flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-sm leading-7 text-slate-600">{t.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCTASection() {
  const { settings } = usePlatform()
  const siteName = settings?.general.siteName || PLATFORM_NAME

  return (
    <section className="bg-white py-12" dir="rtl">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <Card className="rounded-[6.5px] border border-slate-200 bg-gradient-to-l from-slate-50 to-blue-50 shadow-sm">
          <CardContent className="p-8 text-right">
            <h2 className="text-2xl font-extrabold text-slate-900 md:text-3xl">جاهز تبدأ رحلتك التعليمية؟</h2>
            <p className="mt-3 text-slate-600">استعرض الدورات المناسبة لك وابدأ اليوم مع {siteName}.</p>
            <Button asChild className="mt-5 rounded-[6.5px] bg-[#2563EB] text-white hover:bg-[#1d4ed8]">
              <Link href="/courses">ابدأ الآن</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function LandingFooter() {
  const { settings } = usePlatform()
  const siteName = settings?.general.siteName || PLATFORM_NAME
  const siteDesc = settings?.general.siteDescription || "منصة تعليمية عربية لإدارة الدورات والتسجيل والمتابعة بكل سهولة."
  const contactEmail = settings?.general.contactEmail || "info@coursebooking.com"
  const supportPhone = settings?.general.supportPhone || "+966 50 000 0000"

  return (
    <footer className="border-t border-slate-200 bg-slate-900 py-10 text-slate-300" dir="rtl">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 md:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="relative h-8 w-8"><Image src="/images/logo.png" alt={siteName} fill className="object-contain" /></span>
            <span className="text-xl font-extrabold text-white">{siteName}</span>
          </div>
          <p className="text-sm leading-7 text-slate-400">{siteDesc}</p>
        </div>
        <div>
          <h4 className="mb-3 font-bold text-white">روابط سريعة</h4>
          <div className="space-y-2 text-sm">
            <Link href="/" className="block hover:text-white">الرئيسية</Link>
            <Link href="/courses" className="block hover:text-white">الدورات</Link>
            <Link href="/institutes" className="block hover:text-white">المعاهد</Link>
            <Link href="/auth/register?role=trainer" className="block hover:text-white">للمدربين</Link>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-bold text-white">الحسابات</h4>
          <div className="space-y-2 text-sm">
            <Link href="/auth/register?role=student" className="block hover:text-white">طالب</Link>
            <Link href="/auth/register?role=trainer" className="block hover:text-white">مدرب</Link>
            <Link href="/auth/register?role=institute_admin" className="block hover:text-white">معهد</Link>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-bold text-white">تواصل معنا</h4>
          <div className="space-y-3 text-sm">
            <a href={`mailto:${contactEmail}`} className="block hover:text-white transition-colors">{contactEmail}</a>
            <a href={`https://wa.me/${supportPhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="block hover:text-white transition-colors" dir="ltr">{supportPhone}</a>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-8 w-full max-w-7xl border-t border-slate-800 px-4 pt-5 text-sm text-slate-400 sm:px-6">
        © {new Date().getFullYear()} {siteName}. جميع الحقوق محفوظة.
      </div>
    </footer>
  )
}

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [courses, setCourses] = useState<FeaturedCourse[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, categoriesRes, coursesRes] = await Promise.all([
          PublicService.getStats(),
          PublicService.getCategories(),
          PublicService.getFeaturedCourses(),
        ])
        setStats(statsRes)
        setCategories(categoriesRes)
        setCourses(coursesRes)
      } catch (error) {
        console.error("Failed to load home data", error)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const sortedCategories = useMemo(() => categories.slice(0, 8), [categories])
  const featured = useMemo(() => courses.slice(0, 8), [courses])

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <LandingHeader />
      <HeroSection />
      <StatsSection stats={stats} loading={loading} />
      <WhyDalSection />
      <CategoriesSection categories={sortedCategories} loading={loading} />
      <FeaturedCoursesSection courses={featured} loading={loading} />
      <HowItWorksSection />
      <PartnerCTASection />
      <TestimonialsSection />
      <FinalCTASection />
      <LandingFooter />
    </main>
  )
}
