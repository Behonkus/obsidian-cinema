import { motion } from "framer-motion";
import { FolderOpen, Film, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const emptyStateBg = "https://images.unsplash.com/photo-1762541693135-fb989de961e1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHw0fHxjaW5lbWElMjB0aGVhdGVyJTIwZGFyayUyMGludGVyaW9yfGVufDB8fHx8MTc3MDIyMjgyNXww&ixlib=rb-4.1.0&q=85";

export default function EmptyState({ type = "no-movies" }) {
  const navigate = useNavigate();

  const content = {
    "no-directories": {
      icon: FolderOpen,
      title: "No Directories Added",
      description: "Add movie directories to start building your library",
      action: {
        label: "Add Directory",
        onClick: () => navigate("/directories"),
      },
    },
    "no-movies": {
      icon: Film,
      title: "No Movies Found",
      description: "Add directories and scan for movie files to populate your library",
      action: {
        label: "Manage Directories",
        onClick: () => navigate("/directories"),
      },
    },
    "no-results": {
      icon: Film,
      title: "No Results Found",
      description: "Try adjusting your search or filters",
      action: null,
    },
  };

  const { icon: Icon, title, description, action } = content[type] || content["no-movies"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
      data-testid="empty-state"
    >
      {/* Background image with overlay */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <img
          src={emptyStateBg}
          alt=""
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/60" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-md">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center"
        >
          <Icon className="w-10 h-10 text-primary" />
        </motion.div>
        
        <h2 className="text-2xl font-bold font-[Outfit] text-foreground mb-2">
          {title}
        </h2>
        <p className="text-muted-foreground mb-6">
          {description}
        </p>
        
        {action && (
          <Button
            className="bg-primary hover:bg-primary/90 rounded-full px-8 py-6 font-semibold glow-primary"
            onClick={action.onClick}
            data-testid="empty-state-action-btn"
          >
            <Plus className="w-5 h-5 mr-2" />
            {action.label}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
