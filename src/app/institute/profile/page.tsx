"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Building,
  Camera,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Trash2,
  Landmark,
  CreditCard,
  Hash,
  X,
  Globe,
  MapPin,
  Phone,
  Mail,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { instituteService } from "@/lib/institute-service"
import { getFileUrl } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

type BankAccount = {
  id: string
  bankName: string
  accountName: string
  accountNumber: string
  iban?: string | null
  isActive: boolean
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message?: unknown }).message
    if (typeof msg === "string" && msg.trim()) return msg
  }
  return fallback
}

function Field({
  label,
  value,
  editable,
  onChange,
  placeholder,
  emptyText,
  type,
  icon,
}: {
  label: string
  value?: string
  editable: boolean
  onChange?: (v: string) => void
  placeholder?: string
  emptyText?: string
  type?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="text-right">{label}</Label>
      <div className="relative">
        {icon ? <div className="absolute right-3 top-3 text-gray-400">{icon}</div> : null}
        <Input
          type={type || "text"}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={!editable || !onChange}
          placeholder={placeholder}
          className={`rounded-[6.5px] text-right ${icon ? "pr-10" : ""}`}
        />
      </div>
      {!value ? <p className="text-right text-xs text-slate-500">{emptyText || placeholder || "غير متوفر"}</p> : null}
    </div>
  )
}

export default function InstituteProfilePage() {
  const { updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState("institute-data")
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [user, setUser] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    role: "institute_admin",
    avatar: "",
    instituteName: "",
    instituteLogo: "",
    instituteAddress: "",
    instituteLocationUrl: "",
    instituteWebsite: "",
    instituteDescription: "",
    verificationStatus: "",
    city: "",
    publicPhone: "",
    publicEmail: "",
    managerName: "",
    managerPhone: "",
    adminEmail: "",
    licenseNumber: "",
    documentType: "",
    documentNumber: "",
    registrationDate: "",
    socialFacebook: "",
    socialInstagram: "",
    socialX: "",
    socialLinkedin: "",
    licenseDocument: "",
    commercialRegisterDocument: "",
    accreditationCertificate: "",
    additionalDocuments: [] as string[],
    publishedCoursesCount: 0,
  })

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [savedInstituteLogo, setSavedInstituteLogo] = useState("")
  const [logoError, setLogoError] = useState("")
  const [docFiles, setDocFiles] = useState<Partial<Record<"licenseDocument", File>>>({})
  

  const logoFileInputRef = useRef<HTMLInputElement>(null)

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [isBankAccountsLoading, setIsBankAccountsLoading] = useState(true)
  const [isBankModalOpen, setIsBankModalOpen] = useState(false)
  const [isSavingBank, setIsSavingBank] = useState(false)
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
  const [bankForm, setBankForm] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    iban: "",
    isActive: true,
  })
  const [errors, setErrors] = useState<{ bankName?: string; accountName?: string; accountNumber?: string; iban?: string }>({})

  const verification = useMemo(() => {
    const v = String(user.verificationStatus || "").toLowerCase()
    if (["approved", "verified", "active", "accepted"].includes(v)) return { label: "موثق", cls: "bg-emerald-100 text-emerald-700" }
    if (["pending", "under_review", "review"].includes(v)) return { label: "قيد المراجعة", cls: "bg-amber-100 text-amber-700" }
    if (["rejected", "declined"].includes(v)) return { label: "مرفوض", cls: "bg-red-100 text-red-700" }
    return { label: "غير محدد", cls: "bg-slate-100 text-slate-700" }
  }, [user.verificationStatus])

  const fetchBankAccounts = async () => {
    try {
      setIsBankAccountsLoading(true)
      const accounts = await instituteService.getBankAccounts()
      setBankAccounts(accounts || [])
    } catch {
      toast.error("فشل في تحميل الحسابات البنكية")
    } finally {
      setIsBankAccountsLoading(false)
    }
  }

  const validateBankForm = () => {
    const newErrors: typeof errors = {}
    if (!bankForm.bankName.trim()) newErrors.bankName = "اسم البنك مطلوب"
    if (!bankForm.accountName.trim()) newErrors.accountName = "اسم صاحب الحساب مطلوب"
    if (!bankForm.accountNumber.trim()) newErrors.accountNumber = "رقم الحساب مطلوب"
    if (bankForm.iban.trim()) {
      if (!bankForm.iban.trim().toUpperCase().startsWith("SA")) newErrors.iban = "يجب أن يبدأ الآيبان بـ SA"
      else if (bankForm.iban.trim().length < 15) newErrors.iban = "صيغة الآيبان غير صالحة"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const openBankModal = (account?: BankAccount) => {
    setErrors({})
    if (account) {
      setEditingAccountId(account.id)
      setBankForm({
        bankName: account.bankName,
        accountName: account.accountName,
        accountNumber: account.accountNumber,
        iban: account.iban || "",
        isActive: account.isActive,
      })
    } else {
      setEditingAccountId(null)
      setBankForm({ bankName: "", accountName: "", accountNumber: "", iban: "", isActive: true })
    }
    setIsBankModalOpen(true)
  }

  const handleSaveBankAccount = async () => {
    if (!validateBankForm()) {
      toast.error("يرجى تصحيح الأخطاء قبل الحفظ")
      return
    }
    try {
      setIsSavingBank(true)
      if (editingAccountId) {
        await instituteService.updateBankAccount(editingAccountId, bankForm)
        toast.success("تم تحديث الحساب البنكي بنجاح")
      } else {
        await instituteService.addBankAccount(bankForm)
        toast.success("تم إضافة الحساب البنكي بنجاح")
      }
      setIsBankModalOpen(false)
      fetchBankAccounts()
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "حدث خطأ أثناء حفظ الحساب البنكي"))
    } finally {
      setIsSavingBank(false)
    }
  }

  const handleDeleteBankAccount = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الحساب البنكي؟")) return
    try {
      await instituteService.deleteBankAccount(id)
      toast.success("تم حذف الحساب البنكي بنجاح")
      fetchBankAccounts()
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "حدث خطأ أثناء حذف الحساب البنكي"))
    }
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await instituteService.getProfile()
        if (data) {
          setUser((prev) => ({
            ...prev,
            ...data,
            phone: data.phone || "",
            city: data.city || "",
            publicPhone: data.publicPhone || data.phone || "",
            publicEmail: data.publicEmail || data.email || "",
            managerName: data.managerName || data.name || "",
            managerPhone: data.managerPhone || data.phone || "",
            adminEmail: data.adminEmail || data.email || "",
            instituteAddress: data.instituteAddress || data.address || "",
            instituteWebsite: data.instituteWebsite || data.website || data.instituteLocationUrl || data.locationUrl || data.mapUrl || "",
            instituteLocationUrl: data.instituteLocationUrl || data.locationUrl || data.mapUrl || data.instituteWebsite || data.website || "",
            instituteDescription: data.instituteDescription || data.description || "",
            licenseNumber: data.licenseNumber || data.commercialRegisterNumber || "",
            documentType: data.documentType || "",
            documentNumber: data.documentNumber || "",
            registrationDate: data.registrationDate || data.createdAt || "",
            socialFacebook: data.socialFacebook || data.facebook || "",
            socialInstagram: data.socialInstagram || data.instagram || "",
            socialX: data.socialX || data.twitter || "",
            socialLinkedin: data.socialLinkedin || data.linkedin || "",
            licenseDocument: data.licenseDocument || "",
            commercialRegisterDocument: data.commercialRegisterDocument || "",
            accreditationCertificate: data.accreditationCertificate || "",
            additionalDocuments: Array.isArray(data.additionalDocuments) ? data.additionalDocuments : [],
            publishedCoursesCount: Number(data.publishedCoursesCount || data.activeCourses || 0),
          }))
          setSavedInstituteLogo(data.instituteLogo || data.logo || "")
        }
      } catch {
        toast.error("فشل في تحميل بيانات الملف")
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
    fetchBankAccounts()
  }, [])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      setLogoError("صيغة الصورة غير مدعومة")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("حجم الصورة يجب ألا يتجاوز 2MB")
      return
    }

    setLogoError("")
    setLogoFile(file)
    setUser((prev) => ({ ...prev, instituteLogo: URL.createObjectURL(file) }))
    setIsEditing(true)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const formData = new FormData()
      formData.append("name", user.name)
      formData.append("phone", user.phone)
      formData.append("email", user.email)
      formData.append("instituteName", user.instituteName)
      formData.append("instituteAddress", user.instituteAddress)
      const websiteValue = user.instituteWebsite || user.instituteLocationUrl
      formData.append("instituteWebsite", websiteValue)
      formData.append("website", websiteValue)
      formData.append("instituteLocationUrl", websiteValue)
      formData.append("locationUrl", websiteValue)
      formData.append("instituteDescription", user.instituteDescription)
      formData.append("city", user.city)
      formData.append("publicPhone", user.publicPhone)
      formData.append("publicEmail", user.publicEmail)
      formData.append("managerName", user.managerName)
      formData.append("managerPhone", user.managerPhone)
      formData.append("adminEmail", user.adminEmail)
      formData.append("licenseNumber", user.licenseNumber)
      formData.append("documentType", user.documentType)
      formData.append("documentNumber", user.documentNumber)
      formData.append("socialFacebook", user.socialFacebook)
      formData.append("socialInstagram", user.socialInstagram)
      formData.append("socialX", user.socialX)
      formData.append("socialLinkedin", user.socialLinkedin)
      if (avatarFile) formData.append("avatar", avatarFile)
      if (logoFile) formData.append("logo", logoFile)
      if (docFiles.licenseDocument) formData.append("licenseDocument", docFiles.licenseDocument)
      const data = await instituteService.updateProfile(formData)
      const newLogo = data?.instituteLogo || data?.logo || user.instituteLogo
      const newLicenseDocument =
        data?.licenseDocument ||
        data?.licenseDocumentUrl ||
        data?.commercialRegisterDocument ||
        user.licenseDocument ||
        (docFiles.licenseDocument ? docFiles.licenseDocument.name : "")
      setSavedInstituteLogo(newLogo || "")
      setUser((prev) => ({
        ...prev,
        ...data,
        instituteLogo: newLogo || prev.instituteLogo,
        licenseDocument: newLicenseDocument,
      }))
      updateUser({ name: user.name, ...(data?.avatar ? { avatar: data.avatar } : {}) })
      toast.success("تم تحديث البيانات بنجاح")
      setIsEditing(false)
      setDocFiles({})
      setLogoFile(null)
      setAvatarFile(null)
      setLogoError("")
    } catch {
      toast.error("حدث خطأ أثناء حفظ البيانات")
    } finally {
      setIsSaving(false)
    }
  }

  const logoSrc = user.instituteLogo
    ? (user.instituteLogo.startsWith("blob:") ? user.instituteLogo : getFileUrl(user.instituteLogo))
    : ""

  const handleCancelEdit = () => {
    setIsEditing(false)
    setLogoFile(null)
    setDocFiles({})
    setLogoError("")
    setUser((prev) => ({ ...prev, instituteLogo: savedInstituteLogo }))
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div dir="rtl" className="bg-[#F1F5F9] pb-10">
      <div className="mx-auto w-full max-w-[1040px] px-4 sm:px-6">
        <div className="mb-4 text-right">
          <h1 className="text-4xl font-bold text-slate-900">الملف الشخصي</h1>
          <p className="mt-2 text-lg text-slate-600">إدارة بيانات المعهد</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-[6.5px] bg-slate-100 p-1">
            <TabsTrigger value="institute-data" className="rounded-[6.5px]">بيانات المعهد</TabsTrigger>
            <TabsTrigger value="banks" className="rounded-[6.5px]">الحسابات البنكية</TabsTrigger>
            <TabsTrigger value="security" className="rounded-[6.5px]">الأمان وكلمة المرور</TabsTrigger>
          </TabsList>

          <TabsContent value="institute-data" className="mt-0 space-y-4">
            <Card className="rounded-[6.5px] border border-slate-200 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-col items-end gap-4 sm:flex-row sm:items-center">
                    <div className="space-y-1 text-right">
                      <button
                        type="button"
                        onClick={() => isEditing && logoFileInputRef.current?.click()}
                        className={`relative h-24 w-24 overflow-hidden rounded-[6.5px] border border-slate-200 ${isEditing ? "cursor-pointer" : "cursor-default"}`}
                      >
                        <Avatar className="h-24 w-24 rounded-[6.5px] border-0">
                          {logoSrc ? <AvatarImage src={logoSrc} alt={user.instituteName} className="object-cover" /> : <AvatarFallback className="rounded-[6.5px] text-2xl">{(user.instituteName || "م").trim().charAt(0)}</AvatarFallback>}
                        </Avatar>
                        {isEditing ? (
                          <span className="absolute inset-0 flex items-center justify-center bg-slate-900/35 text-white">
                            <Camera className="h-5 w-5" />
                          </span>
                        ) : null}
                      </button>
                      <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif" className="hidden" ref={logoFileInputRef} onChange={handleLogoChange} />
                      {isEditing ? <p className="text-xs text-slate-500">اضغط على الشعار لتغييره</p> : null}
                      {logoError ? <p className="text-xs text-red-600">{logoError}</p> : null}
                    </div>
                    <div className="text-right">
                      <h2 className="text-2xl font-extrabold text-slate-900">{user.instituteName || "غير متوفر"}</h2>
                      <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <Badge className="rounded-[6.5px] bg-blue-100 text-blue-700 hover:bg-blue-100">معهد</Badge>
                        <Badge className={`rounded-[6.5px] hover:opacity-100 ${verification.cls}`}>{verification.label}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <Button onClick={() => setIsEditing(true)} className="h-10 rounded-[6.5px] bg-blue-600 hover:bg-blue-700">تعديل البيانات</Button>
                    <Button asChild variant="outline" className="h-10 rounded-[6.5px] border-slate-200">
                      <Link href={user.id ? `/institutes/${user.id}` : "/institutes"}>معاينة صفحة المعهد</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[6.5px] border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge className="rounded-[6.5px] bg-blue-100 text-blue-700 hover:bg-blue-100">تظهر للطلاب</Badge>
                  <CardTitle className="text-right">المعلومات العامة التي تظهر للطلاب</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="اسم المعهد الرسمي" icon={<Building className="h-4 w-4" />} value={user.instituteName} editable={isEditing} onChange={(v) => setUser((p) => ({ ...p, instituteName: v }))} placeholder="أدخل اسم المعهد الرسمي" />
                  <Field label="البريد الإلكتروني" icon={<Mail className="h-4 w-4" />} value={user.email} editable={isEditing} onChange={(v) => setUser((p) => ({ ...p, email: v, publicEmail: v }))} placeholder="أدخل البريد الإلكتروني" />
                  <Field label="رقم الهاتف" icon={<Phone className="h-4 w-4" />} value={user.phone} editable={isEditing} onChange={(v) => setUser((p) => ({ ...p, phone: v, publicPhone: v }))} placeholder="أدخل رقم الهاتف" />
                  <Field label="العنوان النصي" icon={<MapPin className="h-4 w-4" />} value={user.instituteAddress} editable={isEditing} onChange={(v) => setUser((p) => ({ ...p, instituteAddress: v }))} placeholder="مثال: الرياض، حي النرجس، طريق الملك سلمان" emptyText="لم يتم إدخال العنوان" />
                  <Field label="رابط الموقع" type="url" icon={<Globe className="h-4 w-4" />} value={user.instituteWebsite || user.instituteLocationUrl} editable={isEditing} onChange={(v) => setUser((p) => ({ ...p, instituteWebsite: v, instituteLocationUrl: v }))} placeholder="مثال: رابط Google Maps أو رابط موقع المعهد" emptyText="لم يتم إدخال رابط الموقع" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[6.5px] border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge className="rounded-[6.5px] bg-slate-200 text-slate-700 hover:bg-slate-200">لا تظهر للطلاب</Badge>
                  <CardTitle className="text-right">المعلومات الخاصة</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="رقم السجل التجاري / الترخيص" icon={<Hash className="h-4 w-4" />} value={user.licenseNumber} editable={isEditing} onChange={(v) => setUser((p) => ({ ...p, licenseNumber: v }))} placeholder="أدخل رقم السجل التجاري" />
                </div>

                <div className="space-y-2">
                  <Label className="text-right">إثبات الكيان</Label>
                  <div className="rounded-[6.5px] border border-dashed border-slate-200 bg-slate-50 p-4 text-right">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-700">
  {docFiles.licenseDocument
    ? docFiles.licenseDocument.name
    : user.licenseDocument
      ? String(user.licenseDocument).split("/").pop()
      : "لم يتم رفع ملف إثبات الكيان"}
</p>
{docFiles.licenseDocument ? (
  <p className="mt-1 text-xs text-emerald-600">تم اختيار الملف وجاهز للحفظ</p>
) : null}
<p className="text-xs text-slate-500 mt-1">الصيغ المسموحة: صورة أو PDF</p>
                      </div>
                      <div className="flex gap-2">
                        <input
                          id="license-proof"
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            setDocFiles((prev) => ({ ...prev, licenseDocument: file }))
                            setIsEditing(true)
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-[6.5px]"
                          onClick={() => document.getElementById("license-proof")?.click()}
                          disabled={!isEditing}
                        >
                          استبدال الملف
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-start">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={isSaving} className="h-10 rounded-[6.5px] bg-blue-600 hover:bg-blue-700">{isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}</Button>
                  <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving} className="h-10 rounded-[6.5px]">إلغاء</Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} className="h-10 rounded-[6.5px] bg-blue-600 hover:bg-blue-700">تعديل البيانات</Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="banks" className="mt-0">
            <Card className="rounded-[6.5px] border border-slate-200 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="text-right">
                  <CardTitle>الحسابات البنكية</CardTitle>
                  <CardDescription>إدارة الحسابات البنكية الخاصة بالمعهد لاستقبال المدفوعات.</CardDescription>
                </div>
                <Button onClick={() => openBankModal()} className="rounded-[6.5px]">إضافة حساب جديد</Button>
              </CardHeader>
              <CardContent>
                {isBankAccountsLoading ? (
                  <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
                ) : bankAccounts.length === 0 ? (
                  <div className="rounded-[6.5px] border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-gray-500">لا توجد حسابات بنكية مضافة بعد.</div>
                ) : (
                  <div className="overflow-x-auto rounded-[6.5px] border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">اسم البنك</TableHead>
                          <TableHead className="text-right">اسم الحساب</TableHead>
                          <TableHead className="text-right">رقم الحساب</TableHead>
                          <TableHead className="text-right">الآيبان (IBAN)</TableHead>
                          <TableHead className="text-left w-[120px]">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bankAccounts.map((account) => (
                          <TableRow key={account.id}>
                            <TableCell className="font-medium">{account.bankName}</TableCell>
                            <TableCell>{account.accountName}</TableCell>
                            <TableCell dir="ltr" className="text-right">{account.accountNumber}</TableCell>
                            <TableCell dir="ltr" className="text-right">{account.iban || "-"}</TableCell>
                            <TableCell className="text-left">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => openBankModal(account)}><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteBankAccount(account.id)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-0">
            <Card className="rounded-[6.5px] border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-right">الأمان وكلمة المرور</CardTitle>
                <CardDescription className="text-right">تأكد من استخدام كلمة مرور قوية وآمنة.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-right">كلمة المرور الحالية</Label>
                  <div className="relative">
                    <Input id="current-password" type={showPassword ? "text" : "password"} className="rounded-[6.5px] pr-10" />
                    <Button type="button" variant="ghost" size="sm" className="absolute left-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-right">كلمة المرور الجديدة</Label>
                  <Input id="new-password" type="password" className="rounded-[6.5px]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-right">تأكيد كلمة المرور الجديدة</Label>
                  <Input id="confirm-password" type="password" className="rounded-[6.5px]" />
                </div>
                <Button className="h-10 rounded-[6.5px] bg-blue-600 hover:bg-blue-700">تغيير كلمة المرور</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isBankModalOpen} onOpenChange={setIsBankModalOpen}>
          <DialogContent dir="rtl" style={{ borderRadius: "6.5px" }} className="sm:max-w-[460px] gap-6 border border-gray-100/80 p-6 shadow-2xl [&>button[data-dialog-close='default']]:hidden">
            <DialogClose asChild>
              <button className="absolute left-4 top-4 rounded-full p-2 text-red-500 transition-all hover:bg-red-50 hover:text-red-600">
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
            <DialogHeader className="w-full items-start gap-1 text-right">
              <DialogTitle className="text-2xl font-bold text-gray-900">{editingAccountId ? "تعديل حساب بنكي" : "إضافة حساب بنكي"}</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">أدخل تفاصيل الحساب البنكي لاستقبال التحويلات.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-5 py-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="bankName" className="text-right text-sm font-semibold text-gray-700">اسم البنك <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input id="bankName" value={bankForm.bankName} onChange={(e) => setBankForm((p) => ({ ...p, bankName: e.target.value }))} placeholder="مثال: البنك الأهلي" style={{ borderRadius: "6.5px" }} className={`h-12 border pl-12 pr-4 text-right font-medium placeholder:text-gray-400 ${errors.bankName ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-blue-500 focus:ring-blue-500"}`} />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Landmark className="h-5 w-5" /></div>
                </div>
                {errors.bankName && <p className="mt-1 text-right text-xs text-red-500">{errors.bankName}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="accountName" className="text-right text-sm font-semibold text-gray-700">اسم صاحب الحساب <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input id="accountName" value={bankForm.accountName} onChange={(e) => setBankForm((p) => ({ ...p, accountName: e.target.value }))} placeholder="الاسم كما يظهر في البنك" style={{ borderRadius: "6.5px" }} className={`h-12 border pl-12 pr-4 text-right font-medium placeholder:text-gray-400 ${errors.accountName ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-blue-500 focus:ring-blue-500"}`} />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><User className="h-5 w-5" /></div>
                </div>
                {errors.accountName && <p className="mt-1 text-right text-xs text-red-500">{errors.accountName}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="accountNumber" className="text-right text-sm font-semibold text-gray-700">رقم الحساب <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input id="accountNumber" value={bankForm.accountNumber} onChange={(e) => setBankForm((p) => ({ ...p, accountNumber: e.target.value }))} placeholder="أدخل رقم الحساب" style={{ borderRadius: "6.5px" }} className={`h-12 border pl-12 pr-4 text-right font-medium placeholder:text-gray-400 ${errors.accountNumber ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-blue-500 focus:ring-blue-500"}`} />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><CreditCard className="h-5 w-5" /></div>
                </div>
                {errors.accountNumber && <p className="mt-1 text-right text-xs text-red-500">{errors.accountNumber}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="iban" className="text-right text-sm font-semibold text-gray-700">الآيبان (IBAN)</Label>
                <div className="relative">
                  <Input id="iban" value={bankForm.iban} onChange={(e) => setBankForm((p) => ({ ...p, iban: e.target.value }))} placeholder="SA..." style={{ borderRadius: "6.5px" }} className={`h-12 border pl-12 pr-4 text-right font-medium placeholder:text-gray-400 ${errors.iban ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-blue-500 focus:ring-blue-500"}`} />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Hash className="h-5 w-5" /></div>
                </div>
                {errors.iban && <p className="mt-1 text-right text-xs text-red-500">{errors.iban}</p>}
              </div>
            </div>
            <DialogFooter className="mt-4 flex w-full flex-row items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsBankModalOpen(false)} style={{ borderRadius: "6.5px" }} className="h-12 border border-gray-200 px-6 text-gray-700 hover:bg-gray-50">إلغاء</Button>
              <Button onClick={handleSaveBankAccount} disabled={isSavingBank} style={{ borderRadius: "6.5px" }} className="h-12 bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700">{isSavingBank ? "جاري الحفظ..." : "حفظ الحساب"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}


