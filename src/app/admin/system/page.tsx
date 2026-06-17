"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Settings, Mail, Save, FileText, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"
import { settingsService, SystemSettings } from "@/lib/settings-service"

import { toast } from "sonner"

export default function AdminSystem() {
  const [loading, setLoading] = useState(true)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const [generalSettings, setGeneralSettings] = useState({
    siteName: "",
    siteDescription: "",
    siteLogo: "",
    contactEmail: "",
    supportPhone: "",
    maintenanceMode: "false",
    maintenanceMessage: "",
    maintenanceEndTime: "",
    maintenanceHardMode: false,
    registrationEnabled: "true",
  })

  const [emailSettings, setEmailSettings] = useState({
    fromName: "",
    fromEmail: "",
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
  })

  const [legalSettings, setLegalSettings] = useState({
    termsContent: "",
    termsUpdatedAt: "",
    privacyContent: "",
    privacyUpdatedAt: "",
  })

  const [savingGeneral, setSavingGeneral] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingLegal, setSavingLegal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Load settings on mount
  useEffect(() => {
    settingsService.getSettings()
      .then((data: SystemSettings) => {
        if (data.general) setGeneralSettings({
          siteName: data.general.siteName || "",
          siteDescription: data.general.siteDescription || "",
          siteLogo: data.general.siteLogo || "",
          contactEmail: data.general.contactEmail || "",
          supportPhone: data.general.supportPhone || "",
          maintenanceMode: data.general.maintenanceMode || "false",
          maintenanceMessage: data.general.maintenanceMessage || "",
          maintenanceEndTime: data.general.maintenanceEndTime || "",
          maintenanceHardMode: false,
          registrationEnabled: data.general.registrationEnabled || "true",
        })
        if (data.email) setEmailSettings({
          fromName: data.email.fromName || "",
          fromEmail: data.email.fromEmail || "",
          smtpHost: data.email.smtpHost || "",
          smtpPort: data.email.smtpPort || "587",
          smtpUser: data.email.smtpUser || "",
          smtpPassword: data.email.smtpPassword || "",
        })
        if (data.legal) setLegalSettings({
          termsContent: data.legal.termsContent || "",
          termsUpdatedAt: data.legal.termsUpdatedAt || "",
          privacyContent: data.legal.privacyContent || "",
          privacyUpdatedAt: data.legal.privacyUpdatedAt || "",
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSaveGeneral = async () => {
    setSavingGeneral(true)
    try {
      const { maintenanceMode, maintenanceMessage, maintenanceEndTime, maintenanceHardMode, ...rest } = generalSettings;
      
      await settingsService.saveSection("general", rest as Record<string, string>)
      
      await settingsService.updateMaintenanceMode({
        maintenanceMode,
        maintenanceMessage,
        maintenanceEndTime,
        hardMode: maintenanceHardMode
      })

      toast.success("تم حفظ الإعدادات بنجاح")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل حفظ الإعدادات")
    } finally {
      setSavingGeneral(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const { logoUrl } = await settingsService.uploadSiteLogo(file)
      setGeneralSettings(prev => ({ ...prev, siteLogo: logoUrl }))
      toast.success("تم رفع الشعار بنجاح")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل رفع الشعار")
    } finally {
      setUploadingLogo(false)
      if (e.target) {
        e.target.value = "" // Reset input
      }
    }
  }

  const handleRemoveLogo = async () => {
    setUploadingLogo(true)
    try {
      await settingsService.saveSection('general', { siteLogo: "" })
      setGeneralSettings(prev => ({ ...prev, siteLogo: "" }))
      toast.success("تمت إزالة الشعار واستعادة الشعار الافتراضي")
    } catch (err: any) {
      toast.error("فشل إزالة الشعار")
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSave = useCallback(async (
    section: string,
    values: Record<string, string>,
    setSaving: (s: boolean) => void
  ) => {
    setSaving(true)
    try {
      await settingsService.saveSection(section, values)
      toast.success("تم حفظ الإعدادات بنجاح")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل حفظ الإعدادات")
    } finally {
      setSaving(false)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="mr-3 text-muted-foreground">جارٍ تحميل الإعدادات...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      <AdminPageHeader title="إعدادات النظام" description="إدارة إعدادات المنصة والتكاملات" />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">عام</TabsTrigger>
          <TabsTrigger value="email">البريد</TabsTrigger>
          <TabsTrigger value="legal">المحتوى القانوني</TabsTrigger>
        </TabsList>

        {/* ============================
            TAB: الإعدادات العامة
        ============================= */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                الإعدادات العامة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">اسم المنصة</Label>
                  <Input
                    id="siteName"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">بريد التواصل</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={generalSettings.contactEmail}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, contactEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">رقم الدعم</Label>
                  <Input
                    id="supportPhone"
                    value={generalSettings.supportPhone}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, supportPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">وصف المنصة</Label>
                <Textarea
                  id="siteDescription"
                  rows={3}
                  value={generalSettings.siteDescription}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })}
                />
              </div>

              <div className="flex flex-col space-y-4 rounded-lg border p-4 bg-muted/30">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <Label className="font-bold text-base">شعار المنصة (اللوجو)</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      هذا الشعار سيظهر في جميع صفحات المنصة. ينصح بصورة بخلفية شفافة (PNG) بأبعاد متناسقة.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 space-x-reverse">
                    {generalSettings.siteLogo ? (
                      <div className="relative w-16 h-16 bg-white border rounded p-1 flex items-center justify-center shrink-0 shadow-sm">
                        <img 
                          src={(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + generalSettings.siteLogo} 
                          alt="Logo" 
                          className="max-w-full max-h-full object-contain" 
                        />
                      </div>
                    ) : (
                      <div className="relative w-16 h-16 bg-slate-100 border rounded p-1 flex items-center justify-center shrink-0">
                        <span className="text-[10px] text-muted-foreground text-center">الافتراضي</span>
                      </div>
                    )}
                    <div className="flex flex-col gap-2 shrink-0">
                      <Label htmlFor="logoUpload" className={`cursor-pointer inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium ${uploadingLogo ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
                        {uploadingLogo ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                        {generalSettings.siteLogo ? "تغيير الشعار" : "رفع شعار جديد"}
                        <input 
                          id="logoUpload" 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleLogoUpload} 
                          disabled={uploadingLogo} 
                        />
                      </Label>
                      {generalSettings.siteLogo && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={handleRemoveLogo} 
                          disabled={uploadingLogo}
                          className="h-8"
                        >
                          إزالة الشعار
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-4 rounded-lg border p-4 bg-muted/30">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="maintenanceMode"
                    checked={generalSettings.maintenanceMode === "true"}
                    onCheckedChange={(checked) =>
                      setGeneralSettings({ ...generalSettings, maintenanceMode: String(checked) })
                    }
                  />
                  <Label htmlFor="maintenanceMode" className="font-bold text-base">وضع الصيانة</Label>
                </div>

                {generalSettings.maintenanceMode === "true" && (
                  <div className="pt-4 border-t space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="maintenanceMessage">رسالة الصيانة</Label>
                      <Textarea
                        id="maintenanceMessage"
                        placeholder="المنصة تحت الصيانة حالياً، يرجى المحاولة لاحقاً."
                        value={generalSettings.maintenanceMessage}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, maintenanceMessage: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maintenanceEndTime">وقت الانتهاء المتوقع (اختياري)</Label>
                      <Input
                        id="maintenanceEndTime"
                        placeholder="مثال: غداً الساعة 8 صباحاً"
                        value={generalSettings.maintenanceEndTime}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, maintenanceEndTime: e.target.value })}
                      />
                    </div>
                    <div className="flex items-start space-x-2 space-x-reverse pt-2">
                      <Switch
                        id="maintenanceHardMode"
                        checked={generalSettings.maintenanceHardMode}
                        onCheckedChange={(checked) =>
                          setGeneralSettings({ ...generalSettings, maintenanceHardMode: checked })
                        }
                      />
                      <div className="space-y-1">
                        <Label htmlFor="maintenanceHardMode" className="leading-none">إنهاء الجلسات النشطة فوراً (Hard Mode)</Label>
                        <p className="text-xs text-muted-foreground">سيتم تسجيل خروج جميع الطلاب والمدربين إجبارياً فور الحفظ.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>



              <Button
                onClick={handleSaveGeneral}
                disabled={savingGeneral}
                className="min-w-[140px]"
              >
                {savingGeneral ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
                {savingGeneral ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================
            TAB: البريد الإلكتروني
        ============================= */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                إعدادات البريد الإلكتروني
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fromName">اسم المرسل</Label>
                  <Input
                    id="fromName"
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">بريد المرسل</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP User</Label>
                  <Input
                    id="smtpUser"
                    value={emailSettings.smtpUser}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <div className="relative">
                    <Input
                      id="smtpPassword"
                      type={showPassword ? "text" : "password"}
                      value={emailSettings.smtpPassword}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                      placeholder="اترك فارغاً للإبقاء على الحالي"
                      dir="ltr"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleSave("email", emailSettings, setSavingEmail)}
                disabled={savingEmail}
                className="min-w-[140px]"
              >
                {savingEmail ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
                {savingEmail ? "جارٍ الحفظ..." : "حفظ إعدادات البريد"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================
            TAB: المحتوى القانوني
        ============================= */}
        <TabsContent value="legal">
          <div className="space-y-6">
            {/* الشروط والأحكام */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  الشروط والأحكام
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="space-y-2">
                  <Label htmlFor="termsContent">محتوى الشروط والأحكام</Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    استخدم <code>## </code> قبل النص لجعله عنواناً رئيسياً (مثال: <code>## مقدمة</code>).<br />
                    استخدم <code>- </code> قبل الأسطر لإنشاء قائمة نقطية (مثال: <code>- النقطة الأولى</code>).<br />
                    استخدم أسطر فارغة للفصل بين الفقرات العادية.
                  </p>
                  <Textarea
                    id="termsContent"
                    rows={16}
                    value={legalSettings.termsContent}
                    onChange={(e) => setLegalSettings({ ...legalSettings, termsContent: e.target.value })}
                    placeholder="اكتب محتوى الشروط والأحكام هنا..."
                    className="font-mono text-sm leading-7"
                  />
                </div>
              </CardContent>
            </Card>

            {/* سياسة الخصوصية */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  سياسة الخصوصية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="space-y-2">
                  <Label htmlFor="privacyContent">محتوى سياسة الخصوصية</Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    استخدم <code>## </code> قبل النص لجعله عنواناً رئيسياً (مثال: <code>## مقدمة</code>).<br />
                    استخدم <code>- </code> قبل الأسطر لإنشاء قائمة نقطية (مثال: <code>- النقطة الأولى</code>).<br />
                    استخدم أسطر فارغة للفصل بين الفقرات العادية.
                  </p>
                  <Textarea
                    id="privacyContent"
                    rows={16}
                    value={legalSettings.privacyContent}
                    onChange={(e) => setLegalSettings({ ...legalSettings, privacyContent: e.target.value })}
                    placeholder="اكتب محتوى سياسة الخصوصية هنا..."
                    className="font-mono text-sm leading-7"
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={() => {
                const today = new Date().toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
                const updatedSettings = {
                  ...legalSettings,
                  termsUpdatedAt: today,
                  privacyUpdatedAt: today
                };
                setLegalSettings(updatedSettings);
                handleSave("legal", updatedSettings, setSavingLegal);
              }}
              disabled={savingLegal}
              className="min-w-[140px]"
            >
              {savingLegal ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
              {savingLegal ? "جارٍ الحفظ..." : "حفظ المحتوى القانوني"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
