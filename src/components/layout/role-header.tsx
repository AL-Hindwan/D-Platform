"use client"

import Link from "next/link"
import Image from "next/image"
import { AlignJustify, Heart, LogOut, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn, getFileUrl } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { useNotifications } from "@/contexts/notification-context"
import { usePlatform } from "@/contexts/platform-context"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { DashboardRole, ROLE_LAYOUT_CONFIG, notificationIcon } from "./role-layout-config"
import { instituteService } from "@/lib/institute-service"
import { PLATFORM_NAME } from "@/lib/brand"

interface RoleHeaderProps {
  role: DashboardRole
  isSidebarOpen: boolean
  onMenuClick: () => void
}

export function RoleHeader({ role, isSidebarOpen, onMenuClick }: RoleHeaderProps) {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const { settings } = usePlatform()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const siteName = settings?.general.siteName || PLATFORM_NAME
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const config = ROLE_LAYOUT_CONFIG[role]
  const NotificationIcon = notificationIcon
  const isHallsPage = pathname?.startsWith("/trainer/halls") || pathname?.startsWith("/institute/halls")
  const isSearchPage = pathname?.startsWith(config.searchRoute) || isHallsPage
  const currentQuery = isSearchPage ? (searchParams.get("q") ?? "") : ""
  const [profileAvatarSrc, setProfileAvatarSrc] = useState<string | undefined>(undefined)
  const dashboardUrl = config.navItems[0]?.href || "/"

  const submitSearch = () => {
    const value = (searchInputRef.current?.value || "").trim()
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set("q", value)
    else params.delete("q")
    const query = params.toString()
    if (isHallsPage) {
      const targetPath = pathname || config.searchRoute
      router.push(query ? `${targetPath}?${query}` : targetPath)
      return
    }
    router.push(query ? `${config.searchRoute}?${query}` : config.searchRoute)
  }

  const userWithMedia = user as (typeof user & {
    image?: string
    profileImage?: string
    logo?: string
    instituteLogo?: string
    institute?: { logo?: string; instituteLogo?: string }
  }) | null
  const avatarCandidate =
    userWithMedia?.avatar ||
    userWithMedia?.image ||
    userWithMedia?.profileImage ||
    userWithMedia?.logo ||
    userWithMedia?.instituteLogo ||
    userWithMedia?.institute?.logo ||
    userWithMedia?.institute?.instituteLogo
  const avatarSrc = getFileUrl(avatarCandidate)
  const finalAvatarSrc = (userWithMedia?.avatar ? getFileUrl(userWithMedia.avatar) : undefined) || profileAvatarSrc || avatarSrc

  useEffect(() => {
    let cancelled = false
    const loadProfileAvatar = async () => {
      if (role !== "INSTITUTE_ADMIN") {
        setProfileAvatarSrc(undefined)
        return
      }
      try {
        const profile = await instituteService.getProfile()
        if (cancelled) return
        const candidate =
          profile?.avatar ||
          profile?.profileImage ||
          profile?.instituteLogo ||
          profile?.logo ||
          profile?.image
        setProfileAvatarSrc(getFileUrl(candidate))
      } catch {
        if (!cancelled) setProfileAvatarSrc(undefined)
      }
    }

    void loadProfileAvatar()
    return () => {
      cancelled = true
    }
  }, [role])

  return (
    <header className="sticky top-0 z-[60] h-[72px] border-b border-slate-200/70 bg-white px-4 md:px-6" dir="rtl">
      <div className="grid h-full grid-cols-[auto_minmax(0,560px)_auto] items-center gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-11 w-11 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            title={isSidebarOpen ? "تصغير القائمة الجانبية" : "توسيع القائمة الجانبية"}
          >
            <AlignJustify className={cn("h-6 w-6 transition-transform duration-300", isSidebarOpen ? "rotate-90" : "rotate-0")} />
            <span className="sr-only">القائمة</span>
          </Button>

          <Link href={dashboardUrl} className="flex items-center gap-2">
            <div className="relative h-9 w-9 rounded-md bg-white">
              <Image src={getFileUrl(settings?.general?.siteLogo) || "/images/logo.png"} alt={siteName} fill className="object-contain p-0.5" unoptimized />
            </div>
            <div className="hidden lg:block">
              <p className="text-xl font-extrabold leading-none text-[#2563EB]">{siteName}</p>
            </div>
          </Link>
        </div>

        <div className="hidden w-full max-w-[560px] justify-self-center lg:block">
          <div className="relative">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              key={`${pathname || "root"}-${currentQuery}`}
              ref={searchInputRef}
              type="text"
              dir="rtl"
              defaultValue={currentQuery}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  submitSearch()
                }
              }}
              placeholder={config.searchPlaceholder}
              className="h-11 w-full rounded-full border border-[#E5E7EB] bg-slate-50/70 pr-12 pl-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            <button type="button" onClick={submitSearch} className="absolute right-0 top-0 h-11 w-11 rounded-full" aria-label="بحث" />
          </div>
        </div>

        <div className="mr-auto flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" className="rounded-full text-slate-500 hover:bg-blue-50 hover:text-[#2563EB] lg:hidden" onClick={submitSearch}>
            <Search className="h-5 w-5" />
          </Button>

          {role !== "STUDENT" && config.favoritesPath && (
            <Button variant="ghost" size="icon" asChild className="rounded-full text-slate-500 hover:bg-blue-50 hover:text-[#2563EB]">
              <Link href={config.favoritesPath} title="المفضلة">
                <Heart className="h-5 w-5" />
              </Link>
            </Button>
          )}

          {config.notificationsPath && (
            <Button variant="ghost" size="icon" asChild className="relative rounded-full text-slate-500 hover:bg-blue-50 hover:text-[#2563EB]">
              <Link href={config.notificationsPath} title="الإشعارات">
                <NotificationIcon className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 h-4 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] leading-4 text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button suppressHydrationWarning type="button" className="flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-slate-100">
                <Avatar className="h-10 w-10 border border-slate-200">
                  <AvatarImage src={finalAvatarSrc} alt={user?.name ?? "user"} />
                  <AvatarFallback className="bg-blue-50 font-bold text-[#2563EB]">{(user?.name || "?").charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="hidden text-right sm:block">
                  <p className="mb-1 text-sm font-bold leading-none text-slate-900">{user?.name || "غير محدد"}</p>
                  <p className="text-xs leading-none text-slate-500">{config.roleLabel}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" dir="rtl" className="w-56 text-right">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1 text-right">
                  <p className="text-sm font-semibold leading-none">{user?.name || "غير محدد"}</p>
                  <p className="text-xs leading-none text-slate-500">{user?.email || "-"}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={config.profilePath} className="flex w-full items-center justify-start gap-2 text-right cursor-pointer">
                  <User className="h-4 w-4" />
                  الملف الشخصي
                </Link>
              </DropdownMenuItem>
              {config.notificationsPath && (
                <DropdownMenuItem asChild>
                  <Link href={config.notificationsPath} className="flex w-full items-center justify-start gap-2 text-right cursor-pointer">
                    <NotificationIcon className="h-4 w-4" />
                    الإشعارات
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-red-600 focus:text-red-600 flex items-center justify-start gap-2 text-right">
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

