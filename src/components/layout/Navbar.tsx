
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Calendar, Settings, LayoutDashboard, Settings as SettingsIcon, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "../../contexts/AuthContext";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from "../ui/menubar";
import { AspectRatio } from "../ui/aspect-ratio";

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-background border-b shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg text-primary">
            <div className="w-8 h-8">
              <AspectRatio ratio={1/1} className="overflow-hidden">
                <img 
                  src="/lovable-uploads/d1df28cb-f0ae-4b17-aacf-f7e08d48d146.png" 
                  alt="MSLab Logo" 
                  className="object-contain w-full h-full" 
                />
              </AspectRatio>
            </div>
            MSLab Scheduler
          </Link>
          
          <Menubar className="hidden md:flex border-none bg-transparent">
            <MenubarMenu>
              <MenubarTrigger className={cn(
                "cursor-pointer",
                isActive("/") && "bg-muted text-foreground"
              )}>
                <Link to="/" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </MenubarTrigger>
            </MenubarMenu>
            
            <MenubarMenu>
              <MenubarTrigger className={cn(
                "cursor-pointer",
                isActive("/calendar") && "bg-muted text-foreground"
              )}>
                <Link to="/calendar" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Calendar
                </Link>
              </MenubarTrigger>
            </MenubarMenu>
            
            <MenubarMenu>
              <MenubarTrigger className={cn(
                "cursor-pointer",
                isActive("/instruments") && "bg-muted text-foreground"
              )}>
                <Link to="/instruments" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Instruments
                </Link>
              </MenubarTrigger>
            </MenubarMenu>
            
            <MenubarMenu>
              <MenubarTrigger className={cn(
                "cursor-pointer",
                isActive("/analytics") && "bg-muted text-foreground"
              )}>
                <Link to="/analytics" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Analytics
                </Link>
              </MenubarTrigger>
            </MenubarMenu>
            
            {user?.role === "admin" && (
              <MenubarMenu>
                <MenubarTrigger className={cn(
                  "cursor-pointer",
                  isActive("/admin") && "bg-muted text-foreground"
                )}>
                  <Link to="/admin" className="flex items-center gap-2">
                    <SettingsIcon className="h-4 w-4" />
                    Admin
                  </Link>
                </MenubarTrigger>
              </MenubarMenu>
            )}
          </Menubar>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center cursor-pointer w-full">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center cursor-pointer w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={logout}
                >
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" asChild>
              <Link to="/login">Log In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
