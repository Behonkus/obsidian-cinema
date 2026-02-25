import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FolderHeart, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Film,
  Edit2,
  MoreVertical,
  Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Preset colors for collections
const COLORS = [
  { name: "Red", value: "#e11d48" },
  { name: "Orange", value: "#ea580c" },
  { name: "Yellow", value: "#ca8a04" },
  { name: "Green", value: "#16a34a" },
  { name: "Teal", value: "#0d9488" },
  { name: "Blue", value: "#2563eb" },
  { name: "Purple", value: "#9333ea" },
  { name: "Pink", value: "#db2777" },
];

export default function CollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState("#e11d48");
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/collections`);
      setCollections(response.data);
    } catch (err) {
      console.error("Failed to load collections:", err);
      toast.error("Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newName.trim()) {
      toast.error("Please enter a collection name");
      return;
    }

    setIsSaving(true);
    try {
      await axios.post(`${API}/collections`, {
        name: newName.trim(),
        description: newDescription.trim() || null,
        color: newColor,
      }, { withCredentials: true });
      toast.success("Collection created!");
      setNewName("");
      setNewDescription("");
      setNewColor("#e11d48");
      setIsAddDialogOpen(false);
      loadCollections();
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error(err.response.data.detail, {
          duration: 8000,
          action: {
            label: "Upgrade",
            onClick: () => window.location.href = "/upgrade"
          }
        });
      } else {
        toast.error("Failed to create collection");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCollection = async () => {
    if (!editingCollection || !newName.trim()) return;

    setIsSaving(true);
    try {
      await axios.put(`${API}/collections/${editingCollection.id}`, {
        name: newName.trim(),
        description: newDescription.trim() || null,
        color: newColor,
      });
      toast.success("Collection updated!");
      setIsEditDialogOpen(false);
      setEditingCollection(null);
      loadCollections();
    } catch (err) {
      toast.error("Failed to update collection");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCollection = async (id) => {
    try {
      await axios.delete(`${API}/collections/${id}`);
      toast.success("Collection deleted");
      loadCollections();
    } catch (err) {
      toast.error("Failed to delete collection");
    }
  };

  const openEditDialog = (collection) => {
    setEditingCollection(collection);
    setNewName(collection.name);
    setNewDescription(collection.description || "");
    setNewColor(collection.color || "#e11d48");
    setIsEditDialogOpen(true);
  };

  const handleViewCollection = (collection) => {
    navigate(`/?collection=${collection.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-10" data-testid="collections-page">
      {/* Hero glow effect */}
      <div className="hero-glow-bg" />
      
      {/* Header */}
      <div className="relative z-10 mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-[Outfit] tracking-tight text-foreground">
              Collections
            </h1>
            <p className="text-muted-foreground mt-1">
              Organize your movies into custom playlists
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-primary hover:bg-primary/90 rounded-full px-6 glow-primary"
                data-testid="create-collection-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Collection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Collection</DialogTitle>
                <DialogDescription>
                  Create a new collection to group your movies together.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Marvel Movies, Movie Night"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="mt-1.5"
                    data-testid="collection-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What's this collection about?"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="mt-1.5"
                    data-testid="collection-description-input"
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {COLORS.map((color) => (
                      <button
                        key={color.value}
                        className={`w-8 h-8 rounded-full transition-transform ${
                          newColor === color.value ? "ring-2 ring-white ring-offset-2 ring-offset-background scale-110" : ""
                        }`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setNewColor(color.value)}
                        title={color.name}
                        type="button"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCollection}
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90"
                  data-testid="confirm-create-btn"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
      
      {/* Collections grid */}
      {collections.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <FolderHeart className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No Collections Yet
          </h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Create your first collection to start organizing your movies.
          </p>
          <Button
            className="bg-primary hover:bg-primary/90 rounded-full px-6"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Collection
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {collections.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="bg-card border-border hover:border-border/80 transition-all cursor-pointer group"
                  onClick={() => handleViewCollection(collection)}
                  data-testid={`collection-card-${collection.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${collection.color}20` }}
                        >
                          <FolderHeart className="w-5 h-5" style={{ color: collection.color }} />
                        </div>
                        <div>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {collection.name}
                          </CardTitle>
                          {collection.description && (
                            <CardDescription className="text-xs line-clamp-1">
                              {collection.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(collection);
                          }}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Collection?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will delete the collection "{collection.name}". 
                                  Movies will not be deleted, only removed from this collection.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCollection(collection.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      <Film className="w-3 h-3" />
                      {collection.movie_ids?.length || 0} movies
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
            <DialogDescription>
              Update your collection details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      newColor === color.value ? "ring-2 ring-white ring-offset-2 ring-offset-background scale-110" : ""
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setNewColor(color.value)}
                    title={color.name}
                    type="button"
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditCollection}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Edit2 className="w-4 h-4 mr-2" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
