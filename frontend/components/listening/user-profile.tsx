"use client"

import { useState } from "react"
import { ChevronDown, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"

export function UserProfile() {
  const { user, isAuthenticated, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const handleLogout = async () => {
    setShowLogoutDialog(false)
    await logout()
    window.location.href = '/' // Redirect to home after logout
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email.charAt(0).toUpperCase()

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild className="cursor-pointer">
        <Button
          variant="ghost"
          className="h-10 md:h-12 px-3 md:px-4 rounded-full bg-background/80 backdrop-blur-sm border border-border cursor-pointer focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none"
        >
          <div className="flex items-center gap-2 md:gap-3">
            <Avatar className="h-6 w-6 md:h-8 md:w-8">
              <AvatarImage src={user.picture} alt={user.name || user.email} />
              <AvatarFallback className="text-xs md:text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-xs md:text-sm font-medium truncate max-w-32">
                {user.name || user.email.split('@')[0]}
              </span>
            </div>
            {/* Show name on mobile */}
            <div className="md:hidden">
              <span className="text-xs font-medium truncate max-w-20">
                {user.name || user.email.split('@')[0]}
              </span>
            </div>
            <ChevronDown 
              className={`w-3 h-3 md:w-4 md:h-4 text-muted-foreground transition-transform duration-200 ${
                isOpen ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 md:w-64 bg-background border-border"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setShowLogoutDialog(true)}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="sm:max-w-md bg-background border-border">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-xl md:text-2xl font-light tracking-tight">
              Sign out?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm md:text-base text-muted-foreground">
              Are you sure you want to sign out? You'll need to sign in again to access your personalized experience.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel className="w-full sm:w-auto rounded-full cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="w-full sm:w-auto bg-destructive text-white border border-destructive shadow-sm hover:bg-destructive/80 hover:border-destructive/80 transition-colors duration-200 rounded-full cursor-pointer"
            >
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropdownMenu>
  )
}

