import { useState, useEffect, useCallback } from "react";
import { Outlet, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Film, 
  FolderOpen, 
  Settings, 
  Menu, 
  X,
  ChevronLeft,
  Search,
  FolderHeart,
  Crown,
  LogOut,
  User,
  Gift,
  Copy,
  Users,
  BarChart3,
  Key,
  ImageOff,
  StarOff,
  CalendarOff,
  Clock,
  AlertTriangle,
  Database,
  HardDrive,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

function SidebarWidgets() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState({ total: 0, noPoster: 0, noRating: 0, noYear: 0, dirs: 0 });
  const activeQf = searchParams.get('qf');

  const refreshStats = useCallback(() => {
    try {
      const raw = localStorage.getItem('obsidian_cinema_local_movies');
      const movies = raw ? JSON.parse(raw) : [];
      const dirs = localStorage.getItem('obsidian_cinema_local_dirs');
      const dirCount = dirs ? JSON.parse(dirs).length : 0;
      const favs = localStorage.getItem('obsidian_cinema_favorites');
      const favList = favs ? JSON.parse(favs) : [];
      const now = Date.now();
      const RECENT_LIMIT = 100;
      const moviesWithAdded = movies.filter(m => m.added_at).sort((a, b) => (b.added_at || 0) - (a.added_at || 0));
      const recentIds = new Set(moviesWithAdded.slice(0, RECENT_LIMIT).map(m => m.id));
      setStats({
        total: movies.length,
        noPoster: movies.filter(m => !m.poster_path).length,
        noRating: movies.filter(m => !m.rating).length,
        noYear: movies.filter(m => !m.year).length,
        recentCount: recentIds.size,
        recentIds: recentIds,
        favCount: favList.length,
        dirs: dirCount
      });
    } catch {}
  }, []);

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  const toggleFilter = (qf) => {
    if (activeQf === qf) {
      setSearchParams({});
    } else {
      setSearchParams({ qf });
    }
  };

  const qfBtn = (label, icon, qf, count) => (
    <button
      onClick={() => toggleFilter(qf)}
      className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-colors ${
        activeQf === qf
          ? 'bg-primary/20 text-primary'
          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
      }`}
      data-testid={`qf-${qf}`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {count > 0 && <span className="text-[10px] opacity-70">{count}</span>}
    </button>
  );

  if (stats.total === 0) return null;

  return (
    <div className="px-3 mt-4 space-y-4 overflow-y-auto">
      {/* Divider */}
      <div className="border-t border-border/50" />

      {/* Quick Filters */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1.5 px-2">Quick Filters</p>
        <div className="space-y-0.5">
          {qfBtn("Favorites", <Star className="w-3.5 h-3.5" />, "favorites", stats.favCount)}
          {qfBtn("No Poster", <ImageOff className="w-3.5 h-3.5" />, "no-poster", stats.noPoster)}
          {qfBtn("No Rating", <StarOff className="w-3.5 h-3.5" />, "no-rating", stats.noRating)}
          {qfBtn("No Year", <CalendarOff className="w-3.5 h-3.5" />, "no-year", stats.noYear)}
          {qfBtn("Recently Added", <Clock className="w-3.5 h-3.5" />, "recent", stats.recentCount)}
        </div>
      </div>

      {/* Mini Stats */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1.5 px-2">Library</p>
        <div className="px-2 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground"><Database className="w-3 h-3" /> Movies</span>
            <span className="text-foreground font-medium">{stats.total.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground"><HardDrive className="w-3 h-3" /> Directories</span>
            <span className="text-foreground font-medium">{stats.dirs}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const Sidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const { user, logout, isPro } = useAuth();
  
  // Check if running in Electron
  const desktopMode = typeof window !== 'undefined' && window.electronAPI?.isElectron?.();
  
  // Different nav items for web vs desktop
  const navItems = desktopMode 
    ? [
        { path: "/", icon: Film, label: "Library" },
        { path: "/stats", icon: BarChart3, label: "Stats" },
        { path: "/collections", icon: FolderHeart, label: "Collections" },
        { path: "/settings", icon: Settings, label: "Settings" },
      ]
    : [
        { path: "/", icon: Film, label: "Dashboard" },
        { path: "/settings", icon: Settings, label: "Settings" },
      ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

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
        
        {/* Upgrade to Pro button (for free users) */}
        {user && !isPro && (
          <NavLink
            to="/upgrade"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-400 hover:from-amber-500/20 hover:to-orange-500/20"
              } ${collapsed ? "justify-center" : ""}`
            }
            data-testid="nav-upgrade"
          >
            <Crown className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-medium text-sm whitespace-nowrap overflow-hidden"
                >
                  Upgrade to Pro
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        )}
      </nav>

      {/* Sidebar Widgets (desktop mode only) */}
      {desktopMode && !collapsed && <SidebarWidgets />}
      {desktopMode && collapsed && (
        <div className="px-3 mt-2 space-y-1">
          <NavLink to="/?qf=no-poster" className="flex justify-center p-2 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-white" title="No Poster">
            <ImageOff className="w-4 h-4" />
          </NavLink>
          <NavLink to="/?qf=no-rating" className="flex justify-center p-2 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-white" title="No Rating">
            <StarOff className="w-4 h-4" />
          </NavLink>
        </div>
      )}

      {/* User section */}
      <div className="px-3 mt-auto">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full ${collapsed ? "p-2 justify-center" : "justify-start px-3 py-3"} h-auto hover:bg-white/5`}
                data-testid="user-menu-btn"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.picture} alt={user.name} />
                  <AvatarFallback className="bg-primary/20 text-primary text-sm">
                    {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="ml-3 text-left overflow-hidden"
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate max-w-[120px]">
                          {user.name || "User"}
                        </p>
                        {isPro && (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs px-1.5 py-0">
                            <Crown className="w-3 h-3 mr-0.5" />
                            Pro
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                        {user.email}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              {isPro ? (
                <>
                  <DropdownMenuItem onClick={() => navigate("/upgrade")}>
                    <Key className="w-4 h-4 mr-2 text-amber-400" />
                    License Key
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => navigate("/upgrade")} className="text-amber-400">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-lg bg-secondary/50 border border-border/50 mt-4"
              >
                <p className="text-xs text-muted-foreground">
                  Powered by TMDB
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
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
