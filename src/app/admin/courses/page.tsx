"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { ChevronDown, Users, CalendarDays, Clock3, Eye, XCircle, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Course } from "@/types"
import { AdminPageHeader } from "@/components/admin/page-header"
import { adminService } from "@/lib/admin-service"
import { getFileUrl } from "@/lib/utils"
import { toast } from "sonner"

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0)
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: { label: string; value: string }[] }) {
  return (
    <div className="relative">
      <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 min-w-[140px] appearance-none rounded-xl border border-slate-200 bg-white px-4 pl-8 text-sm font-semibold text-slate-700 outline-none hover:border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  )
}

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await adminService.getAllCourses()
      setCourses(data as Course[])
    } catch (err: any) {
      setError(err?.response?.data?.message || "فشل في جلب الدورات")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const filteredCourses = useMemo(
    () =>
      courses.filter((course) => {
        const matchesStatus = statusFilter === "all" || course.status === statusFilter
        const matchesCategory = categoryFilter === "all" || course.category === categoryFilter
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || (course.trainer?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
        return matchesStatus && matchesCategory && matchesSearch
      }),
    [courses, statusFilter, categoryFilter, searchQuery]
  )

  const uniqueCategories = Array.from(new Set(courses.map((course) => course.category).filter(Boolean)))

  const suspendCourse = async (courseId: string) => {
    try {
      await adminService.suspendCourse(courseId)
      toast.success("تم تعليق الدورة")
      await fetchCourses()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل تعليق الدورة")
    }
  }

  const deleteCourse = async (courseId: string) => {
    const ok = window.confirm("هل أنت متأكد من حذف هذه الدورة؟")
    if (!ok) return
    try {
      await adminService.deleteCourse(courseId)
      toast.success("تم حذف الدورة")
      setCourses((prev) => prev.filter((c) => c.id !== courseId))
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل حذف الدورة")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800">مسودة</Badge>
      case "completed":
        return <Badge className="bg-purple-100 text-purple-800">مكتمل</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">ملغي</Badge>
      case "rejected":
        return <Badge className="bg-orange-100 text-orange-800">مرفوض</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) return <div className="py-10 text-center">جارِ التحميل...</div>

  return (
    <section dir="rtl" className="min-h-full bg-transparent space-y-4">
      <AdminPageHeader title="إدارة الدورات" description="نفس تصميم استعراض المدرب مع صلاحيات وإجراءات الأدمن" />

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

      <div className="rounded-3xl border border-slate-200/80 bg-white p-3 shadow-[0_4px_14px_rgba(15,23,42,0.035)] md:px-4 md:py-3.5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث عن دورة أو مدرب..." className="h-11 w-64 rounded-xl" />
            <FilterSelect value={statusFilter} onChange={setStatusFilter} options={[{ label: "كل الحالات", value: "all" }, { label: "نشط", value: "active" }, { label: "مسودة", value: "draft" }, { label: "مكتمل", value: "completed" }, { label: "ملغي", value: "cancelled" }, { label: "مرفوض", value: "rejected" }]} />
            <FilterSelect value={categoryFilter} onChange={setCategoryFilter} options={[{ label: "كل الفئات", value: "all" }, ...uniqueCategories.map((c) => ({ label: c as string, value: c as string }))]} />
          </div>
          <p className="px-1 text-sm font-semibold text-slate-500 md:whitespace-nowrap">تم العثور على {filteredCourses.length} دورات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {filteredCourses.map((course) => (
          <article key={course.id} className="group flex h-full min-h-[390px] flex-col overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(37,99,235,0.16)]">
            <div className="relative h-[188px] overflow-hidden bg-slate-100 md:h-[196px]">
              <Image src={getFileUrl(course.image) || "/images/course-web.png"} alt={course.title} fill unoptimized className="object-cover object-center" />
              <span className="absolute bottom-3 right-3 rounded-full bg-white/86 px-2.5 py-1 text-[11px] font-semibold text-slate-700 backdrop-blur-[2px]">{course.category || "الفئة"}</span>
            </div>
            <div className="flex flex-1 flex-col p-3.5 text-right">
              <h3 className="line-clamp-2 text-[17px] font-extrabold leading-6 text-slate-900">{course.title}</h3>
              <p className="mt-1 text-xs text-slate-500">{course.trainer?.name || "-"} • {course.institute?.name || "-"}</p>

              <div className="mt-2.5 flex items-center justify-between text-[12px] font-medium text-slate-600">
                <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5 text-slate-500" />{course.enrolledStudents || 0}/{course.maxStudents}</span>
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 text-slate-500" />{new Date(course.startDate).toLocaleDateString("en-CA")}</span>
                <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5 text-slate-500" />{course.duration} ساعة</span>
              </div>

              <div className="mt-auto space-y-2 pt-2.5">
                <div>{getStatusBadge(course.status)}</div>
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-1 pt-3">
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" className="h-8"><Eye className="h-4 w-4" /></Button>
                    {(course.status === "active" || course.status === "draft") && (
                      <Button size="sm" variant="outline" className="h-8 text-orange-600" onClick={() => suspendCourse(course.id)}><XCircle className="h-4 w-4" /></Button>
                    )}
                    <Button size="sm" variant="outline" className="h-8 text-red-600" onClick={() => deleteCourse(course.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <p className="whitespace-nowrap text-[20px] font-extrabold leading-none tracking-tight text-[#2563EB]">{formatPrice(course.price)} <span className="text-xs font-bold text-blue-500">ر.ي</span></p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
