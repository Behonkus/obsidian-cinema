import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Film, 
  FolderOpen, 
  Settings, 
  Menu, 
  X,
  ChevronLeft,
  Search,
  FolderHeart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Sidebar = ({ collapsed, setCollapsed }) => {
  const navItems = [
    { path: "/", icon: Film, label: "Library" },
    { path: "/collections", icon: FolderHeart, label: "Collections" },
    { path: "/directories", icon: FolderOpen, label: "Directories" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-full bg-background/95 backdrop-blur-xl border-r border-border z-50 flex flex-col py-6"
      data-testid="sidebar"
    >
      {/* Logo */}
      <div className="px-4 mb-8 flex items-center justify-between">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Film className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold font-[Outfit] tracking-tight text-foreground">
                  Obsidian
                </h1>
                <p className="text-xs text-muted-foreground -mt-1">Cinema</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hover:bg-white/5 text-muted-foreground hover:text-white"
          data-testid="toggle-sidebar-btn"
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              } ${collapsed ? "justify-center" : ""}`
            }
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-medium text-sm whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 mt-auto">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 rounded-lg bg-secondary/50 border border-border/50"
            >
              <p className="text-xs text-muted-foreground">
                Powered by TMDB
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      
      <motion.main
        initial={false}
        animate={{ marginLeft: sidebarCollapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="min-h-screen"
      >
        <Outlet context={{ sidebarCollapsed }} />
      </motion.main>
    </div>
  );
}
