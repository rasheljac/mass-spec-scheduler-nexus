
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="border-b">
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold text-mslab-400">
            MS Lab Scheduler
          </Link>
          
          {user && (
            <nav className="hidden md:flex ml-6 space-x-4">
              <Link to="/" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted">
                Dashboard
              </Link>
              <Link to="/calendar" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted">
                Calendar
              </Link>
              <Link to="/instruments" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted">
                Instruments
              </Link>
              <Link to="/analytics" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted">
                Analytics
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-mslab-400 text-white">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span className="text-sm font-medium">{user.name}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span className="text-xs capitalize bg-mslab-300 text-white px-2 py-1 rounded-full">
                    {user.role}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={logout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
