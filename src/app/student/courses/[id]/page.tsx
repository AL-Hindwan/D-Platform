"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Clock,
  Timer,
  ArrowRight,
  Globe,
  BookOpen,
  Megaphone,
  Mail,
  Phone,
  Video,
  AlertCircle,
  AlertTriangle,
  Lock,
} from "lucide-react"
import { studentService } from "@/lib/student-service"
import { formatDate, formatTime, getFileUrl } from "@/lib/utils"

type SessionItem = {
  id: string
  title?: string
  topic?: string | null
  description?: string | null
  startTime?: string
  endTime?: string
  type?: string
  status?: string
  meetingLink?: string | null
  location?: string | null
  room?: { id?: string; name?: string | null; location?: string | null; locationUrl?: string | null } | null
}

function safeImage(src?: string | null) {
  if (!src) return "/images/course-web.png"
  return getFileUrl(src) || "/images/course-web.png"
}

function durationLabel(start?: string, end?: string) {
  if (!start || !end) return "-"
  const a = new Date(start).getTime()
  const b = new Date(end).getTime()
  if (Number.isNaN(a) || Number.isNaN(b)) return "-"
  const mins = Math.max(0, Math.round((b - a) / 60000))
  if (mins < 60) return `${mins} دقيقة`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h} س ${m} د` : `${h} ساعة`
}

function normalizePhone(phone?: string | null) {
  return String(phone || "").replace(/[^\d]/g, "")
}

function deliveryLabel(v?: string | null) {
  const value = String(v || "").trim().toLowerCase()
  if (["online", "virtual", "remote", "zoom", "teams", "meet"].includes(value)) return "أونلاين"
  if (["in_person", "in-person", "onsite", "offline", "classroom", "physical"].includes(value)) return "حضوري"
  if (["hybrid", "blended"].includes(value)) return "هجين"
  return "-"
}

function parseAnnouncementText(raw?: string | null) {
  const value = String(raw || "").trim()
  if (!value) return { main: "-", meta: "" }
  const parts = value.split("---")
  return {
    main: (parts[0] || "").trim() || "-",
    meta: parts.length > 1 ? parts.slice(1).join("---").trim() : "",
  }
}

export default function StudentEnrolledCoursePage() {
  const params = useParams()
  const courseId = typeof params.id === "string" ? params.id : ""

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [course, setCourse] = useState<any>(null)
  const [schedule, setSchedule] = useState<any[]>([])
  const [enrollmentStatus, setEnrollmentStatus] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!courseId) return
      setLoading(true)
      setError(null)
      try {
        const [courseData, scheduleData, myCourses] = await Promise.all([
          studentService.getCourseDetails(courseId),
          studentService.getSchedule(),
          studentService.getMyCourses(),
        ])
        if (cancelled) return
        setCourse(courseData)
        setSchedule(Array.isArray(scheduleData) ? scheduleData : [])
        const found = (Array.isArray(myCourses) ? myCourses : []).find((e: any) => e?.course?.id === courseId || e?.courseId === courseId)
        setEnrollmentStatus(found?.status || null)
      } catch {
        if (!cancelled) setError("تعذر تحميل بيانات الدورة")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [courseId])

  const sessions: SessionItem[] = useMemo(() => {
    const fromCourse = Array.isArray(course?.sessions) ? course.sessions : []
    if (fromCourse.length) return fromCourse
    return schedule.filter((s: any) => s?.courseId === courseId)
  }, [course, schedule, courseId])

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime())
  }, [sessions])

  const nextSession = useMemo(() => {
    const now = Date.now()
    return sortedSessions.find((s) => {
      const t = new Date(s.startTime || 0).getTime()
      return t >= now
    }) || null
  }, [sortedSessions])

  const announcements = useMemo(() => {
    return Array.isArray(course?.announcements) ? course.announcements : []
  }, [course])

  const instructor = course?.instructor || course?.trainer || null
  const institute = course?.institute || null
  const roomLocationUrl = course?.room?.locationUrl || course?.locationUrl || null
  const hallName = course?.locationName || course?.room?.name || nextSession?.room?.name || nextSession?.location || null
  const heroMeetingLink = nextSession?.meetingLink || course?.meetingLink || null
  const joinSessionLink = nextSession?.meetingLink || course?.meetingLink || null
  const courseDelivery = deliveryLabel(course?.deliveryType)
  const sessionDelivery = nextSession ? deliveryLabel(nextSession.type) : "-"
  const hasOnlineSignal = Boolean(heroMeetingLink) || sortedSessions.some((s) => deliveryLabel(s?.type) === "أونلاين")
  const displayDelivery = courseDelivery !== "-" ? courseDelivery : sessionDelivery !== "-" ? sessionDelivery : hasOnlineSignal ? "أونلاين" : "غير محدد"
  const normalizedStatus = String(enrollmentStatus || "").trim().toLowerCase()
  const isEnrollmentCancelled = ["cancelled", "canceled", "ملغية", "ملغي"].includes(normalizedStatus)

  if (loading) {
    return (
      <section dir="rtl" className="bg-transparent px-4 pb-8 pt-0 sm:px-6">
        <div className="mx-auto max-w-[1280px] space-y-4">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Skeleton className="h-96 rounded-lg lg:col-span-2" />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        </div>
      </section>
    )
  }

  if (error || !course) {
    return (
      <section dir="rtl" className="bg-transparent px-4 pb-8 pt-0 sm:px-6">
        <div className="mx-auto max-w-[1280px]">
          <Card className="rounded-lg border-slate-200">
            <CardContent className="py-12 text-center">
              <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
              <h2 className="mb-1 text-xl font-bold text-slate-900">تعذر عرض الصفحة</h2>
              <p className="text-slate-500">{error || "الدورة غير متاحة"}</p>
              <Button asChild className="mt-4">
                <Link href="/student/my-courses">العودة إلى دوراتي</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    )
  }

  return (
    <section dir="rtl" className="bg-transparent px-4 pb-8 pt-0 sm:px-6">
      <div className="mx-auto max-w-[1280px] space-y-5">
        <div className="flex justify-start">
          <Button asChild variant="outline" className="rounded-lg border-slate-200">
            <Link href="/student/my-courses">
              <ArrowRight className="ml-2 h-4 w-4" />
              العودة إلى دوراتي
            </Link>
          </Button>
        </div>

        <Card className="overflow-hidden rounded-lg border-0 bg-gradient-to-l from-[#1E3A8A] to-[#0F172A] text-white shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-center">
              <div className="space-y-3 lg:col-span-7 text-right">
                <h2 className="text-2xl font-bold">{course.title}</h2>
                {isEnrollmentCancelled && (
                  <Badge className="rounded-[6.5px] bg-[#FEF2F2] px-2.5 py-1 text-[#DC2626] hover:bg-[#FEF2F2]">
                    تم إلغاء التسجيل
                  </Badge>
                )}
                <p className="text-sm text-blue-100/90">{course.shortDescription || course.description || "-"}</p>
                <div className="flex flex-wrap gap-2">
                  <MetaChip icon={Globe} label={displayDelivery} />
                  <MetaChip icon={Calendar} label={`${formatDate(new Date(course.startDate || Date.now()))} - ${formatDate(new Date(course.endDate || Date.now()))}`} />
                  <MetaChip icon={BookOpen} label={`${sortedSessions.length} دروس`} />
                </div>
                {course.deliveryType !== "online" && hallName ? (
                  <div className="text-sm text-blue-100/95">
                    <span className="font-semibold">القاعة: </span>
                    {roomLocationUrl ? (
                      <a href={roomLocationUrl} target="_blank" rel="noreferrer" className="underline hover:text-white">
                        {hallName}
                      </a>
                    ) : (
                      <span>{hallName}</span>
                    )}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-1">
                  {!isEnrollmentCancelled && (
                    <>
                  {course.deliveryType === "online" && heroMeetingLink && (
                    <Button asChild className="rounded-lg bg-blue-600 hover:bg-blue-700">
                      <a href={heroMeetingLink} target="_blank" rel="noreferrer">دخول اللقاء</a>
                    </Button>
                  )}
                  {course.deliveryType !== "online" && roomLocationUrl && (
                    <Button asChild className="rounded-lg bg-blue-600 hover:bg-blue-700">
                      <a href={roomLocationUrl} target="_blank" rel="noreferrer">عرض موقع القاعة</a>
                    </Button>
                  )}
                    </>
                  )}
                </div>
              </div>
              <div className="lg:col-span-5">
                <div className="relative overflow-hidden rounded-lg border border-white/15 bg-slate-900/20">
                  <div className="relative aspect-video">
                    <Image src={safeImage(course.image)} alt={course.title} fill className="object-cover" unoptimized />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {isEnrollmentCancelled ? (
              <Card className="rounded-[6.5px] border border-[#FDBA74] bg-[#FFF7ED] shadow-sm">
                <CardContent className="p-5 text-right" dir="rtl">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[6.5px] bg-amber-100 text-amber-700">
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-slate-900">تم إلغاء تسجيلك في هذه الدورة</h3>
                      <p className="text-sm text-slate-700">لم يعد بإمكانك الوصول إلى جدول الدروس أو الإعلانات الخاصة بهذه الدورة.</p>
                      <p className="text-sm text-slate-600">يمكنك العودة إلى دوراتك أو استعراض الدورات المتاحة للتسجيل من جديد.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-[8px] border border-blue-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                <CardContent className="p-3 sm:p-4">
                  {nextSession ? (
                  <div className="flex min-h-[112px] flex-col" dir="rtl">
                    <div className="mb-3 text-right">
                      <h3 className="text-lg font-bold text-slate-900">الجلسة القادمة</h3>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 text-right">
                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] bg-blue-100 text-blue-600">
                          <Calendar className="h-5 w-5" />
                        </span>
                        <p className="text-base font-semibold text-slate-900">{nextSession.title || nextSession.topic || "جلسة أونلاين"}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium text-slate-700 sm:flex-1 sm:justify-center">
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          {formatDate(new Date(nextSession.startTime || Date.now()))}
                        </span>
                        <span className="hidden h-5 w-px bg-slate-200 sm:inline-block" />
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                          <Clock className="h-4 w-4 text-blue-600" />
                          {formatTime(new Date(nextSession.startTime || Date.now()))}
                        </span>
                        <span className="hidden h-5 w-px bg-slate-200 sm:inline-block" />
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                          <Timer className="h-4 w-4 text-slate-500" />
                          {durationLabel(nextSession.startTime, nextSession.endTime)}
                        </span>
                        <span className="hidden h-5 w-px bg-slate-200 sm:inline-block" />
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                          <Globe className="h-4 w-4 text-blue-600" />
                          {deliveryLabel(nextSession.type) !== "-" ? deliveryLabel(nextSession.type) : deliveryLabel(course?.deliveryType)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {joinSessionLink ? (
                          <Button asChild className="h-9 rounded-[8px] bg-blue-600 px-3 text-xs font-semibold hover:bg-blue-700 sm:text-sm">
                            <a href={joinSessionLink} target="_blank" rel="noreferrer">
                              <Video className="ml-1.5 h-4 w-4" />
                              الانضمام للدورة
                            </a>
                          </Button>
                        ) : (
                          <Button disabled className="h-9 rounded-[8px] bg-slate-300 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-300 sm:text-sm">
                            <Video className="ml-1.5 h-4 w-4" />
                            لا يوجد رابط
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  ) : (
                    <EmptyBlock title="لا توجد جلسة قادمة" description="سيظهر هنا موعد الجلسة القادمة عند توفره." icon={Calendar} />
                  )}
                </CardContent>
              </Card>
            )}

            {isEnrollmentCancelled ? (
              <Card className="rounded-[6.5px] border border-slate-200 bg-white shadow-sm">
                <CardContent className="p-5 text-right" dir="rtl">
                  <div className="mb-3 flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[6.5px] bg-slate-100 text-slate-600">
                      <Lock className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">محتوى الدورة غير متاح</h3>
                      <p className="mt-1 text-sm text-slate-600">تم إيقاف الوصول إلى محتوى هذه الدورة لأن تسجيلك ملغي.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-start gap-2">
                    <Button asChild className="h-10 rounded-[6.5px] bg-blue-600 px-4 hover:bg-blue-700">
                      <Link href="/student/my-courses">العودة إلى دوراتي</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-10 rounded-[6.5px] border-blue-200 px-4 text-blue-700 hover:bg-blue-50">
                      <Link href="/student/courses">استعراض الدورات</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="schedule" dir="rtl" className="space-y-3">
                <TabsList className="grid h-11 w-full grid-cols-2 rounded-lg bg-slate-100 p-1">
                  <TabsTrigger value="schedule" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600">جدول الدروس</TabsTrigger>
                  <TabsTrigger value="announcements" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600">الإعلانات</TabsTrigger>
                </TabsList>

                <TabsContent value="schedule" className="mt-0 space-y-3">
                  {sortedSessions.length ? sortedSessions.map((s, idx) => (
                    <Card key={s.id || idx} className="rounded-lg border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between" dir="rtl">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{idx + 1}</div>
                            <div className="text-right">
                              <h4 className="font-semibold text-slate-900">{s.title || s.topic || `جلسة ${idx + 1}`}</h4>
                              {s.description ? <p className="text-sm text-slate-500">{s.description}</p> : null}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 sm:grid-cols-4">
                            <InfoRow icon={Calendar} text={formatDate(new Date(s.startTime || Date.now()))} />
                            <InfoRow icon={Clock} text={formatTime(new Date(s.startTime || Date.now()))} />
                            <InfoRow icon={Clock} text={durationLabel(s.startTime, s.endTime)} />
                            <InfoRow
                              icon={Globe}
                              text={deliveryLabel(s.type) !== "-" ? deliveryLabel(s.type) : deliveryLabel(course?.deliveryType)}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">{(s.status || "scheduled") === "completed" ? "انتهت" : "قادمة"}</Badge>
                            {s.meetingLink && (s.status || "") !== "completed" ? (
                              <Button asChild size="sm" className="rounded-lg bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                                <a href={s.meetingLink} target="_blank" rel="noreferrer">دخول</a>
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )) : <EmptyBlock title="لا توجد جلسات" description="لا توجد جلسات مجدولة لهذه الدورة." icon={BookOpen} />}
                </TabsContent>

                <TabsContent value="announcements" className="mt-0 space-y-3">
                  {announcements.length ? announcements.map((a: any, i: number) => (
                    <Card key={a.id || i} className="rounded-lg border-slate-200">
                      <CardContent className="p-4 text-right">
                        {(() => {
                          const parsed = parseAnnouncementText(a.content || a.message || "-")
                          return (
                            <>
                        <div className="mb-1 flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900">{a.title || "إعلان"}</h4>
                        </div>
                        <p className="text-xs text-slate-500 mb-1">{a.createdAt ? formatDate(new Date(a.createdAt)) : ""}</p>
                        <p className="text-sm text-slate-700">{parsed.main}</p>
                        {parsed.meta ? (
                          <div className="mt-2 border-t border-slate-200 pt-2 text-xs text-slate-500">
                            {parsed.meta}
                          </div>
                        ) : null}
                            </>
                          )
                        })()}
                      </CardContent>
                    </Card>
                  )) : <EmptyBlock title="لا توجد إعلانات حتى الآن" description="ستظهر الإعلانات هنا عند نشرها." icon={Megaphone} />}
                </TabsContent>
              </Tabs>
            )}
          </div>

          <div className="space-y-4">
            <Card className="rounded-lg border-slate-200">
              <CardHeader><CardTitle className="text-right text-base">مدرب الدورة</CardTitle></CardHeader>
              <CardContent className="text-right">
                <div className="mb-3 flex items-center gap-3" dir="rtl">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full border border-slate-200">
                    <Image src={safeImage(instructor?.avatar)} alt={instructor?.name || "المدرب"} fill className="object-cover" unoptimized />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{instructor?.name || "غير محدد"}</p>
                    <p className="text-xs text-slate-500">{(instructor?.specialties || [])[0] || instructor?.bio || ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 py-1" dir="rtl">
                  <Mail className="h-3.5 w-3.5 text-blue-600" />
                  {instructor?.email ? (
                    <a href={`mailto:${instructor.email}`} className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                      {instructor.email}
                    </a>
                  ) : (
                    <span className="text-sm text-slate-700">-</span>
                  )}
                </div>
                <div className="flex items-center gap-2 py-1" dir="rtl">
                  <Phone className="h-3.5 w-3.5 text-green-600" />
                  {instructor?.phone ? (
                    <a
                      href={`https://wa.me/${normalizePhone(instructor.phone)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-green-600 hover:text-green-700 hover:underline"
                    >
                      {instructor.phone}
                    </a>
                  ) : (
                    <span className="text-sm text-slate-700">-</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {institute ? (
              <Card className="rounded-lg border-slate-200">
                <CardHeader><CardTitle className="text-right text-base">المعهد المستضيف</CardTitle></CardHeader>
                <CardContent className="text-right">
                  <div className="mb-3 flex items-center gap-3" dir="rtl">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border border-slate-200">
                      <Image src={safeImage(institute.logo)} alt={institute.name || "المعهد"} fill className="object-cover" unoptimized />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{institute.name || "-"}</p>
                      <p className="text-xs text-slate-500">{institute.description || ""}</p>
                    </div>
                  </div>
                  <SideRow icon={Mail} text={institute.email || "-"} />
                  <SideRow icon={Phone} text={institute.phone || "-"} />
                </CardContent>
              </Card>
            ) : null}

          </div>
        </div>
      </div>
    </section>
  )
}

function MetaChip({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs text-blue-50">
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </span>
  )
}

function InfoRow({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="inline-flex items-center gap-1">
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      <span>{text}</span>
    </div>
  )
}

function SideRow({ icon: Icon, label, text }: { icon: any; label?: string; text: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1" dir="rtl">
      <div className="inline-flex items-center gap-1.5 text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label ? <span className="text-xs">{label}</span> : null}
      </div>
      <span className="text-sm text-slate-700 break-all text-left">{text}</span>
    </div>
  )
}

function EmptyBlock({ title, description, icon: Icon }: { title: string; description: string; icon: any }) {
  return (
    <Card className="rounded-lg border-slate-200">
      <CardContent className="py-10 text-center">
        <Icon className="mx-auto mb-3 h-8 w-8 text-slate-300" />
        <h4 className="mb-1 font-semibold text-slate-900">{title}</h4>
        <p className="text-sm text-slate-500">{description}</p>
      </CardContent>
    </Card>
  )
}
