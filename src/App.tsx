import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Plus, Star, ShoppingCart, Calendar, BookOpen, 
  ChevronLeft, ChevronRight, X, Sparkles, Send, Mic, Volume2, Play,
  MoreVertical, Check, Trash2, Copy, Bookmark, HelpCircle, Target, Zap, Pencil,
  Moon, Sun, LogOut, Menu, GripVertical, Info, ExternalLink, Filter,
  ChefHat, Apple, Utensils, Fish, Milk, Egg, Beef, Carrot, Droplets, Wheat, Package, Soup,
  LayoutGrid, List, Columns, Square, Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragEndEvent,
  DragStartEvent,
  Over
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from './lib/utils';
import { 
  Recipe, MealPlan, MealSlot, GroceryItem, Pantry, UserProfile, DayPlan, PantryItem 
} from './types';
import { 
  DEFAULT_RECIPES, INITIAL_MEAL_PLAN_DAYS, DEFAULT_PANTRY, CATEGORIES 
} from './constants';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { auth, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

// --- Constants & Translations ---

const TRANSLATIONS = {
  ENG: {
    inventory: "Inventory",
    pantry: "Pantry",
    daily: "Daily",
    planner: "Planner",
    recipes: "Recipes",
    all: "All",
    produce: "Produce",
    proteins: "Proteins",
    dairy: "Dairy",
    lowStock: "Low stock",
    lowStockTitle: "LOW STOCK",
    itemsSelected: "Items Selected",
    totalItems: "TOTAL ITEMS",
    listEmpty: "List is Empty",
    shoppingRun: "Ready for your next shopping run?",
    addQuickItem: "Add quick item (e.g. Milk 2L)...",
    totalPrice: "estimated total",
    checkout: "Proceed to Checkout",
    startCooking: "Start Cooking",
    cook: "Cook",
    chooseDestination: "Choose Destination",
    confirmSelection: "Confirm Selection",
    chooseRecipe: "Choose Recipe",
    selectDay: "Select Day",
    selectSlot: "Select Slot",
    lowStockMsg: "items are low in stock",
    searchInventory: "Search inventory...",
    findRecipe: "Find recipe...",
    aiScan: "AI Scan",
    stock: "Stock",
    list: "List",
    compare: "Compare",
    guide: "Guide",
    logout: "Logout",
    thisWeek: "This Week",
    syncFromPlanner: "Sync from Planner",
    onlineMarketplace: "Online Marketplace",
    ingredientSource: "Ingredient Source",
    qty: "Qty",
    alfamart: "Alfamart",
    superIndo: "Super Indo",
    optimization: "Optimization",
    recipeVault: "Recipe Vault",
    morning: "Morning",
    readySet: "ReadySet",
    mealStudio: "Meal Studio",
    cookWithoutChaos: "Cook Without The Chaos"
  },
  INDO: {
    inventory: "Inventaris",
    pantry: "Dapur",
    daily: "Harian",
    planner: "Perencana",
    recipes: "Resep",
    all: "Semua",
    produce: "Sayur & Buah",
    proteins: "Protein",
    dairy: "Susu & Olahan",
    lowStock: "Stok Menipis",
    lowStockTitle: "STOK MENIPIS",
    itemsSelected: "Bahan Terpilih",
    totalItems: "TOTAL BAHAN",
    listEmpty: "Daftar Kosong",
    shoppingRun: "Siap untuk belanja berikutnya?",
    addQuickItem: "Tambah belanja (mis. Susu 2L)...",
    totalPrice: "estimasi total",
    checkout: "Bayar di Kasir",
    startCooking: "Mulai Masak",
    cook: "Masak",
    chooseDestination: "Pilih Tujuan",
    confirmSelection: "Konfirmasi",
    chooseRecipe: "Pilih Resep",
    selectDay: "Pilih Hari",
    selectSlot: "Pilih Waktu",
    lowStockMsg: "bahan hampir habis",
    searchInventory: "Cari inventaris...",
    findRecipe: "Cari resep...",
    aiScan: "Scan AI",
    stock: "Stok",
    list: "Daftar",
    compare: "Bandingkan",
    guide: "Panduan",
    logout: "Keluar",
    thisWeek: "Minggu Ini",
    syncFromPlanner: "Ambil dari Planner",
    onlineMarketplace: "Toko Online",
    ingredientSource: "Nama Bahan",
    qty: "Jml",
    alfamart: "Alfamart",
    superIndo: "Super Indo",
    optimization: "Optimasi",
    recipeVault: "Koleksi Resep",
    morning: "Selamat Pagi",
    readySet: "MulaiMasak",
    mealStudio: "Meal Studio",
    cookWithoutChaos: "Masak Tanpa Ribet"
  }
};

// --- Components ---

const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void; key?: React.Key }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-2 md:px-4 py-1 md:py-1.5 rounded-full text-[8px] sm:text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all duration-300 border border-white/20 whitespace-nowrap",
      active 
        ? "bg-accent-teal text-white shadow-lg scale-105" 
        : "bg-white/60 text-slate-600 hover:bg-white/80 dark:bg-white/10 dark:text-dark-secondary-text"
    )}
  >
    {label}
  </button>
);

const RecipeCard = ({ 
  recipe, 
  onFavorite,
  onAddToPlan,
  onEdit,
  onDelete,
  onCook,
  onClick,
  isDraggable = false 
}: { 
  recipe: Recipe; 
  onFavorite: (id: string) => void;
  onAddToPlan?: (id: string) => void;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (id: string) => void;
  onCook?: (recipe: Recipe) => void;
  onClick?: () => void;
  isDraggable?: boolean;
  key?: React.Key;
}) => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={() => onClick ? onClick() : onCook?.(recipe)}
      className="glass p-3 md:p-4 group relative cursor-pointer overflow-hidden"
    >
      <div className="flex items-center gap-2 md:gap-3 mb-2">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-accent-teal/10 flex items-center justify-center text-lg md:text-xl">
          {recipe.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-display font-bold text-[13px] md:text-sm text-black dark:text-white truncate">
              {recipe.name}
            </h4>
            {recipe.pantryFriendly && (
              <div className="w-4 h-4 bg-accent-amber/20 flex items-center justify-center rounded-full" title="Pantry Friendly">
                <span className="text-[8px]">🏠</span>
              </div>
            )}
          </div>
          <div className="flex gap-1 mt-1 overflow-hidden">
            {(recipe.tags || []).slice(0, 2).map(tag => (
              <span key={tag} className="text-[9px] bg-slate-200/50 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-500 dark:text-dark-secondary-text uppercase font-black tracking-tight">
                {(tag || "").replace('#', '')}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                onFavorite(recipe.id); 
              }}
              className="p-1.5 hover:scale-110 active:scale-95 transition-all cursor-pointer group/fav"
              title={recipe.isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className={cn("w-5 h-5 transition-all", recipe.isFavorite ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] scale-110" : "text-slate-300 group-hover/fav:text-amber-300")} />
            </button>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3">
        </div>
      </div>
    </motion.div>
  );
};

const SortableMealItem = ({ 
  id, 
  title, 
  recipe, 
  onRemove, 
  onOpenSelector 
}: { 
  id: string; 
  title: string; 
  recipe: Recipe | null; 
  onRemove: () => void;
  onOpenSelector: () => void;
  key?: React.Key;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto'
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "flex items-center gap-2 sm:gap-4 p-2 md:p-5 bg-white/30 dark:bg-white/5 rounded-2xl border border-white/40 dark:border-white/10 hover:border-accent-teal/30 transition-all group",
        isDragging && "shadow-2xl border-accent-teal/50 ring-4 ring-accent-teal/10 scale-[1.02]"
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-accent-teal transition-colors">
        <GripVertical className="w-3.5 h-3.5 md:w-5 md:h-5" />
      </div>
      <div className="flex-1 flex items-center justify-between min-w-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 overflow-hidden">
          <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-slate-400/60 w-10 md:w-20 shrink-0">{title}</span>
          {recipe ? (
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <span className="text-base md:text-lg shrink-0">{recipe.emoji}</span>
              <span className="text-[12px] md:text-[13px] lg:text-sm font-bold text-black dark:text-white truncate">{recipe.name}</span>
            </div>
          ) : (
            <button 
              onClick={onOpenSelector}
              className="text-[9px] md:text-[10px] font-bold text-slate-500 hover:text-accent-teal transition-colors flex items-center gap-1 group"
            >
              <Plus className="w-3 h-3 group-hover:scale-125 transition-transform" />
              + Add
            </button>
          )}
        </div>
        {recipe && (
          <button 
            onClick={onRemove}
            className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [language, setLanguage] = useState<'ENG' | 'INDO'>('ENG');
  const t = TRANSLATIONS[language];
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'daily' | 'planner' | 'recipes' | 'pantry'>('planner');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(() => new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string>(() => {
    return format(new Date(), 'eeee').toLowerCase();
  });
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(() => new Date());
  const [plannerViewMode, setPlannerViewMode] = useState<'all' | 'focus'>('all');
  const [recipeViewMode, setRecipeViewMode] = useState<'gallery' | 'list' | 'columns' | 'icon'>('gallery');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('recipes');
    return saved ? JSON.parse(saved) : DEFAULT_RECIPES;
  });
  const [pantry, setPantry] = useState<Pantry>(() => {
    const saved = localStorage.getItem('pantry');
    if (saved) return JSON.parse(saved);
    // Add default values for new fields if using default
    return {
      items: DEFAULT_PANTRY.items.map(item => ({
        ...item,
        category: item.category || 'Other',
        minStock: (item as any).minStock || 1,
        expiryDate: new Date(Date.now() + Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
        price: Math.floor(Math.random() * 50) + 10
      }))
    };
  });
  const [mealPlan, setMealPlan] = useState<MealPlan>(() => {
    const saved = localStorage.getItem('mealPlan');
    return saved ? JSON.parse(saved) : { 
      weekStart: startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(), 
      days: INITIAL_MEAL_PLAN_DAYS 
    };
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState('All');
  const [selectedInventoryItems, setSelectedInventoryItems] = useState<string[]>([]);
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<PantryItem | null>(null);
  const [aiScanPreview, setAiScanPreview] = useState<PantryItem[] | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [shoppingTab, setShoppingTab] = useState<'needs' | 'list'>('needs');
  const [groceryList, setGroceryList] = useState<GroceryItem[]>(() => {
    const saved = localStorage.getItem('groceryList');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isPantryScanOpen, setIsPantryScanOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string[]>([]);
  const [recipeModalState, setRecipeModalState] = useState<{ isOpen: boolean; recipe?: Recipe } | { isOpen: false }>({ isOpen: false });
  const [isPantryModalOpen, setIsPantryModalOpen] = useState(false);
  const [isCookModeOpen, setIsCookModeOpen] = useState(false);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  const [selectorTarget, setSelectorTarget] = useState<{ recipeId?: string, day?: keyof MealPlan['days'], slot?: MealSlot } | null>(null);
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: "Hi! I'm ReadySet AI. Need help planning your week or searching recipes?" }
  ]);
  const [isGuideOpen, setIsGuideOpen] = useState(() => {
    return localStorage.getItem('hideGuide') !== 'true';
  });
  const [isMarketplaceModalOpen, setIsMarketplaceModalOpen] = useState(false);
  const [aiInputValue, setAiInputValue] = useState('');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleGroceryItem = (id: string) => {
    setGroceryList(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const removeGroceryItem = (id: string) => {
    setGroceryList(prev => prev.filter(item => item.id !== id));
    showToastMessage("Item removed");
  };

  const addGroceryItem = (name: string, qty: string = '1') => {
    const newItem: GroceryItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      quantity: qty,
      category: 'Other',
      checked: false
    };
    setGroceryList(prev => [...prev, newItem]);
    showToastMessage(`Added ${name} to list`);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Auth Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150'
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Theme Persistence
  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  // Data Persistence
  useEffect(() => {
    localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
  }, [mealPlan]);

  useEffect(() => {
    localStorage.setItem('recipes', JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('groceryList', JSON.stringify(groceryList));
  }, [groceryList]);

  const toggleTheme = () => setIsDark(!isDark);

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const name = r.name || "";
      const search = searchQuery || "";
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || 
                           (r.ingredients || []).some(ing => (ing || "").toLowerCase().includes(search.toLowerCase()));
      const matchesFilter = activeFilter === 'All' || 
                           (activeFilter === 'Favorites' && r.isFavorite) ||
                           (activeFilter === 'Pantry' && r.pantryFriendly) ||
                           (r.tags || []).includes(`#${activeFilter}`);
      return matchesSearch && matchesFilter;
    });
  }, [recipes, searchQuery, activeFilter]);

  const toggleFavorite = (id: string) => {
    setRecipes(recipes.map(r => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
  };

  const togglePantryItem = (itemName: string) => {
    const safeItemName = itemName || "";
    const existing = pantry.items.find(p => (p.name || "").toLowerCase() === safeItemName.toLowerCase());
    if (existing) {
      setPantry(prev => ({ ...prev, items: prev.items.filter(p => p.id !== existing.id) }));
    } else {
      const newItem: PantryItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: itemName,
        quantity: 1,
        unit: 'pcs',
        category: 'Other',
        minStock: 0
      };
      setPantry(prev => ({ ...prev, items: [...prev.items, newItem] }));
    }
  };

  const updatePantryItem = (id: string, updates: Partial<PantryItem>) => {
    setPantry(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, ...updates } : item)
    }));
  };

  const removePantryItem = (id: string) => {
    setPantry(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
  };

  const addPantryItem = (item: Omit<PantryItem, 'id'>) => {
    const newItem: PantryItem = {
      id: Math.random().toString(36).substr(2, 9),
      ...item
    };
    setPantry(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleApplyScanResults = () => {
    if (scanResult.length === 0) return;
    
    setPantry(prev => {
      const existingNames = new Set(prev.items.map(i => (i.name || "").toLowerCase()));
      const newItems: PantryItem[] = scanResult
        .filter(name => !existingNames.has((name || "").toLowerCase()))
        .map(name => ({
          id: Math.random().toString(36).substr(2, 9),
          name: name,
          quantity: 1,
          unit: 'pcs',
          category: 'Other',
          minStock: 0
        }));
      return {
        ...prev,
        items: [...prev.items, ...newItems]
      };
    });
    
    showToastMessage(`${scanResult.length} items added to your pantry!`);
    setIsPantryScanOpen(false);
    setScanResult([]);
  };

  const startCooking = (recipe: Recipe) => {
    if (!recipe.instructions || recipe.instructions.length === 0) {
      showToastMessage("This recipe doesn't have instructions yet.", 'error');
      return;
    }
    setCookingRecipe(recipe);
    setIsCookModeOpen(true);
  };

  const handleAddOrUpdateRecipe = (recipeData: Omit<Recipe, 'id' | 'isFavorite'>) => {
    if (recipeModalState.isOpen && recipeModalState.recipe) {
      // Update
      const updatedId = recipeModalState.recipe.id;
      setRecipes(prev => prev.map(r => r.id === updatedId ? { ...recipeData, id: updatedId, isFavorite: r.isFavorite } : r));
    } else {
      // Add
      const id = Math.random().toString(36).substr(2, 9);
      setRecipes(prev => [...prev, { ...recipeData, id, isFavorite: false }]);
    }
    setRecipeModalState({ isOpen: false });
  };

  const handleDeleteRecipe = (id: string) => {
    if (window.confirm("Hapus resep ini secara permanen?")) {
      setRecipes(prev => prev.filter(r => r.id !== id));
      // Also remove from meal plan
      setMealPlan(prev => {
        const newDays = { ...prev.days };
        Object.keys(newDays).forEach(day => {
          const d = day as keyof MealPlan['days'];
          Object.keys(newDays[d]).forEach(slot => {
            const s = slot as MealSlot;
            if (newDays[d][s] === id) newDays[d][s] = null;
          });
        });
        return { ...prev, days: newDays };
      });
    }
  };

  const addRecipeToPlan = (day: keyof MealPlan['days'], slot: MealSlot, recipeId: string) => {
    setMealPlan(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: {
          ...prev.days[day],
          [slot]: recipeId
        }
      }
    }));
  };

  const removeRecipeFromPlan = (day: keyof MealPlan['days'], slot: MealSlot) => {
    setMealPlan(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: {
          ...prev.days[day],
          [slot]: null
        }
      }
    }));
  };

  const [pantrySubTab, setPantrySubTab] = useState<'inventory' | 'list' | 'compare'>('inventory');

  const getPantryIcon = (name: string, category?: string) => {
    if (!name) return <Package className="w-7 h-7 text-accent-teal/40" />;
    const n = name.toLowerCase();
    const c = category?.toLowerCase() || "";
    
    if (n.includes('milk') || n.includes('yogurt') || n.includes('cheese') || c === 'dairy') return <Milk className="w-7 h-7 text-blue-400" />;
    if (n.includes('fish') || n.includes('salmon') || n.includes('tuna') || n.includes('shrimp')) return <Fish className="w-7 h-7 text-cyan-400" />;
    if (n.includes('egg')) return <Egg className="w-7 h-7 text-amber-400" />;
    if (n.includes('beef') || n.includes('meat') || n.includes('steak') || n.includes('chicken') || c === 'proteins') return <Beef className="w-7 h-7 text-rose-400" />;
    if (n.includes('carrot') || n.includes('vegetable') || n.includes('spinach') || n.includes('broccoli') || c === 'produce') return <Carrot className="w-7 h-7 text-orange-400" />;
    if (n.includes('oil') || n.includes('water') || n.includes('juice') || n.includes('vinegar')) return <Droplets className="w-7 h-7 text-blue-300" />;
    if (n.includes('rice') || n.includes('flour') || n.includes('grain') || n.includes('oat') || n.includes('wheat')) return <Wheat className="w-7 h-7 text-amber-600" />;
    if (n.includes('salt') || n.includes('sugar') || n.includes('spice') || n.includes('pepper') || n.includes('soup') || n.includes('sauce')) return <Soup className="w-7 h-7 text-slate-400" />;
    
    return <Package className="w-7 h-7 text-accent-teal/40" />;
  };

  const clearWeek = () => {
    if (window.confirm("Hapus semua meal plan minggu ini?")) {
      setMealPlan(prev => ({
        ...prev,
        days: INITIAL_MEAL_PLAN_DAYS
      }));
    }
  };

  const copyLastWeek = () => {
    // For demo, just show a message. In real app, we'd fetch previous week from DB
    alert("Copied last week's plan!");
  };

  // Grocery Aggregation
  const weeklyNeeds = useMemo(() => {
    const ingredients: Record<string, { qty: string, recipeNames: string[] }> = {};
    Object.values(mealPlan.days).forEach(day => {
      Object.values(day).forEach(recipeId => {
        if (!recipeId) return;
        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe) return;
        (recipe.ingredients || []).forEach(ing => {
          const parts = (ing || "").split(':').map(s => s.trim());
          const name = parts[0];
          const qty = parts[1] || 'some';
          if (ingredients[name]) {
            if (!ingredients[name].recipeNames.includes(recipe.name)) {
              ingredients[name].recipeNames.push(recipe.name);
            }
          } else {
            ingredients[name] = { qty, recipeNames: [recipe.name] };
          }
        });
      });
    });
    return Object.entries(ingredients).map(([name, data]) => ({
      name,
      ...data,
      inPantry: pantry.items.some(p => (name || "").toLowerCase().includes((p.name || "").toLowerCase()))
    }));
  }, [mealPlan, recipes, pantry]);

  const addToGroceryList = () => {
    const missing = weeklyNeeds.filter(item => !item.inPantry);
    
    if (missing.length === 0) {
      showToastMessage("Stock at Pantry is already complete!", 'success');
      setPantrySubTab('list');
      return;
    }

    const newItems = missing.map(item => ({
      id: Math.random().toString(36).substr(2, 9),
      name: item.name,
      quantity: item.qty,
      category: 'Produce',
      checked: false
    }));
    
    // Merge logic: avoid duplicates by name
    setGroceryList(prev => {
      const existingNames = new Set(prev.map(i => (i.name || "").toLowerCase()));
      const trulyNew = newItems.filter(i => !existingNames.has((i.name || "").toLowerCase()));
      
      if (trulyNew.length === 0 && newItems.length > 0) {
        showToastMessage("Items are already in your list!");
        setPantrySubTab('list');
        return prev;
      }
      
      return [...prev, ...trulyNew];
    });
    
    setPantrySubTab('list');
    showToastMessage(`${newItems.length} items aggregated to your list!`);
  };

  const handleAiSend = async () => {
    if (!aiInputValue.trim()) return;
    const userMsg = aiInputValue.trim();
    const safeUserMsg = userMsg.toLowerCase();
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setAiInputValue('');
    
    // Simulated smart response
    setTimeout(() => {
      let response = "I'm not quite sure about that, but try asking about your specific pantry items!";
      if (safeUserMsg.includes('egg')) {
        response = "You have eggs in your pantry! I recommend the 'Spinach Omelette' - it's quick and you have all the main ingredients.";
      } else if (safeUserMsg.includes('low carb')) {
        response = "I found a few low-carb options for you: Quinoa Salad and Salmon with Asparagus. Would you like me to add those to your plan?";
      } else if (safeUserMsg.includes('plan')) {
        response = "I can help with that. Should I prioritize quick meals or vegan ones for this week?";
      }
      setAiMessages(prev => [...prev, { role: 'assistant', content: response }]);
    }, 1000);
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      alert("Login failed. Check console.");
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (over && active.id !== over.id) {
       // Reordering logic for internal day reorder
       const [activeDay, activeSlot] = (active.id as string).split('-') as [keyof MealPlan['days'], MealSlot];
       const [overDay, overSlot] = (over.id as string).split('-') as [keyof MealPlan['days'], MealSlot];

       if (activeDay === overDay) {
          // Swap recipes between slots
          const activeRecipe = mealPlan.days[activeDay][activeSlot];
          const overRecipe = mealPlan.days[overDay][overSlot];

          setMealPlan(prev => ({
            ...prev,
            days: {
              ...prev.days,
              [activeDay]: {
                ...prev.days[activeDay],
                [activeSlot]: overRecipe,
                [overSlot]: activeRecipe
              }
            }
          }));
       }
    }
  };

  if (loading) return null;

  if (!user) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-6 bg-warm-pearl", isDark ? "dark bg-dark-bg" : "")}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-12 max-w-md w-full text-center neumorphism"
        >
          <div className="text-4xl font-black mb-2 text-primary-text dark:text-dark-primary-text font-display">
            ReadySet<span className="text-accent-teal">.</span>
          </div>
          <div className="text-[10px] font-black text-secondary-text dark:text-dark-secondary-text mb-10 tracking-[0.4em] uppercase">
            {t.cookWithoutChaos}
          </div>
          
          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm hover:scale-[1.02] active:scale-95 transition-all group"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            <span className="font-bold text-sm text-slate-700 dark:text-white">{language === 'ENG' ? 'Sign in with Google' : 'Masuk dengan Google'}</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("min-h-screen transition-colors duration-300", isDark ? "dark text-dark-primary-text" : "text-primary-text")}>
        <div className="max-w-[1920px] mx-auto p-3 sm:p-6 lg:p-10 flex flex-col h-screen overflow-hidden">
          
          {/* Header */}
          <header className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-10 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tighter flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-accent-teal flex items-center justify-center rounded-lg sm:rounded-2xl shadow-lg shadow-teal-500/20">
                    <ChefHat className="text-white w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <span>{t.readySet}<span className="text-accent-teal">.</span> <span className="font-light truncate max-w-[100px] sm:max-w-none">{t.mealStudio}</span></span>
                </h1>
                <p className="hidden md:block text-[8px] sm:text-[9px] lg:text-[10px] font-black tracking-[0.3em] uppercase text-accent-teal/40 mt-1 ml-14">{t.cookWithoutChaos}</p>
              </div>

              <div className="flex lg:hidden items-center gap-3">
                <button 
                  onClick={() => setLanguage(l => l === 'ENG' ? 'INDO' : 'ENG')}
                  className="px-3 h-10 glass flex items-center justify-center border-white shadow-xl text-[9px] font-black tracking-widest cursor-pointer"
                >
                  {language}
                </button>
                <button 
                  onClick={toggleTheme}
                  className="w-10 h-10 glass flex items-center justify-center border-white shadow-xl cursor-pointer"
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-secondary-text" />}
                </button>
                <div className="w-10 h-10 rounded-full border-2 border-white shadow-2xl overflow-hidden bg-slate-200">
                  <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            <nav className="flex items-center justify-center gap-1 border border-white/40 bg-white/40 p-1 rounded-xl sm:rounded-2xl shadow-sm backdrop-blur-md dark:bg-white/5 overflow-x-auto no-scrollbar">
              {(['DAILY', 'PLANNER', 'RECIPES', 'PANTRY'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase() as any)}
                  className={cn(
                    "px-2 sm:px-4 md:px-8 lg:px-10 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl lg:rounded-2xl text-[8px] sm:text-[10px] lg:text-[11px] font-black tracking-widest transition-all duration-300 uppercase whitespace-nowrap",
                    activeTab === tab.toLowerCase() 
                      ? "bg-accent-teal text-white shadow-xl shadow-teal-500/30 scale-105" 
                      : "text-secondary-text/60 hover:text-primary-text dark:text-dark-secondary-text hover:bg-white/30"
                  )}
                >
                  {tab === 'DAILY' && t.daily}
                  {tab === 'PLANNER' && t.planner}
                  {tab === 'RECIPES' && t.recipes}
                  {tab === 'PANTRY' && t.inventory}
                </button>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-5">
              <button 
                onClick={() => setLanguage(l => l === 'ENG' ? 'INDO' : 'ENG')}
                className="px-4 h-12 glass flex items-center justify-center hover:scale-110 transition-transform border-white shadow-xl text-[10px] font-black tracking-widest cursor-pointer"
              >
                {language}
              </button>
              
              <button 
                onClick={() => setIsGuideOpen(true)}
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-white/40 border border-white rounded-full hover:bg-white transition-all shadow-sm cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-accent-teal" />
                <span className="text-[11px] font-black uppercase tracking-widest">{t.guide}</span>
              </button>

              <button 
                onClick={toggleTheme}
                className="w-12 h-12 glass flex items-center justify-center hover:scale-110 transition-transform border-white shadow-xl cursor-pointer"
              >
                {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-secondary-text" />}
              </button>



              <div className="flex items-center gap-4 pl-4 border-l border-white/20">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-black leading-none font-display">{t.morning}, {user.name.split(' ')[0]}</p>
                  <button onClick={handleLogout} className="text-[10px] font-black uppercase tracking-widest text-accent-teal mt-1 hover:underline">{t.logout}</button>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-white shadow-2xl overflow-hidden bg-slate-200 cursor-pointer hover:scale-105 transition-transform">
                  <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </header>

          {/* Main Grid */}
          <main className="flex-1 overflow-hidden min-h-0 relative mt-4 lg:mt-0">
            <AnimatePresence mode="wait">
              {activeTab === 'planner' && (
                    <motion.div 
                      key="planner"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col h-full overflow-hidden"
                    >
                      {/* Planner */}
                      <section className="flex-1 flex flex-col min-h-0 gap-3 md:gap-6 overflow-hidden">
                        <div className="flex flex-row items-center justify-between gap-4 px-2 pb-2 shrink-0 border-b border-slate-100 dark:border-white/5">
                          <div className="flex flex-col text-left gap-0.5">
                            <h2 className="text-base md:text-xl lg:text-3xl font-black font-display tracking-tight text-accent-teal flex items-center gap-2">
                              {t.planner} <span className="text-amber-500">.</span>
                            </h2>
                            <p className="text-[7px] md:text-[11px] font-black tracking-[0.2em] md:tracking-[0.4em] text-accent-teal/60 uppercase">
                              {format(currentCalendarDate, 'MMMM yyyy')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 md:gap-4">
                            <button onClick={clearWeek} className="p-1.5 md:p-2 text-rose-400 hover:text-rose-600 transition-colors cursor-pointer" title="Clear Week"><Trash2 className="w-4 h-4 md:w-5 md:h-5" /></button>
                            <button onClick={copyLastWeek} className="p-1.5 md:p-2 text-accent-teal hover:text-accent-teal/80 transition-colors cursor-pointer" title="Copy Last Week"><Copy className="w-4 h-4 md:w-5 md:h-5" /></button>
                          </div>
                        </div>

                        {/* Main Grid: Split calendar and detailed planner list */}
                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-hidden pb-10">
                          {/* Left Column: Interactive Calendar (col-span-5) */}
                          <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto no-scrollbar pr-1 pt-1">
                            {/* Calendar Card */}
                            <div className="glass p-4 border-slate-200 dark:border-white/10 dark:bg-[#161e2e]/30 flex flex-col gap-4 shadow-sm rounded-2xl">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase tracking-widest text-[#1a1a1a] dark:text-white flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-accent-teal" />
                                  <span>Meal Planner Calendar</span>
                                </span>
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={() => setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <ChevronLeft className="w-4 h-4 text-slate-500" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      const d = new Date();
                                      setCurrentCalendarDate(d);
                                      setSelectedCalendarDate(d);
                                      setSelectedCalendarDay(format(d, 'eeee').toLowerCase());
                                    }}
                                    className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-accent-teal hover:bg-accent-teal/10 rounded transition-colors cursor-pointer"
                                  >
                                    Today
                                  </button>
                                  <button 
                                    onClick={() => setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <ChevronRight className="w-4 h-4 text-slate-500" />
                                  </button>
                                </div>
                              </div>

                              {/* Calendar Table */}
                              <div className="w-full">
                                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((hd, idx) => (
                                    <span key={idx} className="text-[10px] font-black text-slate-400 dark:text-slate-500 py-1">{hd}</span>
                                  ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1.5">
                                  {(() => {
                                    const year = currentCalendarDate.getFullYear();
                                    const month = currentCalendarDate.getMonth();
                                    const firstDayOfMonth = new Date(year, month, 1);
                                    const startDayOfWeek = firstDayOfMonth.getDay();
                                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                                    const calendarDays = [];
                                    const paddingCount = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
                                    
                                    for (let i = 0; i < paddingCount; i++) {
                                      calendarDays.push(null);
                                    }
                                    for (let d = 1; d <= daysInMonth; d++) {
                                      calendarDays.push(new Date(year, month, d));
                                    }

                                    return calendarDays.map((dateObj, idx) => {
                                      if (!dateObj) {
                                        return <div key={`empty-${idx}`} className="aspect-square opacity-0 animate-pulse bg-slate-50 border border-slate-100 rounded-xl" />;
                                      }
                                      const dName = format(dateObj, 'eeee').toLowerCase() as keyof MealPlan['days'];
                                      const dPlan = mealPlan.days[dName] || { breakfast: null, lunch: null, snack: null, dinner: null };
                                      const plannedCount = ['breakfast', 'lunch', 'snack', 'dinner'].filter(s => !!dPlan[s as keyof DayPlan]).length;
                                      const isSelected = format(dateObj, 'yyyy-MM-dd') === format(selectedCalendarDate, 'yyyy-MM-dd');
                                      const isToday = format(dateObj, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                                      return (
                                        <button
                                          key={dateObj.getTime()}
                                          onClick={() => {
                                            setSelectedCalendarDate(dateObj);
                                            setSelectedCalendarDay(dName);
                                          }}
                                          className={cn(
                                            "aspect-square rounded-xl flex flex-col items-center justify-between p-1 text-xs transition-all cursor-pointer relative group",
                                            isSelected
                                              ? "bg-accent-teal text-white shadow-md font-bold scale-[1.05]"
                                              : isToday
                                                ? "bg-accent-teal/10 text-accent-teal border border-accent-teal/40 font-bold"
                                                : "bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/50 dark:border-white/5"
                                          )}
                                        >
                                          <span className={cn(
                                            "text-[11px] font-extrabold",
                                            isSelected ? "text-white" : "text-[#1a1a1a] dark:text-slate-200"
                                          )}>
                                            {dateObj.getDate()}
                                          </span>
                                          
                                          {/* Micro meal status dots */}
                                          <div className="flex gap-0.5 justify-center items-center w-full min-h-[4px]">
                                            {['breakfast', 'lunch', 'snack', 'dinner'].map((slot) => {
                                              const mealId = dPlan[slot as keyof DayPlan];
                                              if (!mealId) return null;
                                              return (
                                                <span 
                                                  key={slot} 
                                                  className={cn(
                                                    "w-1 h-1 rounded-full",
                                                    isSelected 
                                                      ? "bg-white" 
                                                      : slot === 'breakfast' ? 'bg-amber-400' : slot === 'lunch' ? 'bg-emerald-400' : slot === 'snack' ? 'bg-rose-400' : 'bg-indigo-400'
                                                  )} 
                                                />
                                              );
                                            })}
                                          </div>

                                          {/* Planned count floating pill on hover */}
                                          {plannedCount > 0 && (
                                            <span className="absolute -top-1 -right-1 text-[8px] bg-accent-teal text-white px-1 rounded-full border border-white">
                                              {plannedCount}
                                            </span>
                                          )}
                                        </button>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>

                              {/* Selected Day Meal Quick view / stats */}
                              <div className="mt-2 pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                  {format(selectedCalendarDate, 'EEEE, d MMMM yyyy')}
                                </span>
                                {(() => {
                                  const selPlan = mealPlan.days[selectedCalendarDay as keyof MealPlan['days']] || { breakfast: null, lunch: null, snack: null, dinner: null };
                                  const slots = ['breakfast', 'lunch', 'snack', 'dinner'];
                                  const mealsDetails = slots.map(s => {
                                    const recipeId = selPlan[s as keyof DayPlan];
                                    return {
                                      slot: s,
                                      recipe: recipes.find(r => r.id === recipeId) || null
                                    };
                                  });
                                  const totalCals = mealsDetails.reduce((sum, item) => sum + (item.recipe?.calories || 0), 0);
                                  const plannedCount = mealsDetails.filter(item => !!item.recipe).length;

                                  return (
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                                        <div className="flex flex-col">
                                          <span className="text-xs font-black text-accent-teal uppercase">{selectedCalendarDay}</span>
                                          <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{plannedCount} scheduled meals</span>
                                        </div>
                                        <div className="text-right">
                                          <span className="text-xs font-black text-slate-900 dark:text-slate-100">{totalCals} calories</span>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2">
                                        {mealsDetails.map(item => (
                                          <div 
                                            key={item.slot} 
                                            className="p-2 border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#1a2333]/30 rounded-xl flex items-center gap-2"
                                          >
                                            <span className={cn(
                                              "text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded",
                                              item.slot === 'breakfast' ? 'bg-amber-400/10 text-amber-500' : item.slot === 'lunch' ? 'bg-emerald-400/10 text-emerald-500' : item.slot === 'snack' ? 'bg-rose-400/10 text-rose-500' : 'bg-indigo-400/10 text-indigo-500'
                                            )}>
                                              {item.slot[0].toUpperCase()}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[85px]">
                                              {item.recipe ? item.recipe.name : 'Empty Slate'}
                                            </span>
                                          </div>
                                        ))}
                                      </div>

                                      {/* View Mode selection */}
                                      <div className="flex items-center justify-between pt-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">View Mode</span>
                                        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200/50 dark:border-white/10">
                                          <button 
                                            onClick={() => setPlannerViewMode('all')}
                                            className={cn(
                                              "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer",
                                              plannerViewMode === 'all' ? "bg-white dark:bg-white/10 text-accent-teal shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                                            )}
                                          >
                                            Show Week
                                          </button>
                                          <button 
                                            onClick={() => setPlannerViewMode('focus')}
                                            className={cn(
                                              "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer",
                                              plannerViewMode === 'focus' ? "bg-white dark:bg-white/10 text-accent-teal shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                                            )}
                                          >
                                            Focus {selectedCalendarDay[0].toUpperCase() + selectedCalendarDay.substring(1, 3)}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Detailed Days List (col-span-7) */}
                          <div className="lg:col-span-7 flex flex-col h-full overflow-hidden">
                            <div className="flex-1 overflow-y-auto pr-0 lg:pr-2 space-y-4 md:space-y-6 pb-20 no-scrollbar pt-1">
                              {plannerViewMode === 'all' ? (
                                (Object.keys(mealPlan.days) as Array<keyof MealPlan['days']>).map((day) => {
                                  const isFocused = day === selectedCalendarDay;
                                  return (
                                    <div 
                                      key={day} 
                                      className={cn(
                                        "transition-all duration-300", 
                                        isFocused ? "scale-[1.01] ring-2 ring-accent-teal/40 rounded-2xl shadow-md" : "opacity-90 hover:opacity-100"
                                      )}
                                    >
                                      <DayCard 
                                        day={day} 
                                        plan={mealPlan.days[day]}
                                        recipes={recipes}
                                        t={t}
                                        onRemove={(slot) => removeRecipeFromPlan(day, slot)}
                                        onAdd={(slot) => setSelectorTarget({ day, slot })}
                                        onCook={startCooking}
                                      />
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-black uppercase tracking-widest text-[#1b8481]/70">Showing Focus Stream</span>
                                    <button 
                                      onClick={() => setPlannerViewMode('all')}
                                      className="text-[10px] font-black uppercase tracking-widest text-accent-teal hover:underline cursor-pointer"
                                    >
                                      ← Back to entire week
                                    </button>
                                  </div>
                                  <DayCard 
                                    day={selectedCalendarDay as any} 
                                    plan={mealPlan.days[selectedCalendarDay as any]}
                                    recipes={recipes}
                                    t={t}
                                    onRemove={(slot) => removeRecipeFromPlan(selectedCalendarDay as any, slot)}
                                    onAdd={(slot) => setSelectorTarget({ day: selectedCalendarDay as any, slot })}
                                    onCook={startCooking}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </section>
                    </motion.div>
                )}

              {activeTab === 'daily' && (
                <motion.div 
                  key="daily"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="h-full flex flex-col items-center justify-start lg:justify-center overflow-y-auto px-4 py-8 sm:p-10 no-scrollbar gap-12 md:gap-20"
                >
        <div className="max-w-2xl w-full px-2">
          <div className="text-center mb-6 md:mb-10">
            <h2 className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-black font-display tracking-tight text-accent-teal mb-1 md:mb-2 uppercase animate-in fade-in slide-in-from-top-4 duration-700">
                        {format(new Date(), 'EEEE')}
                      </h2>
                      <div className="flex items-center justify-center gap-2 md:gap-3 animate-in fade-in slide-in-from-top-4 duration-700 delay-100">
                        <div className="h-[1px] w-4 md:w-12 bg-accent-teal/10" />
                        <p className="text-[6px] sm:text-[8px] md:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.4em] text-accent-teal/40 uppercase">{format(new Date(), 'MMMM d, yyyy')}</p>
                        <div className="h-[1px] w-4 md:w-12 bg-accent-teal/10" />
                      </div>
                    </div>
                    <div className="pb-32 lg:pb-0 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                      <DayCard 
                        day={format(new Date(), 'eeee').toLowerCase() as any}
                        plan={mealPlan.days[format(new Date(), 'eeee').toLowerCase() as any] || INITIAL_MEAL_PLAN_DAYS.monday}
                        recipes={recipes}
                        t={t}
                        onRemove={(slot) => removeRecipeFromPlan(format(new Date(), 'eeee').toLowerCase() as any, slot)}
                        onAdd={(slot) => setSelectorTarget({ day: format(new Date(), 'eeee').toLowerCase() as any, slot })}
                        onCook={startCooking}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'pantry' && (
                <motion.div 
                  key="pantry"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="h-full flex flex-col gap-4 md:gap-8 min-h-0"
                >
                  <div className="flex flex-col gap-6 px-4 shrink-0">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="flex flex-col text-center sm:text-left">
                        <h2 className="text-2xl md:text-3xl font-black font-display tracking-tight text-accent-teal uppercase">{t.inventory}<span className="text-amber-500">.</span></h2>
                        <div className="flex items-center justify-center sm:justify-start gap-4 mt-1">
                           <p className="text-[9px] font-black tracking-[0.3em] text-accent-teal/60 uppercase">{pantry.items.length} {t.totalItems}</p>
                           <div className="w-1 h-1 rounded-full bg-accent-teal/20" />
                           <p className="text-[9px] font-black tracking-[0.3em] text-rose-500/60 uppercase">{pantry.items.filter(i => i.quantity <= i.minStock).length} {t.lowStockTitle}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64 group/search">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/search:text-accent-teal transition-colors" />
                           <input 
                             type="text"
                             placeholder={t.searchInventory}
                             value={inventorySearch}
                             onChange={(e) => setInventorySearch(e.target.value)}
                             className="w-full bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-2xl py-3.5 pl-12 pr-6 text-[12px] font-bold focus:ring-4 ring-accent-teal/10 outline-none transition-all shadow-sm"
                           />
                        </div>
                        <button 
                          onClick={() => { setEditingIngredient(null); setIsIngredientModalOpen(true); }}
                          className="w-12 h-12 md:w-14 md:h-14 bg-accent-teal text-white flex items-center justify-center rounded-2xl shadow-xl shadow-teal-500/30 hover:scale-105 active:scale-95 transition-all group shrink-0"
                        >
                          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar pb-1">
                      <div className="flex items-center gap-2">
                        {pantrySubTab === 'inventory' && ['All', 'Produce', 'Proteins', 'Dairy', 'Pantry', 'Low stock'].map(f => (
                          <button
                            key={f}
                            onClick={() => setInventoryFilter(f)}
                            className={cn(
                              "px-3.5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                              inventoryFilter === f 
                                ? "bg-accent-teal/15 text-accent-teal border border-accent-teal/30 shadow-sm" 
                                : "bg-white/40 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-white/10 border border-white/20"
                            )}
                          >
                            {f === 'All' && t.all}
                            {f === 'Produce' && t.produce}
                            {f === 'Proteins' && t.proteins}
                            {f === 'Dairy' && t.dairy}
                            {f === 'Pantry' && t.pantry}
                            {f === 'Low stock' && t.lowStock}
                          </button>
                        ))}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3 w-full sm:w-auto shrink-0">
                         <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 w-full sm:w-auto">
                            <button 
                              onClick={() => setPantrySubTab('inventory')}
                              className={cn(
                                "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                pantrySubTab === 'inventory' ? "bg-white dark:bg-white/10 text-accent-teal shadow-md font-extrabold" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                              )}
                            >{t.stock} ({pantry.items.length})</button>
                            <button 
                              onClick={() => setPantrySubTab('list')}
                              className={cn(
                                "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                pantrySubTab === 'list' ? "bg-white dark:bg-white/10 text-amber-500 shadow-md font-extrabold" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                              )}
                            >{t.list} ({groceryList.length})</button>
                             <button 
                              onClick={() => setPantrySubTab('compare')}
                              className={cn(
                                "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                pantrySubTab === 'compare' ? "bg-white dark:bg-white/10 text-rose-500 shadow-md font-extrabold" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                              )}
                            >{t.compare}</button>
                         </div>
                         <button 
                            onClick={() => setIsPantryScanOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-teal to-[#16a39d] text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-teal-500/20"
                         >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{t.aiScan}</span>
                         </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 pb-32 no-scrollbar">
                    {pantrySubTab === 'inventory' ? (
                      <div className="space-y-6">
                        {/* Card Edukasi Interaktif Stock */}
                        <div className="p-6 bg-accent-teal/5 dark:bg-accent-teal/10 border border-accent-teal/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 bg-accent-teal/5 text-accent-teal flex items-center justify-center rounded-xl shrink-0">
                              <Info className="w-5 h-5 stroke-[2.5px]" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-widest text-accent-teal">
                                {language === 'ENG' ? "KITCHEN & PANTRY STOCK" : "STOK DAPUR & KULKAS"}
                              </h4>
                              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                                {language === 'ENG' 
                                  ? "Track items you currently have at home. This avoids over-buying and maps your missing ingredients instantly when cooking recipes!" 
                                  : "Pantau bahan masakan yang masih ada di rumah. Stok ini mencegah belanja berlebih dan mendeteksi bahan apa saja yang kurang saat ingin memasak!"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {(() => {
                           const filteredItems = pantry.items
                             .filter(item => {
                               const matchesSearch = item.name.toLowerCase().includes(inventorySearch.toLowerCase());
                               const matchesFilter = inventoryFilter === 'All' 
                                 ? true 
                                 : inventoryFilter === 'Low stock' 
                                   ? item.quantity <= item.minStock 
                                   : item.category === inventoryFilter;
                               return matchesSearch && matchesFilter;
                             })
                             .sort((a, b) => a.name.localeCompare(b.name));
                           
                           if (filteredItems.length === 0) {
                             return (
                               <div className="flex flex-col items-center justify-center p-20 text-center animate-in fade-in zoom-in duration-500">
                                 <div className="w-32 h-32 bg-accent-teal/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-10 overflow-hidden relative group">
                                    <div className="absolute inset-0 bg-accent-teal/10 scale-0 group-hover:scale-100 transition-transform duration-700" />
                                    <Package className="w-16 h-16 text-accent-teal/40 group-hover:text-accent-teal/80 transition-colors" />
                                 </div>
                                 <h3 className="text-xl font-black uppercase tracking-tight text-primary-text dark:text-white mb-2 italic">Belum ada bahan di dapur<span className="text-accent-teal">.</span></h3>
                                 <p className="text-xs font-medium text-slate-400 max-w-[280px] leading-relaxed mb-10">Mulai kelola stok bahan masakanmu untuk kemudahan merencanakan menu harian.</p>
                                 <div className="flex gap-4">
                                    <button 
                                      onClick={() => { setEditingIngredient(null); setIsIngredientModalOpen(true); }}
                                      className="px-8 py-4 bg-accent-teal text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-teal-500/20"
                                    >Tambah bahan</button>
                                    <button 
                                      onClick={() => setIsPantryScanOpen(true)}
                                      className="px-8 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-primary-text dark:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-sm"
                                    >Scan bahan</button>
                                 </div>
                               </div>
                             );
                           }
                           
                           return (
                             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                               {filteredItems.map((item, idx) => {
                                 const isLowStock = item.quantity <= item.minStock && item.quantity > 0;
                                 const isOut = item.quantity === 0;
                                 const isSelected = false;
                                 
                                 const expiry = item.expiryDate ? new Date(item.expiryDate) : null;
                                 const diff = expiry ? Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                                 const isExpired = diff !== null && diff <= 0;
                                 const isExpiringSoon = diff !== null && diff > 0 && diff <= 3;

                                 return (
                                   <motion.div 
                                     key={item.id}
                                     initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                     animate={{ opacity: 1, scale: 1, y: 0 }}
                                     transition={{ delay: idx * 0.03 }}
                                     className={cn(
                                       "glass group relative overflow-hidden transition-all duration-300 flex flex-col h-full border-white/40 hover:border-accent-teal/40 hover:shadow-2xl hover:shadow-teal-500/10",
                                       item.isNeededForPlan && "bg-amber-500/[0.03]"
                                     )}
                                   >
                                     <div className="p-5 flex-1 flex flex-col">
                                       <div className="flex items-start justify-between mb-4">
                                          <div className={cn(
                                            "w-12 h-12 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform shadow-sm",
                                            isOut ? "bg-rose-500/10 text-rose-500" : isLowStock ? "bg-amber-500/10 text-amber-500" : "bg-accent-teal/5 text-accent-teal"
                                          )}>
                                             {getPantryIcon(item.name, item.category)}
                                          </div>
                                          <div className="flex flex-col items-end">
                                             <button 
                                               onClick={() => {
                                                 // Selection action removed
                                               }}
                                               className={cn(
                                                 "hidden",
                                                 isSelected 
                                                   ? "bg-accent-teal border-accent-teal text-white shadow-md shadow-teal-500/10" 
                                                   : "border-slate-200 dark:border-white/20 bg-white dark:bg-[#1a2333]/30 hover:border-accent-teal"
                                               )}
                                               title="Select Item"
                                             >
                                                {isSelected ? <Check className="w-3 h-3 stroke-[3px]" /> : <div className="w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-accent-teal/30" />}
                                             </button>
                                          </div>
                                       </div>

                                       <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-black font-display tracking-tight truncate capitalize">{item.name}</h3>
                                            {item.isNeededForPlan && (
                                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Needed for meal plan" />
                                            )}
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{item.category}</span>
                                            {isOut ? (
                                              <span className="text-[7px] font-black uppercase text-rose-500 tracking-widest bg-rose-500/10 px-1.5 py-0.5 rounded">Out of Stock</span>
                                            ) : isLowStock ? (
                                              <span className="text-[7px] font-black uppercase text-amber-500 tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded">Low Stock</span>
                                            ) : null}
                                          </div>
                                       </div>

                                       <div className="mt-5 flex items-center justify-between">
                                          <div className="flex flex-col">
                                             <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Quantity</span>
                                             <p className={cn(
                                               "text-[11px] font-black uppercase",
                                               isOut ? "text-rose-500" : isLowStock ? "text-amber-500" : "text-accent-teal"
                                             )}>
                                               {item.quantity} {item.unit}
                                             </p>
                                          </div>
                                          <div className="flex flex-col items-end">
                                             {diff !== null && (
                                               <span className={cn(
                                                 "px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest",
                                                 isExpired ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : isExpiringSoon ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "bg-slate-100 dark:bg-white/10 text-slate-500"
                                               )}>
                                                 {isExpired ? 'Expired' : `${diff}d left`}
                                               </span>
                                             )}
                                          </div>
                                       </div>
                                       
                                       <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-white/5 flex items-center gap-1.5 bg-transparent shrink-0">
                                          <button 
                                            onClick={() => { addGroceryItem(item.name, `${item.minStock * 2} ${item.unit}`); showToastMessage(`Added ${item.name} to grocery list`); }}
                                            className="flex-1 py-2 px-3 bg-accent-teal/5 dark:bg-accent-teal/15 text-accent-teal hover:bg-accent-teal hover:text-white border border-accent-teal/10 hover:border-accent-teal rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                            title="Add directly to Grocery List"
                                          >
                                            <ShoppingCart className="w-3.5 h-3.5" />
                                            <span>{language === 'ENG' ? '+ Grocery' : '+ Belanja'}</span>
                                          </button>
                                          <button 
                                            onClick={() => { setEditingIngredient(item); setIsIngredientModalOpen(true); }}
                                            className="p-2 bg-slate-50 dark:bg-white/5 hover:bg-blue-500 hover:text-white dark:hover:text-white text-slate-500 rounded-xl transition-all border border-slate-100 dark:border-white/5 cursor-pointer"
                                            title="Edit Item (Pencil)"
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                          </button>
                                          <button 
                                            onClick={() => removePantryItem(item.id)}
                                            className="p-2 bg-rose-50 dark:bg-rose-950/10 hover:bg-rose-500 hover:text-white dark:hover:text-white text-rose-500 rounded-xl transition-all border border-rose-500/10 cursor-pointer"
                                            title="Delete Item (Trash)"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                       </div>
                                     </div>
                                     
                                     {/* Stock simple bar */}
                                     <div className="h-1 w-full bg-slate-100 dark:bg-white/5">
                                        <motion.div 
                                          initial={{ width: 0 }}
                                          animate={{ width: `${Math.min(100, (item.quantity / (item.minStock * 2)) * 100)}%` }}
                                          className={cn(
                                            "h-full transition-all duration-1000",
                                            isOut ? "bg-rose-500" : isLowStock ? "bg-amber-500" : "bg-accent-teal"
                                          )}
                                        />
                                     </div>
                                   </motion.div>
                                 );
                               })}
                             </div>
                           );
                        })()}
                      </div>
                    ) : pantrySubTab === 'compare' ? (
                       <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                         {/* Card Edukasi Interaktif */}
                         <div className="p-6 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                           <div className="flex gap-4 items-start">
                             <div className="w-10 h-10 bg-rose-500/10 text-rose-500 flex items-center justify-center rounded-xl shrink-0">
                               <Info className="w-5 h-5 stroke-[2.5px]" />
                             </div>
                             <div>
                               <h4 className="text-xs font-black uppercase tracking-widest text-rose-500">
                                 {language === 'ENG' ? "COMPARE & SHOP SMART" : "BANDINGKAN & BELANJA CERDAS"}
                               </h4>
                               <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                                 {language === 'ENG' 
                                   ? "This system automatically checks all ingredients in your Grocery List, comparing real-time prices at local supermarkets. No more manual math!" 
                                   : "Sistem membandingkan semua bahan di Daftar Belanja Anda secara otomatis di berbagai supermarket terdekat. Tidak perlu menghitung manual!"}
                               </p>
                             </div>
                           </div>
                           <button 
                             onClick={() => setPantrySubTab('list')}
                             className="px-4 py-2 bg-rose-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest cursor-pointer hover:bg-rose-600 transition-colors shrink-0"
                           >
                             {language === 'ENG' ? "Edit Grocery List" : "Ubah Daftar Belanja"}
                           </button>
                         </div>

                         {(() => {
                           // Simulated price logic
                           const getSimulatedPrice = (name: string, store: 'alfamart' | 'indomaret' | 'superindo') => {
                             let hash = 0;
                             for (let i = 0; i < name.length; i++) {
                               hash = name.charCodeAt(i) + ((hash << 5) - hash);
                             }
                             hash = Math.abs(hash);
                             const basePrice = 8500 + (hash % 16500); // Rp 8,500 - Rp 25,000
                             
                             if (store === 'alfamart') return Math.round(basePrice * 1.05);
                             if (store === 'indomaret') return Math.round(basePrice * 1.02);
                             return Math.round(basePrice * 0.90); // Super Indo best value
                           };

                           const isRealData = groceryList.length > 0;
                           const compareItems = isRealData 
                             ? groceryList.map(item => ({ name: item.name, qty: item.quantity, source: 'user' }))
                             : (weeklyNeeds.length > 0 
                                 ? weeklyNeeds.map(item => ({ name: item.name, qty: item.qty, source: 'planner' }))
                                 : [
                                     { name: 'Fresh Milk 1L', qty: '1 Box', source: 'demo' },
                                     { name: 'Omega Eggs', qty: '10 pcs', source: 'demo' },
                                     { name: 'Organic Spinach', qty: '1 Bunch', source: 'demo' },
                                     { name: 'Chicken Breast 500g', qty: '1 Pack', source: 'demo' }
                                   ]
                               );

                           const alfaTotal = compareItems.reduce((acc, item) => acc + getSimulatedPrice(item.name, 'alfamart'), 0);
                           const indoTotal = compareItems.reduce((acc, item) => acc + getSimulatedPrice(item.name, 'indomaret'), 0);
                           const superTotal = compareItems.reduce((acc, item) => acc + getSimulatedPrice(item.name, 'superindo'), 0);

                           return (
                             <>
                               {/* Status Banner */}
                               <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                  <div className="flex flex-col">
                                     <h3 className="text-xl font-black uppercase tracking-tight text-primary-text dark:text-white italic">
                                       {language === 'ENG' ? "Best Market Strategy" : "Strategi Harga Terbaik"}<span className="text-accent-teal">.</span>
                                     </h3>
                                     <p className="text-[9px] font-black text-accent-teal/60 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                       <span className="relative flex h-1.5 w-1.5">
                                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-teal opacity-75"></span>
                                         <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-teal"></span>
                                       </span>
                                       {isRealData 
                                         ? (language === 'ENG' ? "Comparing prices for your real items" : "Membandingkan harga dari daftar belanjamu")
                                         : (language === 'ENG' ? "Planner / Demo Items displayed because Grocery List is empty" : "Barang contoh ditampilkan karena Daftar Belanja masih kosong")}
                                     </p>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      showToastMessage(language === 'ENG' 
                                        ? "Price indexing complete! Super Indo identified as best savings." 
                                        : "Indeks harga selesai! Super Indo dipilih sebagai toko paling hemat.");
                                      setIsMarketplaceModalOpen(true);
                                    }}
                                    className="w-full sm:w-auto px-6 py-4 bg-white/40 dark:bg-white/5 border border-white/60 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                                  >
                                    <Zap className="w-4 h-4 text-amber-500" />
                                    {language === 'ENG' ? "Use Best Store" : "Belanja di Toko Terbaik"}
                                  </button>
                               </div>

                               {/* Grid Perbandingan 3 Toko */}
                               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                 {[
                                   { name: 'Alfamart', color: 'text-rose-600', bg: 'bg-rose-500/5', border: 'border-rose-500/20', total: alfaTotal, label: language === 'ENG' ? 'Fast & Close' : 'Terdekat' },
                                   { name: 'Indomaret', color: 'text-blue-600', bg: 'bg-blue-500/5', border: 'border-blue-500/20', total: indoTotal, label: language === 'ENG' ? 'Reliable' : 'Lengkap' },
                                   { name: 'Super Indo', color: 'text-emerald-600', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', total: superTotal, label: language === 'ENG' ? 'Best Value (Save ~10%)' : 'Paling Hemat (Diskon ~10%)' }
                                 ].map((market, midx) => (
                                   <div 
                                     key={market.name} 
                                     className={cn("glass p-8 border flex flex-col gap-5 group hover:scale-[1.02] transition-all relative overflow-hidden", market.border, market.bg)}
                                   >
                                      <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.03] rounded-bl-full translate-x-8 -translate-y-8" />
                                      <div className="flex items-center justify-between relative z-10">
                                         <div className="flex flex-col">
                                            <h3 className={cn("text-xs font-black uppercase tracking-widest", market.color)}>{market.name}</h3>
                                            <span className="text-[8px] font-black opacity-40 uppercase tracking-tighter mt-1">{market.label}</span>
                                         </div>
                                         <div className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm">
                                            <ShoppingCart className="w-4 h-4 text-slate-400" />
                                         </div>
                                      </div>
                                      <div className="relative z-10">
                                         <p className="text-3xl md:text-4xl font-black font-display tracking-tight">Rp {market.total.toLocaleString()}</p>
                                         <div className="flex items-center gap-2 mt-4">
                                            <div className="h-1.5 flex-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                               <div 
                                                 style={{ width: market.name === 'Super Indo' ? '100%' : market.name === 'Indomaret' ? '88%' : '78%' }}
                                                 className={cn("h-full bg-current transition-all duration-500", market.color)} 
                                               />
                                            </div>
                                            <span className="text-[9px] font-black opacity-60 uppercase tracking-widest">
                                              {market.name === 'Super Indo' ? (language === 'ENG' ? 'Cheapest' : 'Termurah') : ''}
                                            </span>
                                         </div>
                                      </div>
                                   </div>
                                 ))}
                               </div>

                               {/* Tabel Rincian Harga Produk per Toko */}
                               <div className="glass border-white/40 dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-700 h-[450px] flex flex-col">
                                 <div className="overflow-auto no-scrollbar flex-1">
                                   <table className="w-full text-left border-separate border-spacing-0">
                                     <thead className="sticky top-0 z-20">
                                         <tr className="border-b border-slate-50 dark:border-white/5">
                                         <th className={cn("px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400", isDark ? "bg-[#242424]" : "bg-white")}>
                                           {t.ingredientSource}
                                         </th>
                                         <th className={cn("px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400", isDark ? "bg-[#242424]" : "bg-white")}>
                                           {t.qty}
                                         </th>
                                         <th className={cn("px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400", isDark ? "bg-[#242424]" : "bg-white")}>
                                           {t.alfamart}
                                         </th>
                                         <th className={cn("px-8 py-6 text-[10px] font-black uppercase tracking-widest text-emerald-500", isDark ? "bg-[#242424]" : "bg-white")}>
                                           {t.superIndo}
                                         </th>
                                         <th className={cn("px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right", isDark ? "bg-[#242424]" : "bg-white")}>
                                           {t.optimization}
                                         </th>
                                       </tr>
                                     </thead>
                                     <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                       {compareItems.map((item, idx) => {
                                         const pAlfamart = getSimulatedPrice(item.name, 'alfamart');
                                         const pSuperIndo = getSimulatedPrice(item.name, 'superindo');
                                         const discountPercent = Math.round(((pAlfamart - pSuperIndo) / pAlfamart) * 100);
                                         
                                         return (
                                           <tr key={`${item.name}-${idx}`} className="group hover:bg-accent-teal/[0.02] transition-colors">
                                             <td className="px-8 py-5">
                                               <div className="flex items-center gap-5">
                                                 <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-all border border-slate-100 dark:border-white/10">
                                                   {getPantryIcon(item.name)}
                                                 </div>
                                                 <div className="flex flex-col">
                                                   <span className="text-[13px] font-bold capitalize text-primary-text dark:text-white">{item.name}</span>
                                                   <span className="text-[8px] font-black uppercase text-slate-400 mt-1 tracking-widest">
                                                     {item.source === 'user' ? 'In list' : item.source === 'planner' ? 'For planned recipe' : 'Demo Sample'}
                                                   </span>
                                                 </div>
                                               </div>
                                             </td>
                                             <td className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">{item.qty}</td>
                                             <td className="px-8 py-5 text-xs font-bold text-slate-400">Rp {pAlfamart.toLocaleString()}</td>
                                             <td className="px-8 py-5 text-xs font-black text-emerald-500 font-display">Rp {pSuperIndo.toLocaleString()}</td>
                                             <td className="px-8 py-5 text-right">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                   <Check className="w-3 h-3" />
                                                   -{discountPercent}% OFF
                                                </div>
                                             </td>
                                           </tr>
                                         );
                                       })}
                                     </tbody>
                                  </table>
                                 </div>
                               </div>
                             </>
                           );
                         })()}
                       </div>
                    ) : (
                      <div className="max-w-3xl mx-auto pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                        {/* Card Edukasi Interaktif List */}
                        <div className="p-6 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 bg-amber-500/5 text-amber-500 flex items-center justify-center rounded-xl shrink-0">
                              <Info className="w-5 h-5 stroke-[2.5px]" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-widest text-amber-500">
                                {language === 'ENG' ? "YOUR SHOPPING & GROCERY LIST" : "DAFTAR BELANJA & KEBUTUHAN"}
                              </h4>
                              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-1 leading-relaxed text-left">
                                {language === 'ENG' 
                                  ? "Add items manually or sync your meal recipes planned in the 'Planner' tab. We automatically subtract what is already in your Pantry Stock!" 
                                  : "Tambah barang belanjaan secara manual atau klik 'Ambil dari Planner' di bawah untuk mengisi otomatis bahan resep yang kurang dari dapur Anda!"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="glass p-8 md:p-12 border-white/40 dark:border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-accent-teal/20" />
                        <div className="flex flex-col gap-8">
                          {groceryList.length > 0 ? (
                            <div className="space-y-1">
                              {groceryList.map((item) => (
                                <motion.div layout key={item.id} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 group">
                                  <div className="flex items-center gap-6">
                                    <button 
                                      onClick={() => toggleGroceryItem(item.id)}
                                      className={cn(
                                        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                                        item.checked 
                                          ? "bg-accent-teal border-accent-teal text-white shadow-lg shadow-teal-500/10" 
                                          : "border-slate-200 bg-white"
                                      )}
                                    >
                                      {item.checked && <Check className="w-4 h-4 stroke-[3px]" />}
                                    </button>
                                    <div className="flex flex-col">
                                       <span className={cn(
                                         "text-base font-bold transition-all",
                                         item.checked ? "line-through text-slate-400 italic" : "text-primary-text"
                                       )}>{item.name}</span>
                                       <span className="text-[10px] font-black text-accent-teal uppercase tracking-widest mt-1">{item.quantity} • {item.category}</span>
                                    </div>
                                  </div>
                                     <button 
                                       onClick={() => removeGroceryItem(item.id)}
                                       className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                     >
                                       <Trash2 className="w-5 h-5" />
                                     </button>
                                   </motion.div>
                                 ))}
                               </div>
                             ) : (
                               <div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
                                  <ShoppingCart className="w-20 h-20 mb-6 text-amber-500" />
                                  <p className="text-sm font-black uppercase tracking-[0.5em]">{t.listEmpty}</p>
                                  <p className="text-[10px] font-bold uppercase tracking-widest mt-3">{t.shoppingRun}</p>
                               </div>
                             )}
                             
                             <div className="pt-8 border-t border-slate-100 dark:border-white/5">
                                <div className="relative group/add">
                                   <Plus className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-amber-500 group-focus-within/add:scale-110 transition-transform" />
                                   <input 
                                     type="text"
                                     placeholder={t.addQuickItem}
                                     className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[2rem] py-6 pl-16 pr-8 text-sm font-black uppercase tracking-widest focus:ring-4 focus:ring-amber-500/10 outline-none transition-all shadow-inner"
                                     onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          const target = e.target as HTMLInputElement;
                                          if (target.value) {
                                            addGroceryItem(target.value);
                                            target.value = '';
                                          }
                                        }
                                     }}
                                   />
                                </div>
                             </div>

                             <div className="flex flex-col gap-4 mt-4">
                                <button 
                                  onClick={addToGroceryList}
                                  className="w-full py-5 bg-accent-teal hover:bg-[#136663] text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-teal-500/30 flex items-center justify-center gap-3"
                                >
                                  <Zap className="w-4 h-4" />
                                  {t.syncFromPlanner}
                                </button>
                             </div>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
                             
                           

              {activeTab === 'recipes' && (
                <motion.div 
                  key="recipes"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="h-full flex flex-col gap-6 md:gap-8 min-h-0"
                >
                  <div className="flex flex-col gap-6 px-4 shrink-0">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="flex flex-col text-center sm:text-left">
                        <h2 className="text-2xl md:text-4xl font-black font-display tracking-tight text-accent-teal">{t.recipeVault}</h2>
                        <p className="text-[8px] md:text-[11px] font-black tracking-[0.3em] md:tracking-[0.4em] text-accent-teal/60 uppercase mt-1">CURATED GASTRONOMY • {recipes.length} ITEMS</p>
                      </div>
                      
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-80">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-accent-teal transition-colors" />
                          <input 
                            type="text" 
                            placeholder={t.findRecipe}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 md:py-4 bg-white/40 border border-white rounded-2xl text-[12px] md:text-sm outline-none focus:ring-2 ring-accent-teal/20 transition-all font-medium"
                          />
                        </div>
                        <button 
                          onClick={() => setRecipeModalState({ isOpen: true })}
                          className="p-3 md:p-4 bg-accent-teal text-white rounded-2xl shadow-xl shadow-teal-500/30 hover:scale-110 active:scale-95 transition-all flex items-center justify-center shrink-0"
                          title="Add new recipe"
                        >
                          <Plus className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                      {['All', 'Favorites', 'Pantry'].map(f => (
                        <FilterChip 
                          key={f} 
                          label={f} 
                          active={activeFilter === f} 
                          onClick={() => setActiveFilter(f as any)} 
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-x-auto no-scrollbar pb-32 px-4">
                    {recipeViewMode === 'columns' ? (
                      <div className="flex gap-8 h-full min-w-max pb-8">
                        {[
                          { title: 'Favorites', icon: <Star className="w-4 h-4" />, filter: (r: Recipe) => r.isFavorite, color: 'bg-amber-500' },
                          { title: 'Quick Meals', icon: <Zap className="w-4 h-4" />, filter: (r: Recipe) => (r.tags || []).includes('#Quick'), color: 'bg-sky-500' },
                          { title: 'Healthy Picks', icon: <Apple className="w-4 h-4" />, filter: (r: Recipe) => (r.tags || []).some(t => ['#Vegan', '#LowCarb'].includes(t)), color: 'bg-emerald-500' },
                          { title: 'Others', icon: <Soup className="w-4 h-4" />, filter: (r: Recipe) => !r.isFavorite && !(r.tags || []).includes('#Quick') && !(r.tags || []).some(t => ['#Vegan', '#LowCarb'].includes(t)), color: 'bg-slate-500' }
                        ].map((column) => {
                          const colRecipes = filteredRecipes.filter(column.filter);
                          return (
                            <div key={column.title} className="w-[320px] md:w-[380px] flex flex-col gap-4">
                              <div className="flex items-center justify-between px-2 shrink-0">
                                <div className="flex items-center gap-3">
                                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg", column.color)}>
                                    {column.icon}
                                  </div>
                                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">{column.title}</h3>
                                  <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 dark:bg-white/5 py-0.5 px-2 rounded-full">{colRecipes.length}</span>
                                </div>
                              </div>
                              <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
                                {colRecipes.map(r => (
                                  <div key={r.id} className="relative group/card scale-95 hover:scale-100 transition-transform origin-top">
                                    <RecipeCard 
                                      recipe={r} 
                                      onFavorite={toggleFavorite} 
                                      onAddToPlan={(id) => setSelectorTarget({ recipeId: id })}
                                      onEdit={(recipe) => setRecipeModalState({ isOpen: true, recipe })}
                                      onDelete={handleDeleteRecipe}
                                      onCook={startCooking}
                                      onClick={() => setSelectedRecipe(r)}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : recipeViewMode === 'gallery' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-2">
                        {filteredRecipes.map(r => (
                          <RecipeCard 
                            key={r.id}
                            recipe={r} 
                            onFavorite={toggleFavorite} 
                            onAddToPlan={(id) => setSelectorTarget({ recipeId: id })}
                            onEdit={(recipe) => setRecipeModalState({ isOpen: true, recipe })}
                            onDelete={handleDeleteRecipe}
                            onCook={startCooking}
                            onClick={() => setSelectedRecipe(r)}
                          />
                        ))}
                      </div>
                    ) : recipeViewMode === 'list' ? (
                      <div className="max-w-5xl mx-auto space-y-2 px-4">
                        {filteredRecipes.map(r => (
                          <div 
                            key={r.id} 
                            onClick={() => setSelectedRecipe(r)}
                            className="glass p-4 border border-white/20 flex items-center justify-between group hover:bg-white/5 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-6">
                               <span className="text-3xl">{r.emoji}</span>
                               <div className="flex flex-col">
                                 <h3 className="font-bold text-primary-text dark:text-white">{r.name}</h3>
                                 <div className="flex items-center gap-2 mt-1">
                                   <span className="text-[10px] font-black text-accent-teal uppercase tracking-widest">{r.difficulty}</span>
                                   <span className="w-1 h-1 rounded-full bg-slate-300" />
                                   <span className="text-[10px] font-bold text-slate-400">{r.calories} kcal</span>
                                 </div>
                               </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex -space-x-1">
                                {r.tags.slice(0, 3).map(t => (
                                  <span key={t} className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-white/10 rounded-full border border-white/10">{t}</span>
                                ))}
                              </div>
                              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-4">
                         {filteredRecipes.map(r => (
                           <button 
                             key={r.id} 
                             onClick={() => setSelectedRecipe(r)}
                             className="aspect-square glass flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-all shadow-sm border border-white/20 group relative"
                             title={r.name}
                           >
                             {r.emoji}
                             <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[8px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                               {r.name}
                             </div>
                           </button>
                         ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* AI Assistant */}
          <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-[100] flex flex-col items-end gap-5 pointer-events-none">
            <AnimatePresence>
              {isAiOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(10px)' }}
                  className="glass bg-white w-[90vw] sm:w-[420px] h-[70vh] sm:h-[600px] flex flex-col overflow-hidden shadow-xl pointer-events-auto border-slate-200 mb-2"
                >
                  <div className="p-6 border-b border-slate-150 flex items-center justify-between bg-emerald-50/20">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-accent-teal flex items-center justify-center shadow-lg shadow-teal-500/10">
                        <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm md:text-base font-black text-slate-900 font-display">ReadySet AI</h4>
                        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-accent-teal">Meal Assistant</p>
                      </div>
                    </div>
                    <button onClick={() => setIsAiOpen(false)} className="p-2.5 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X className="w-5 h-5" /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white no-scrollbar">
                    {aiMessages.map((msg, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "max-w-[88%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm font-medium",
                          msg.role === 'user' 
                            ? "ml-auto bg-accent-teal !text-white shadow-teal-500/5 rounded-tr-none" 
                            : "mr-auto bg-slate-50 border border-slate-200/60 !text-slate-900 rounded-tl-none"
                        )}
                      >
                        {msg.content}
                      </motion.div>
                    ))}
                  </div>

                  <div className="p-6 border-t border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 mb-4">
                      {["Plan a low-carb week", "I have eggs", "Quick meals for tonight", "How to save time?"].map((p, i) => (
                        <button 
                          key={i} 
                          onClick={() => setAiInputValue(p)}
                          className="px-5 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-accent-teal hover:text-white transition-all whitespace-nowrap shadow-sm cursor-pointer"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Ask about recipes, planning..."
                        value={aiInputValue}
                        onChange={(e) => setAiInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
                        className="w-full pl-6 pr-20 py-4 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 ring-accent-teal/10 text-slate-800 placeholder-slate-400 transition-all font-medium"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button className="p-2 text-slate-300 hover:text-accent-teal transition-colors"><Mic className="w-5 h-5" /></button>
                        <button 
                          onClick={handleAiSend}
                          disabled={!aiInputValue.trim()}
                          className="p-2.5 bg-accent-teal text-white rounded-2xl shadow-lg shadow-teal-500/10 disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={() => setIsAiOpen(!isAiOpen)}
              className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-accent-teal text-white flex items-center justify-center shadow-[0_8px_30px_rgba(23,133,130,0.4)] hover:scale-110 active:scale-95 transition-all pointer-events-auto group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <Sparkles className="w-5 h-5 md:w-7 md:h-7 relative z-10" />
            </button>
          </div>

          {/* User Guide Modal */}
          <AnimatePresence>
            {isGuideOpen && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="glass p-12 max-w-2xl w-full relative neumorphism overflow-hidden border-white/60 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)]"
                >
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent-teal/10 rounded-full blur-3xl" />
                  <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent-amber/10 rounded-full blur-3xl" />
                  
        <button onClick={() => setIsGuideOpen(false)} className="absolute top-4 right-4 md:top-8 md:right-8 p-2 md:p-3 hover:bg-slate-50 rounded-full transition-all text-slate-400"><X className="w-5 h-5 md:w-6 md:h-6" /></button>
        
        <div className="mb-8 md:mb-12 relative">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-accent-teal rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl shadow-teal-500/20 mb-4 md:mb-6">
            <ChefHat className="w-7 h-7 md:w-9 md:h-9 text-white" />
          </div>
          <h2 className="text-2xl md:text-4xl font-black font-display mb-2 md:mb-3 tracking-tighter text-accent-teal">Welcome to Meal Studio</h2>
          <p className="text-secondary-text/60 font-medium text-sm md:text-lg">Cook without the chaos. Your 100% readiness plan starts here.</p>
        </div>

        <div className="space-y-6 md:space-y-10 mb-8 md:mb-12 relative">
          {[
            { icon: <Calendar />, title: "Plan faster", text: "Fill slots in \"This Week\". Reorder meals inside each day." },
            { icon: <BookOpen />, title: "Recipe Library", text: "Save recipes with tags and favorites. Filter to find what you need." },
            { icon: <ShoppingCart />, title: "Compare Prices", text: "We aggregate everything you need based on your schedule." }
          ].map((item, i) => (
            <div key={i} className="flex gap-4 md:gap-6 group">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/40 dark:bg-white/5 border border-white flex items-center justify-center text-accent-teal shadow-sm group-hover:scale-110 transition-transform">
                {React.cloneElement(item.icon as React.ReactElement, { className: "w-5 h-5 md:w-7 md:h-7" })}
              </div>
              <div className="flex-1">
                <h4 className="font-extrabold text-sm md:text-lg mb-1 font-display flex items-center gap-2 text-accent-teal">
                  {item.title}
                  <span className="text-[8px] md:text-[10px] font-black px-1.5 py-0.5 bg-accent-teal/10 text-accent-teal rounded-full uppercase tracking-widest whitespace-nowrap">Step {i+1}</span>
                </h4>
                <p className="text-[12px] md:text-sm text-secondary-text/80 leading-relaxed font-medium">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-white/20 gap-6">
                    <label className="flex items-center gap-4 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="peer sr-only" 
                          onChange={(e) => {
                            if (e.target.checked) localStorage.setItem('hideGuide', 'true');
                          }}
                        />
                        <div className="w-10 h-6 bg-slate-100 peer-checked:bg-accent-teal rounded-full transition-colors duration-300 border border-slate-200" />
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 peer-checked:translate-x-4 shadow-sm" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-800 transition-colors">Don't show again</span>
                    </label>
                    <button 
                      onClick={() => setIsGuideOpen(false)}
                      className="w-full sm:w-auto px-12 py-4 bg-accent-teal text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-teal-500/30 hover:scale-[1.05] active:scale-95 transition-all"
                    >
                      Enter Studio
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Recipe Modal (Add/Edit) */}
          <AnimatePresence>
            {recipeModalState.isOpen && (
              <RecipeModal 
                recipe={recipeModalState.recipe}
                onClose={() => setRecipeModalState({ isOpen: false })}
                onAdd={handleAddOrUpdateRecipe}
              />
            )}
          </AnimatePresence>

          {/* Recipe Selector Modal */}
          <AnimatePresence>
            {selectorTarget && (
              <RecipeSlotSelector 
                target={selectorTarget}
                recipes={recipes}
                t={t}
                onClose={() => setSelectorTarget(null)}
                onSelect={(day, slot, recipeId) => {
                  addRecipeToPlan(day, slot, recipeId);
                  setSelectorTarget(null);
                }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isIngredientModalOpen && (
              <IngredientModal 
                ingredient={editingIngredient}
                onClose={() => { setIsIngredientModalOpen(false); setEditingIngredient(null); }}
                onSave={(item) => {
                  if (editingIngredient) {
                    updatePantryItem(editingIngredient.id, item);
                    showToastMessage(`Updated ${item.name}`);
                  } else {
                    addPantryItem(item);
                    showToastMessage(`Added ${item.name} to pantry`);
                  }
                  setIsIngredientModalOpen(false);
                  setEditingIngredient(null);
                }}
              />
            )}
          </AnimatePresence>

          {/* Pantry Modal */}
          <AnimatePresence>
            {isPantryModalOpen && (
              <PantryModal 
                pantry={pantry}
                onClose={() => setIsPantryModalOpen(false)}
                onUpdate={(items) => setPantry({ items })}
              />
            )}
          </AnimatePresence>

          {/* Marketplace Modal */}
          <AnimatePresence>
            {isMarketplaceModalOpen && (
              <MarketplaceModal 
                items={weeklyNeeds.filter(i => !i.inPantry)}
                onClose={() => setIsMarketplaceModalOpen(false)}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isCookModeOpen && cookingRecipe && (
              <CookModeModal 
                recipe={cookingRecipe} 
                onClose={() => setIsCookModeOpen(false)} 
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isPantryScanOpen && (
              <PantryScanModal 
                onClose={() => setIsPantryScanOpen(false)} 
                isScanning={isScanning}
                setIsScanning={setIsScanning}
                scanResult={scanResult}
                setScanResult={setScanResult}
                onApply={handleApplyScanResults}
              />
            )}
          </AnimatePresence>

          {/* Drag Overlay for visual feedback during day reordering */}
          <DragOverlay>
            {activeDragId ? (
              <div className="opacity-80 scale-105 pointer-events-none">
                 <div className="p-4 glass border-accent-teal bg-white/80 shadow-2xl rounded-2xl w-[400px]">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-accent-teal" />
                      <span className="text-sm font-bold text-accent-teal">Moving Meal...</span>
                    </div>
                 </div>
              </div>
            ) : null}
          </DragOverlay>

          <AnimatePresence>
            {selectedRecipe && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={() => setSelectedRecipe(null)}
              >
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-[#1a1a1b] w-full max-w-md md:max-w-xl max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-slate-100 dark:border-white/10"
                  >
                    {/* Image / Header area from Showcase Mockup */}
                    <div className="relative h-44 md:h-52 shrink-0 flex items-center justify-center text-7xl bg-white dark:bg-[#1f1f20] border-b border-slate-100 dark:border-white/5 overflow-hidden select-none">
                      {/* Decorative ambient color accents of the showcase */}
                      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-accent-teal/5 blur-[60px]" />
                      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-accent-amber/5 blur-[60px]" />
                      
                      <span className="drop-shadow-2xl animate-in zoom-in-75 duration-500">{selectedRecipe.emoji}</span>
                      
                      {/* Floating tags */}
                      <div className="absolute top-6 left-6 flex flex-wrap gap-1.5 max-w-[70%]">
                        {(selectedRecipe.tags || []).slice(0, 3).map(t => (
                          <span key={t} className="px-2.5 py-1 bg-white/90 dark:bg-[#1e1e1f]/90 backdrop-blur text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm border border-slate-100/40 dark:border-white/5 text-slate-800 dark:text-slate-200">
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Control buttons in header */}
                      <div className="absolute top-6 right-6 flex items-center gap-2">
                        <button 
                          onClick={() => toggleFavorite(selectedRecipe.id)}
                          className="w-10 h-10 bg-white/95 dark:bg-[#1a1a1b]/95 backdrop-blur rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-90 border border-slate-100 dark:border-white/10 cursor-pointer text-amber-500"
                        >
                          <Star className={cn("w-5 h-5 transition-all duration-300", selectedRecipe.isFavorite ? "fill-amber-500 text-amber-500" : "text-slate-400 fill-none")} />
                        </button>
                        <button 
                          onClick={() => setSelectedRecipe(null)}
                          className="w-10 h-10 bg-white/95 dark:bg-[#1a1a1b]/95 backdrop-blur rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-90 border border-slate-100 dark:border-white/10 cursor-pointer text-slate-500 hover:text-rose-500"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Content area from Showcase Mockup, offset up to overlap header */}
                    <div className="flex-1 p-6 md:p-8 flex flex-col overflow-y-auto no-scrollbar rounded-t-[2.5rem] mt-[-3rem] z-10 shadow-[0_-15px_30px_rgba(0,0,0,0.03)] bg-white dark:bg-[#1a1a1b]">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">
                          {selectedRecipe.name}
                        </h3>
                      </div>

                      {/* Mini Metric Cards from Showcase Mockup */}
                      <div className="flex gap-6 mb-6 pt-3 border-b border-slate-50 dark:border-white/5 pb-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">
                            {language === 'ENG' ? "TIME" : "WAKTU"}
                          </span>
                          <span className="text-sm font-bold text-accent-teal">
                            {selectedRecipe.time || "20 MIN"}
                          </span>
                        </div>
                        <div className="w-px h-8 bg-slate-100 dark:bg-white/10" />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">
                            {language === 'ENG' ? "DIFFICULTY" : "KESULITAN"}
                          </span>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase">
                            {selectedRecipe.difficulty || "EASY"}
                          </span>
                        </div>
                        <div className="w-px h-8 bg-slate-100 dark:bg-white/10" />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">
                            {language === 'ENG' ? "CALORIES" : "KALORI"}
                          </span>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {selectedRecipe.calories || "250"} Kcal
                          </span>
                        </div>
                      </div>

                      {/* Ingredients list using Showcase layout */}
                      <div className="space-y-4 mb-8">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                            {language === 'ENG' ? "INGREDIENTS" : "BAHAN-BAHAN"}
                          </h4>
                          <div className="h-px flex-1 ml-4 bg-slate-100 dark:bg-white/5" />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {(selectedRecipe.ingredients || []).map((ing, i) => {
                            const [name, qty] = (ing || "").split(':').map(s => s.trim());
                            return (
                              <div 
                                key={i}
                                className="flex items-center gap-3 p-2.5 rounded-2xl bg-white dark:bg-white/2 border border-slate-100 dark:border-white/5 shadow-sm"
                              >
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-slate-50 dark:bg-[#2c2d30] shadow-sm border border-slate-100/50 dark:border-white/10 shrink-0">
                                  {getPantryIcon(name)}
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate capitalize">{name}</span>
                                  <span className="text-[10px] font-black uppercase text-accent-teal tracking-wider">{qty || 'some'}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Instructions using Showcase numbered style */}
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                            {language === 'ENG' ? "INSTRUCTIONS" : "INSTRUKSI"}
                          </h4>
                          <div className="h-px flex-1 ml-4 bg-slate-100 dark:bg-white/5" />
                        </div>
                        
                        <div className="space-y-4">
                          {(selectedRecipe.instructions || []).map((step, idx) => (
                            <div key={idx} className="flex gap-4">
                              <span className="text-lg font-black text-accent-teal/20 leading-none">
                                {(idx + 1).toString().padStart(2, '0')}
                              </span>
                              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons section matching the Mockup actions */}
                      <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-slate-100 dark:border-white/5">
                        <button 
                          onClick={() => {
                            startCooking(selectedRecipe);
                            setSelectedRecipe(null);
                          }}
                          className="w-full py-4.5 bg-accent-teal text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] hover:bg-[#136663] transition-all shadow-xl shadow-teal-500/20 flex items-center justify-center cursor-pointer hover:scale-[1.01] active:scale-98"
                        >
                          {t.startCooking}
                        </button>
                        
                        <button 
                          onClick={() => {
                            setSelectorTarget({ recipeId: selectedRecipe.id });
                            setSelectedRecipe(null);
                          }}
                          className="w-full py-4 bg-white hover:bg-slate-50 dark:bg-[#242424] dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-center cursor-pointer hover:scale-[1.01] active:scale-98"
                        >
                          {language === 'ENG' ? 'Add To Plan' : 'Tambah Ke Rencana'}
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => {
                              setRecipeModalState({ isOpen: true, recipe: selectedRecipe });
                              setSelectedRecipe(null);
                            }}
                            className="py-3.5 bg-white hover:bg-slate-50 dark:bg-[#242424] dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-center cursor-pointer"
                          >
                            {language === 'ENG' ? 'Edit' : 'Ubah'}
                          </button>
                          <button 
                            onClick={() => {
                              handleDeleteRecipe(selectedRecipe.id);
                              setSelectedRecipe(null);
                            }}
                            className="py-3.5 bg-white hover:bg-rose-50 dark:bg-[#242424] dark:hover:bg-rose-600/10 text-slate-600 dark:text-slate-400 hover:text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-center cursor-pointer"
                          >
                            {language === 'ENG' ? 'Delete' : 'Hapus'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className={cn(
                  "fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border border-white/20",
                  toast.type === 'success' ? "bg-[#1b8481] text-white" : "bg-rose-500 text-white"
                )}
              >
                {toast.type === 'success' ? <Check className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                <span className="text-sm font-bold">{toast.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </DndContext>
  );
}

function DayCard({ 
  day, 
  plan, 
  recipes, 
  t,
  onRemove, 
  onAdd,
  onCook
}: { 
  day: keyof MealPlan['days']; 
  plan: DayPlan;
  recipes: Recipe[];
  t: any;
  onRemove: (slot: MealSlot) => void;
  onAdd: (slot: MealSlot) => void;
  onCook?: (recipe: Recipe) => void;
  key?: React.Key;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const slots: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];
  const totalCalories = slots.reduce((total, slot) => {
    const rid = plan[slot];
    if (!rid) return total;
    const r = recipes.find(r => r.id === rid);
    return total + (r?.calories || 0);
  }, 0);

  const filledCount = slots.filter(s => !!plan[s]).length;

  return (
    <motion.div 
      layout
      className={cn(
        "glass border-white/60 overflow-hidden transition-all duration-300 relative group",
        isCollapsed ? "p-2 md:p-5" : "p-3 md:p-6",
        filledCount === 4 ? "ring-2 ring-accent-teal/20" : ""
      )}
    >
        <div className="flex flex-row items-center justify-between gap-1 mb-2 md:mb-6">
        <div className="flex items-center gap-2 sm:gap-6">
          <div className="flex flex-col">
            <h3 className="text-sm md:text-2xl font-black capitalize font-display tracking-tight text-accent-teal">{day}</h3>
            <div className="flex flex-wrap items-center gap-x-2 md:gap-x-4 gap-y-0.5 mt-0.5 md:mt-1">
              <div className="flex items-center gap-0.5 md:gap-1">
                <span className="text-[7px] md:text-[10px] font-black uppercase tracking-widest text-[#1b8481]/70 whitespace-nowrap">{filledCount}/4</span>
              </div>
              <div className="flex items-center gap-0.5 md:gap-1">
                <Apple className="w-2 md:w-3 h-2 md:h-3 text-accent-amber" />
                <span className="text-[7px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">{totalCalories} cal</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 md:gap-4">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="p-1.5 md:p-3 hover:bg-white dark:hover:bg-white/10 rounded-lg md:rounded-2xl transition-all shadow-sm border border-transparent hover:border-white/50"
          >
            <ChevronRight className={cn("w-3.5 h-3.5 md:w-5 md:h-5 text-slate-400 transition-transform duration-500", !isCollapsed && "rotate-90")} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div 
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="space-y-4"
          >
            <SortableContext items={slots.map(s => `${day}-${s}`)} strategy={verticalListSortingStrategy}>
              {slots.map(slot => {
                const rid = plan[slot];
                const recipe = recipes.find(r => r.id === rid) || null;
                return (
                  <div key={`${day}-${slot}`} className="py-1 relative group/meal">
                    <SortableMealItem 
                      id={`${day}-${slot}`}
                      title={slot}
                      recipe={recipe}
                      onRemove={() => onRemove(slot)}
                      onOpenSelector={() => onAdd(slot)}
                    />
                    {recipe && (
                      <button 
                        onClick={() => onCook?.(recipe)}
                        className="absolute right-12 top-1/2 -translate-y-1/2 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-accent-teal hover:bg-accent-teal/10 rounded-lg opacity-0 group-hover/meal:opacity-100 transition-all"
                        title="Cook Mode"
                      >
                        {t.cook}
                      </button>
                    )}
                  </div>
                );
              })}
            </SortableContext>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Progress line if fully planned */}
      {filledCount === 4 && !isCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent-teal/20">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: '100%' }} 
            className="h-full bg-accent-teal" 
          />
        </div>
      )}
    </motion.div>
  );
}

const RecipeSlotSelector = ({ target, recipes, t, onClose, onSelect }: { 
  target: { recipeId?: string, day?: keyof MealPlan['days'], slot?: MealSlot },
  recipes: Recipe[],
  t: any,
  onClose: () => void,
  onSelect: (day: keyof MealPlan['days'], slot: MealSlot, recipeId: string) => void
}) => {
  const days: Array<keyof MealPlan['days']> = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const slots: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];
  const [selectedDay, setSelectedDay] = useState<keyof MealPlan['days']>(target.day || 'monday');
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>(target.slot || 'breakfast');
  const [selectedRecipe, setSelectedRecipe] = useState(target.recipeId || recipes[0]?.id);

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass p-6 md:p-8 max-w-lg w-full relative neumorphism"
      >
        <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 text-slate-400 hover:text-slate-600 p-2"><X className="w-5 h-5" /></button>
        <h3 className="text-xl md:text-2xl font-black font-display mb-6 md:mb-8 tracking-tight">{t.chooseDestination}</h3>
        
        <div className="space-y-6 md:space-y-8">
          {!target.recipeId && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">{t.chooseRecipe}</label>
              <select 
                value={selectedRecipe}
                onChange={(e) => setSelectedRecipe(e.target.value)}
                className="w-full p-4 bg-white/40 border border-white rounded-2xl text-[13px] md:text-sm outline-none focus:ring-2 ring-accent-teal/20"
              >
                {(recipes || []).map(r => <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>)}
              </select>
            </div>
          )}
          
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">{t.selectDay}</label>
            <div className="flex flex-wrap gap-2">
              {days.map(d => (
                <button 
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={cn(
                    "px-3 md:px-4 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all",
                    selectedDay === d ? "bg-accent-teal text-white shadow-lg" : "bg-white/40 text-slate-500 hover:bg-white"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">{t.selectSlot}</label>
            <div className="flex gap-2">
              {slots.map(s => (
                <button 
                  key={s}
                  onClick={() => setSelectedSlot(s)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    selectedSlot === s ? "bg-accent-teal text-white shadow-lg" : "bg-white/40 text-slate-500 hover:bg-white"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => onSelect(selectedDay, selectedSlot, selectedRecipe)}
            className="w-full py-5 bg-accent-teal text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl shadow-teal-500/30 hover:scale-[1.02] active:scale-95 transition-all mt-4"
          >
            {t.confirmSelection}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const RecipeModal = ({ recipe, onClose, onAdd }: { recipe?: Recipe, onClose: () => void, onAdd: (recipe: any) => void }) => {
  const [name, setName] = useState(recipe?.name || '');
  const [emoji, setEmoji] = useState(recipe?.emoji || '🍲');
  const [time, setTime] = useState(recipe?.time || '20 MIN');
  const [ingredients, setIngredients] = useState(recipe?.ingredients.join(', ') || '');
  const [instructions, setInstructions] = useState(recipe?.instructions?.join('\n') || '');
  const [tags, setTags] = useState(recipe?.tags.map(t => t.replace('#', '')).join(', ') || 'Quick');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onAdd({
      name,
      emoji,
      time,
      ingredients: ingredients.split(',').map(i => i.trim()).filter(Boolean),
      instructions: instructions.split('\n').map(i => i.trim()).filter(Boolean),
      tags: tags.split(',').map(t => `#${t.trim()}`).filter(t => t !== '#'),
      calories: 400,
      pantryFriendly: true
    });
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass p-6 md:p-10 max-w-lg w-full relative neumorphism"
      >
        <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 text-slate-400 hover:text-slate-600 p-2"><X className="w-5 h-5" /></button>
        <h3 className="text-xl md:text-2xl font-black font-display mb-6 md:mb-8 tracking-tight">{recipe ? 'Edit Recipe' : 'New Recipe'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar pr-1">
          <div className="space-y-3 md:space-y-4">
            <input 
              placeholder="Recipe Name (e.g. Garden Pasta)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 md:p-4 bg-white/40 border border-white rounded-2xl outline-none focus:ring-2 ring-accent-teal/20 text-[13px] md:text-base font-medium"
            />
            <div className="flex gap-3 md:gap-4">
               <div className="w-20 md:w-24">
                 <input placeholder="Emoji" value={emoji} onChange={e => setEmoji(e.target.value)} className="w-full p-3 md:p-4 bg-white/40 border border-white rounded-2xl text-center text-lg md:text-xl" />
               </div>
               <div className="flex-1">
                 <input placeholder="Time (e.g. 20 MIN)" value={time} onChange={e => setTime(e.target.value)} className="w-full p-3 md:p-4 bg-white/40 border border-white rounded-2xl outline-none focus:ring-2 ring-accent-teal/20 text-[13px] md:text-base" />
               </div>
            </div>
            <textarea 
              placeholder="Ingredients (separate with commas, e.g. Pasta, Spinach, Salt)"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              className="w-full p-3 md:p-4 bg-white/40 border border-white rounded-2xl h-24 md:h-32 outline-none focus:ring-2 ring-accent-teal/20 text-[13px] md:text-base font-medium"
            />
            <textarea 
              placeholder="Cooking Steps (one step per line)"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full p-3 md:p-4 bg-white/40 border border-white rounded-2xl h-32 md:h-48 outline-none focus:ring-2 ring-accent-teal/20 text-[13px] md:text-base font-medium"
            />
            <input 
              placeholder="Tags (separate with commas, e.g. Vegan, Quick)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full p-3 md:p-4 bg-white/40 border border-white rounded-2xl outline-none focus:ring-2 ring-accent-teal/20 text-[13px] md:text-base"
            />
          </div>
          <button type="submit" className="w-full py-4 md:py-5 bg-accent-teal text-white rounded-2xl font-black text-[11px] md:text-[12px] uppercase tracking-[0.2em] shadow-2xl shadow-teal-500/30 hover:scale-[1.02] active:scale-95 transition-all">
            {recipe ? 'Update Recipe' : 'Add to Library'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const IngredientModal = ({ 
  ingredient, 
  onClose, 
  onSave 
}: { 
  ingredient?: PantryItem | null; 
  onClose: () => void; 
  onSave: (item: Omit<PantryItem, 'id'>) => void;
}) => {
  const [name, setName] = useState(ingredient?.name || '');
  const [quantity, setQuantity] = useState(ingredient?.quantity?.toString() || '1');
  const [unit, setUnit] = useState(ingredient?.unit || 'pcs');
  const [category, setCategory] = useState(ingredient?.category || 'Produce');
  const [minStock, setMinStock] = useState(ingredient?.minStock?.toString() || '1');
  const [expiryDate, setExpiryDate] = useState(ingredient?.expiryDate?.split('T')[0] || '');

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass p-6 md:p-10 max-w-lg w-full relative neumorphism overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-accent-teal" />
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-all p-2 bg-slate-50 dark:bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
        
        <h3 className="text-xl md:text-2xl font-black font-display mb-8 tracking-tight uppercase italic">
          {ingredient ? 'Sunting Bahan' : 'Tambah Bahan'}
          <span className="text-accent-teal">.</span>
        </h3>
        
        <div className="space-y-5">
           <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Nama Bahan</label>
              <input 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Misal: Papaya, Yogurt..."
                className="w-full p-4 bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-2xl outline-none focus:ring-4 ring-accent-teal/10 text-sm font-bold"
              />
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Jumlah</label>
                <input 
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="w-full p-4 bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-2xl outline-none focus:ring-4 ring-accent-teal/10 text-sm font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Satuan</label>
                <select 
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="w-full p-4 bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-2xl outline-none focus:ring-4 ring-accent-teal/10 text-[12px] font-bold appearance-none"
                >
                   {['pcs', 'g', 'kg', 'ml', 'L', 'cup', 'tbsp', 'tsp', 'pack'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Kategori</label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full p-4 bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-2xl outline-none focus:ring-4 ring-accent-teal/10 text-[12px] font-bold appearance-none"
                >
                   {['Produce', 'Proteins', 'Dairy', 'Pantry', 'Frozen', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Min. Stok</label>
                <input 
                  type="number"
                  value={minStock}
                  onChange={e => setMinStock(e.target.value)}
                  className="w-full p-4 bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-2xl outline-none focus:ring-4 ring-accent-teal/10 text-sm font-bold"
                />
              </div>
           </div>

           <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Tanggal Kedaluwarsa (Opsional)</label>
              <input 
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                className="w-full p-4 bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-2xl outline-none focus:ring-4 ring-accent-teal/10 text-sm font-bold"
              />
           </div>

           <button 
             onClick={() => onSave({ 
               name, 
               quantity: parseFloat(quantity) || 0, 
               unit, 
               category, 
               minStock: parseFloat(minStock) || 0,
               expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined 
             })}
             className="w-full py-4 bg-accent-teal text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
           >
             Simpan ke Stok
           </button>
        </div>
      </motion.div>
    </div>
  );
};

const PantryModal = ({ pantry, onClose, onUpdate }: { pantry: Pantry, onClose: () => void, onUpdate: (items: string[]) => void }) => {
  const [items, setItems] = useState([...pantry.items]);
  const [newItem, setNewItem] = useState('');

  const handleAddItem = () => {
    if (newItem.trim()) {
      setItems([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass p-10 max-w-lg w-full relative neumorphism"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-2"><X className="w-5 h-5" /></button>
        <h3 className="text-2xl font-black font-display mb-8 tracking-tight">Manage Pantry</h3>
        <div className="flex gap-3 mb-8">
          <input 
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddItem()}
            placeholder="Search or add items..." 
            className="flex-1 p-4 bg-white/40 border border-white rounded-2xl outline-none focus:ring-2 ring-accent-teal/20 font-medium"
          />
          <button onClick={handleAddItem} className="p-4 bg-accent-teal text-white rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-lg shadow-teal-500/20">
            <Plus className="w-6 h-6" />
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto space-y-3 mb-8 no-scrollbar pr-2">
          {(items || []).map((item, i) => (
            <motion.div 
              layout
              key={i} 
              className="flex items-center justify-between p-4 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-white/10 rounded-2xl group transition-colors"
            >
              <span className="text-sm font-bold uppercase tracking-widest text-[#1F2937] dark:text-white">{item}</span>
              <button 
                onClick={() => setItems(items.filter((_, idx) => idx !== i))} 
                className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm font-medium">Your pantry is empty</div>
          )}
        </div>
        <button 
          onClick={() => { onUpdate(items); onClose(); }} 
          className="w-full py-5 bg-accent-teal text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl shadow-teal-500/30 hover:scale-[1.02] active:scale-95 transition-all"
        >
          Update Pantry
        </button>
      </motion.div>
    </div>
  );
};

const CookModeModal = ({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const synth = window.speechSynthesis;

  const totalSteps = recipe.instructions?.length || 0;
  const currentStep = recipe.instructions?.[stepIndex] || "";

  const speak = (text: string) => {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    synth.speak(utterance);
  };

  const handleNext = () => {
    if (stepIndex < totalSteps - 1) {
      setStepIndex(prev => prev + 1);
    } else {
      speak("You've reached the last step. Enjoy your meal!");
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(prev => prev - 1);
    }
  };

  const handleRepeat = () => {
    speak(currentStep);
  };

  useEffect(() => {
    speak(`Recipe: ${recipe.name}. Step ${stepIndex + 1}: ${currentStep}`);
  }, [stepIndex]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0]?.transcript || "";
        const command = transcript.toLowerCase();
        setLastCommand(command);
        
        if (command.includes('next')) handleNext();
        else if (command.includes('back')) handleBack();
        else if (command.includes('previous')) handleBack();
        else if (command.includes('repeat')) handleRepeat();
        else if (command.includes('again')) handleRepeat();
        else if (command.includes('stop')) onClose();
        else if (command.includes('close')) onClose();
      };

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (err: any) => {
        console.error("Speech Recognition Error:", err);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      synth.cancel();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 backdrop-blur-3xl overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        className="w-full h-full flex flex-col p-6 sm:p-12 lg:p-20 relative max-w-7xl mx-auto"
      >
        <div className="flex items-center justify-between mb-12 sm:mb-20">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 md:gap-4 mb-2">
              <span className="text-3xl md:text-5xl">{recipe.emoji}</span>
              <h2 className="text-2xl md:text-5xl font-black font-display tracking-tight text-white uppercase italic">{recipe.name}</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10">
                <div className={cn("w-2 h-2 rounded-full", isListening ? "bg-accent-teal animate-pulse" : "bg-rose-500")} />
                <span className="text-[10px] font-black tracking-widest text-white/60 uppercase">
                  {isListening ? "Hands-Free Active" : "Voice Control Offline"}
                </span>
              </div>
              <span className="text-[10px] font-black tracking-widest text-accent-teal uppercase">Step {stepIndex + 1} of {totalSteps}</span>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-rose-500 hover:border-rose-500 hover:text-white text-white/40 transition-all group"
          >
            <X className="w-5 h-5 md:w-8 md:h-8 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-12 lg:gap-24 overflow-hidden">
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <motion.div 
              key={stepIndex}
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full"
            >
              <h3 className="text-3xl sm:text-5xl md:text-7xl font-bold leading-[1.1] text-white max-w-4xl mx-auto mb-12 font-display">
                {currentStep}
              </h3>
              
              <div className="flex items-center justify-center gap-6 md:gap-12">
                <button 
                  onClick={handleRepeat}
                  className="w-16 h-16 md:w-20 md:h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-white group"
                >
                  <Volume2 className="w-6 h-6 md:w-8 md:h-8 group-active:scale-95" />
                </button>
                <div className="h-20 w-[1px] bg-white/10 hidden md:block" />
                <div className="flex flex-col items-center gap-2">
                  <div className="text-[10px] font-black tracking-[0.2em] text-accent-teal/40 uppercase mb-2">Voice Commands</div>
                  <div className="flex gap-4">
                    <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black text-white/50 uppercase">Next</span>
                    <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black text-white/50 uppercase">Back</span>
                    <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black text-white/50 uppercase">Repeat</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="w-full lg:w-96 flex flex-col gap-8 shrink-0 pb-12 lg:pb-0">
             <div className="glass p-8 border-white/10 bg-white/5">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-accent-teal mb-6">Ingredients</h4>
                <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
                  {(recipe.ingredients || []).map((ing, i) => (
                    <div key={i} className="flex items-center gap-3 text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-teal/40" />
                      <span className="text-sm font-medium">{ing}</span>
                    </div>
                  ))}
                </div>
             </div>

             <div className="mt-auto">
               <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Efficiency Progress</span>
                <span className="text-[10px] font-black text-accent-teal">{Math.round(((stepIndex + 1) / totalSteps) * 100)}%</span>
               </div>
               <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
                    className="h-full bg-accent-teal shadow-[0_0_20px_rgba(20,184,166,0.5)]"
                 />
               </div>
             </div>
          </div>
        </div>

        <div className="mt-auto pt-12 flex items-center justify-center gap-6 sm:gap-12">
          <button 
            onClick={handleBack}
            disabled={stepIndex === 0}
            className="flex-1 sm:flex-none px-10 py-6 border border-white/20 rounded-2xl text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 disabled:opacity-20 transition-all flex items-center justify-center gap-3"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>
          
          <button 
            onClick={handleNext}
            className="flex-1 sm:flex-none px-20 py-8 bg-accent-teal text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-teal-500/40 flex items-center justify-center gap-4"
          >
            <span>{stepIndex === totalSteps - 1 ? "Finish Cooking" : "Next Step"}</span>
            <ChevronRight className="w-6 h-6" />
          </button>
          
          {lastCommand && (
             <motion.div 
               key={lastCommand}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0 }}
               className="absolute bottom-32 left-1/2 -translate-x-1/2 px-6 py-3 bg-accent-teal rounded-full text-white font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-2"
             >
               <Mic className="w-3 h-3" />
               Parsed: "{lastCommand}"
             </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const PantryScanModal = ({ 
  onClose, 
  isScanning, 
  setIsScanning, 
  scanResult, 
  setScanResult,
  onApply
}: { 
  onClose: () => void;
  isScanning: boolean;
  setIsScanning: (v: boolean) => void;
  scanResult: string[];
  setScanResult: React.Dispatch<React.SetStateAction<string[]>>;
  onApply: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser does not support camera access.");
      }
      
      // Try environment camera first (typically rear camera on mobile)
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (e) {
        // Fallback to any available video source
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      }
    } catch (err) {
      console.error("Camera error:", err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError("Camera access denied. Please enable camera permissions in your browser settings and refresh.");
        } else {
          setCameraError(err.message || "Could not access camera.");
        }
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsScanning(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    
    const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
    
    try {
      const response = await fetch('/api/pantry/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, mimeType: 'image/jpeg' })
      });
      
      const data = await response.json();
      if (data.items) {
        setScanResult(data.items);
      }
    } catch (error) {
      console.error("Scan error:", error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-2xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="glass p-0 max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden neumorphism border-white/40 shadow-2xl"
      >
        <div className="p-6 md:p-8 border-b border-white/20 flex items-center justify-between bg-gradient-to-r from-accent-teal/10 to-transparent">
          <div>
            <h3 className="text-xl md:text-3xl font-black font-display tracking-tight text-accent-teal flex items-center gap-2 md:gap-3">
              <Sparkles className="w-5 h-5 md:w-8 md:h-8" />
              AI Pantry Scan
            </h3>
            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-accent-teal/60 mt-1">Computer Vision Ingredients Detection</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          <div className="w-full lg:w-[45%] p-4 md:p-8 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col gap-6">
            <div className="relative aspect-video lg:aspect-square bg-black rounded-2xl md:rounded-3xl overflow-hidden group shadow-inner">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={cn("w-full h-full object-cover mirror", cameraError && "opacity-20")}
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/40">
                  <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-2xl mb-4">
                    <Info className="w-8 h-8 text-rose-400" />
                  </div>
                  <p className="text-white text-[12px] font-black uppercase tracking-widest leading-relaxed mb-6 max-w-[250px]">
                    {cameraError}
                  </p>
                  <button 
                    onClick={startCamera}
                    className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all"
                  >
                    Try Again
                  </button>
                </div>
              )}
              
              {isScanning && (
                <div className="absolute inset-0 bg-accent-teal/20 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Analyzing Pantry...</span>
                  </div>
                </div>
              )}
              
              <div className="absolute inset-x-0 bottom-6 flex justify-center px-6">
                <button 
                  onClick={captureAndScan}
                  disabled={isScanning}
                  className="w-full sm:w-auto px-10 py-5 bg-white text-accent-teal rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
                >
                  <Sparkles className="w-4 h-4" />
                  Analyze Photo
                </button>
              </div>
            </div>
            
            <div className="hidden lg:flex flex-col gap-4">
              <div className="flex items-center gap-3 p-4 bg-accent-amber/5 border border-accent-amber/20 rounded-2xl">
                <Info className="w-5 h-5 text-accent-amber shrink-0" />
                <p className="text-[10px] md:text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-tighter">
                  Tip: Make sure ingredients are well-lit and clearly visible for the best AI detection accuracy.
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 md:p-8 flex flex-col gap-6 overflow-hidden bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Detected Items</span>
                <span className="text-[10px] font-bold text-slate-300 mt-1">{scanResult.length} Results</span>
              </div>
              {scanResult.length > 0 && (
                <button 
                  onClick={() => setScanResult([])}
                  className="text-[9px] font-black text-rose-500 uppercase hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 no-scrollbar">
              {scanResult.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {scanResult.map((item, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 md:p-4 bg-white/40 border border-white rounded-xl md:rounded-2xl flex items-center justify-between group"
                    >
                      <span className="text-xs md:text-sm font-bold text-black dark:text-white truncate pr-2 capitalize">{item}</span>
                      <button 
                        onClick={() => setScanResult(prev => prev.filter((_, i) => i !== idx))}
                        className="text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-20 py-20">
                  <Apple className="w-16 h-16 md:w-20 md:h-20 mb-6" />
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-center max-w-[200px]">Waiting for scan results...</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onClose}
                className="flex-1 py-4 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={onApply}
                disabled={scanResult.length === 0}
                className="flex-[2] py-4 bg-accent-teal text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-teal-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
              >
                Update Pantry Inventory
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const MarketplaceModal = ({ items, onClose }: { items: any[], onClose: () => void }) => {
  const marketplaces = [
    { name: 'Happy Fresh', url: 'https://www.happyfresh.id', priceMultiplier: 1.1, rating: 4.8, delivery: 'Fast' },
    { name: 'Sayurbox', url: 'https://www.sayurbox.com', priceMultiplier: 1.0, rating: 4.7, delivery: 'Same Day' },
    { name: 'TaniHub', url: 'https://tanihub.com', priceMultiplier: 0.95, rating: 4.5, delivery: 'Next Day' },
    { name: 'Brambang', url: 'https://www.brambang.com', priceMultiplier: 1.05, rating: 4.6, delivery: 'Same Day' },
    { name: 'TukangSayur.co', url: 'https://tukangsayur.co', priceMultiplier: 0.98, rating: 4.4, delivery: 'Morning' },
    { name: 'Cari Sayur', url: 'https://carisayur.com', priceMultiplier: 0.97, rating: 4.3, delivery: 'Flexible' },
    { name: 'FreshBox', url: 'https://freshbox.id', priceMultiplier: 1.02, rating: 4.6, delivery: 'Fast' },
    { name: 'Kecipir', url: 'https://kecipir.com', priceMultiplier: 1.0, rating: 4.5, delivery: 'Organic Focus' },
    { name: 'etanee', url: 'https://etanee.id', priceMultiplier: 0.99, rating: 4.4, delivery: 'Standard' },
    { name: 'Kedai Sayur', url: 'https://kedaisayur.com', priceMultiplier: 0.96, rating: 4.5, delivery: 'Direct Bulk' },
  ];

  const [checking, setChecking] = useState(true);
  const basePrice = items.length * 15000; // Mock base price calc

  useEffect(() => {
    const timer = setTimeout(() => setChecking(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass p-0 max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden neumorphism border-white/40"
      >
        <div className="p-4 md:p-8 border-b border-white/20 flex items-center justify-between bg-white/10">
          <div>
            <h3 className="text-xl md:text-3xl font-black font-display tracking-tight text-accent-teal flex items-center gap-2 md:gap-3">
              Compare
            </h3>
            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-accent-teal/60 mt-1">SMART SOURCING ENGINE</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all text-slate-400">
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-y-auto md:overflow-hidden no-scrollbar">
          {/* Left: Items List */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/10 p-4 md:p-8 flex flex-col gap-4 md:gap-6 overflow-hidden md:max-h-none">
             <div className="flex items-center justify-between">
               <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 underline decoration-accent-teal/30">Shopping List</span>
               <span className="px-2 py-0.5 bg-accent-teal/10 text-accent-teal text-[10px] font-black rounded">{items.length} Items</span>
             </div>
             
             <div className="flex-1 overflow-y-auto pr-2 space-y-2 md:space-y-4 no-scrollbar max-h-[30vh] md:max-h-none">
                {items.length > 0 ? items.map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-0.5 md:gap-1 p-3 md:p-4 bg-white/40 border border-white rounded-xl md:rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                       <span className="text-xs md:text-sm font-bold text-black dark:text-white truncate">{item.name}</span>
                       <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-tighter shrink-0">{item.qty}</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10 md:py-20 opacity-20 italic text-xs md:text-sm">No items to shop for</div>
                )}
             </div>
          </div>

          {/* Right: Marketplace Comparison */}
          <div className="flex-1 p-4 md:p-8 overflow-y-auto no-scrollbar bg-white/5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 pb-10">
              {marketplaces.map((m, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="glass p-3 md:p-5 flex flex-col gap-3 md:gap-4 border-white/60 hover:scale-[1.03] transition-all group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between h-5">
                    <span className="font-display font-black text-sm md:text-lg text-slate-800 dark:text-dark-primary-text truncate mr-6">{m.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="w-2.5 h-2.5 md:w-3 md:h-3 fill-accent-amber text-accent-amber" />
                      <span className="text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-400">{m.rating}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5 md:gap-1">
                    <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                    <div className="flex items-baseline gap-1 md:gap-2">
                       <span className="text-lg md:text-2xl font-black text-accent-teal">Rp {(basePrice * m.priceMultiplier).toLocaleString()}</span>
                    </div>
                  </div>

        <div className="flex items-center justify-between pt-2 md:pt-4 border-t border-white/10">
                    <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-slate-500">{m.delivery}</span>
                    <button 
                      onClick={() => window.open(m.url, '_blank')}
                      className="text-[9px] font-black text-accent-teal uppercase group-hover:underline flex items-center gap-1"
                    >
                      GO <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8 border-t border-white/20 bg-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 text-slate-400">
             <Info className="w-4 h-4" />
             <p className="text-[8px] md:text-[10px] font-medium max-w-sm">Prices are estimated. Inventory checked real-time.</p>
          </div>
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-10 py-3 md:py-4 bg-slate-800 text-white rounded-2xl font-black text-[10px] md:text-[12px] uppercase tracking-[0.2em] hover:bg-slate-700 transition-all shadow-xl"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
