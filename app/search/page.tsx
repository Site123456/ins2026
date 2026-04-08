'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Heart, Star, Flame, Leaf, X, Send,
  ThumbsUp, ThumbsDown, MessageCircle, ChevronDown,
  SlidersHorizontal, TrendingUp, ArrowUpDown,
  Clock, ChevronRight, Loader2, LogIn
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/components/hooks/useTheme';
import { MENU_DATA, Category, MenuItem } from '@/data/menu';

type SortOption = 'popular' | 'price_asc' | 'price_desc' | 'best_rated' | 'most_reviewed';
type DishStats = Record<number, { avgRating: number; totalReviews: number; totalVoteScore: number }>;

interface Review {
  _id: string;
  dishId: number;
  userName: string;
  blindEmail: string;
  rating: number;
  comment: string;
  language: string;
  upvotes: number;
  downvotes: number;
  score: number;
  votedBy: { odine: string; vote: 'up' | 'down' }[];
  replies: {
    _id: string;
    userName: string;
    comment: string;
    createdAt: string;
  }[];
  createdAt: string;
}

// Generate a guest fingerprint for anonymous voting
function getGuestOdine(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem('ins_guest_odine');
  if (!id) {
    id = 'g_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('ins_guest_odine', id);
  }
  return id;
}

export default function SearchPage() {
  const { user, toggleFavorite, getFavorites, openAuthModal } = useAuth();
  const { language } = useLanguage();
  const { isDark } = useTheme();
  const isFr = language === 'fr';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [showFavorites, setShowFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Review system state
  const [dishStats, setDishStats] = useState<DishStats>({});
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Write review state
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Expanded replies
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const guestOdine = typeof window !== 'undefined' ? getGuestOdine() : 'ssr';

  const categories: (Category | 'All')[] = ['All', ...Array.from(new Set(MENU_DATA.map(m => m.category)))];

  const sortOptions: { value: SortOption; label: { fr: string; en: string }; icon: any }[] = [
    { value: 'popular', label: { fr: 'Popularité', en: 'Popularity' }, icon: TrendingUp },
    { value: 'best_rated', label: { fr: 'Mieux notés', en: 'Best Rated' }, icon: Star },
    { value: 'most_reviewed', label: { fr: 'Plus d\'avis', en: 'Most Reviewed' }, icon: MessageCircle },
    { value: 'price_asc', label: { fr: 'Prix ↑', en: 'Price ↑' }, icon: ArrowUpDown },
    { value: 'price_desc', label: { fr: 'Prix ↓', en: 'Price ↓' }, icon: ArrowUpDown },
  ];

  // Fetch dish stats on mount
  useEffect(() => {
    fetch('/api/reviews/stats')
      .then(r => r.json())
      .then(d => { if (d.stats) setDishStats(d.stats); })
      .catch(() => { });
  }, []);

  // Filtered + sorted items
  const filteredItems = useMemo(() => {
    let items = MENU_DATA.filter((item) => {
      if (showFavorites && !getFavorites()?.includes(item.id)) return false;
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.fr.toLowerCase().includes(q) || item.name.en.toLowerCase().includes(q);
        const matchDesc = item.description.fr.toLowerCase().includes(q) || item.description.en.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }
      return true;
    });

    // Sort with vote-influenced ranking
    items.sort((a, b) => {
      const sa = dishStats[a.id] || { avgRating: 0, totalReviews: 0, totalVoteScore: 0 };
      const sb = dishStats[b.id] || { avgRating: 0, totalReviews: 0, totalVoteScore: 0 };

      switch (sortBy) {
        case 'popular': {
          const scoreA = (a.popularity || 0) + (sa.totalVoteScore * 3) + (sa.avgRating * 5);
          const scoreB = (b.popularity || 0) + (sb.totalVoteScore * 3) + (sb.avgRating * 5);
          return scoreB - scoreA;
        }
        case 'best_rated':
          return (sb.avgRating || 0) - (sa.avgRating || 0);
        case 'most_reviewed':
          return (sb.totalReviews || 0) - (sa.totalReviews || 0);
        case 'price_asc':
          return a.prices[0] - b.prices[0];
        case 'price_desc':
          return b.prices[0] - a.prices[0];
        default:
          return 0;
      }
    });

    return items;
  }, [searchQuery, selectedCategory, showFavorites, sortBy, dishStats, language, user]);

  // Load reviews for selected dish
  const loadReviews = useCallback(async (dishId: number) => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/reviews?dishId=${dishId}`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch { setReviews([]); }
    finally { setReviewsLoading(false); }
  }, []);

  const openDish = (item: MenuItem) => {
    setSelectedDish(item);
    setNewRating(0);
    setNewComment('');
    setReviewError('');
    setReplyingTo(null);
    setExpandedReplies(new Set());
    loadReviews(item.id);
  };

  // Submit review
  const submitReview = async () => {
    if (!user) { openAuthModal('signin'); return; }
    if (newRating === 0 || newComment.trim().length < 3) {
      setReviewError(isFr ? 'Veuillez sélectionner une note et écrire un commentaire (min 3 caractères)' : 'Please select a rating and write a comment (min 3 characters)');
      return;
    }
    setSubmittingReview(true);
    setReviewError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, dishId: selectedDish!.id, rating: newRating, comment: newComment.trim(), language }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewRating(0);
        setNewComment('');
        loadReviews(selectedDish!.id);
        // Refresh stats
        fetch('/api/reviews/stats').then(r => r.json()).then(d => { if (d.stats) setDishStats(d.stats); });
      } else {
        setReviewError(data.error || 'Error');
      }
    } catch { setReviewError('Network error'); }
    finally { setSubmittingReview(false); }
  };

  // Vote on review
  const voteReview = async (reviewId: string, vote: 'up' | 'down') => {
    const odine = user ? `u_${user.email}` : guestOdine;
    try {
      const res = await fetch('/api/reviews/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, odine, vote }),
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(prev => prev.map(r =>
          r._id === reviewId ? { ...r, upvotes: data.upvotes, downvotes: data.downvotes, score: data.score } : r
        ));
      }
    } catch { }
  };

  // Submit reply
  const submitReply = async (reviewId: string) => {
    if (!user) { openAuthModal('signin'); return; }
    if (replyText.trim().length < 1) return;
    setSubmittingReply(true);
    try {
      const res = await fetch('/api/reviews/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, email: user.email, comment: replyText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(prev => prev.map(r =>
          r._id === reviewId ? { ...r, replies: data.replies } : r
        ));
        setReplyText('');
        setReplyingTo(null);
        setExpandedReplies(prev => new Set(prev).add(reviewId));
      }
    } catch { }
    finally { setSubmittingReply(false); }
  };

  const getUserVote = (review: Review): 'up' | 'down' | null => {
    const odine = user ? `u_${user.email}` : guestOdine;
    const found = review.votedBy?.find(v => v.odine === odine);
    return found?.vote || null;
  };

  const stats = selectedDish ? (dishStats[selectedDish.id] || { avgRating: 0, totalReviews: 0, totalVoteScore: 0 }) : null;

  return (
    <div className={`min-h-screen pt-28 px-2 md:px-8 lg:px-16 pb-20 transition-colors duration-500 ${isDark ? 'bg-[#010104] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="relative text-center mb-4 md:mb-16 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 w-64 h-64 bg-rose-500/10 blur-[100px] rounded-full -z-10"
          />
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}
          >
            {isFr ? 'L\'Art de la Cuisine' : 'The Art of Cuisine'}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">.</span>
          </motion.h1>
        </div>
        <div className="relative mb-6 z-10 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-2 items-stretch">
            {/* Search */}
            <div className={`relative flex-1 rounded-2xl border transition-all duration-500 focus-within:ring-4 focus-within:ring-rose-500/10 ${isDark
              ? 'bg-white/[0.03] border-white/10 focus-within:border-rose-500/50 focus-within:bg-white/[0.06]'
              : 'bg-white border-slate-200 focus-within:border-rose-500/50 shadow-sm'
              }`}>
              <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder={isFr ? 'Rechercher un plat...' : 'Search for a dish...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full py-3.5 pl-12 pr-6 bg-transparent outline-none text-sm font-medium placeholder:text-zinc-500 ${isDark ? 'text-white' : 'text-slate-900'}`}
              />
            </div>

            <div className="flex gap-2 shrink-0">
              {/* Favorites */}
              <button onClick={() => setShowFavorites(!showFavorites)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap text-sm
                  ${showFavorites
                    ? 'bg-rose-500 text-white shadow-lg'
                    : isDark
                      ? 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <Heart className={`w-4 h-4 ${showFavorites ? 'fill-current' : ''}`} />
                <span className="inline">{isFr ? 'Favoris' : 'Favorites'}</span>
              </button>

              {/* Sort Dropdown */}
              <div className="relative flex-1 md:flex-none group/sort">
                <button onClick={() => setShowSortMenu(!showSortMenu)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold transition-all duration-300 whitespace-nowrap text-sm ${isDark
                    ? 'bg-white/[0.03] border border-white/10 text-zinc-300 hover:bg-white/[0.08] hover:border-white/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                  <SlidersHorizontal className="w-4 h-4 group-hover/sort:rotate-12 transition-transform" />
                  <span className="hidden sm:inline">{sortOptions.find(s => s.value === sortBy)?.label[language] || 'Sort'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showSortMenu ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showSortMenu && (
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      className={`absolute right-0 top-full mt-2 w-48 rounded-xl border backdrop-blur-xl shadow-2xl z-50 overflow-hidden ${isDark ? 'bg-zinc-900/95 border-white/10' : 'bg-white border-slate-200'
                        }`}>
                      {sortOptions.map(opt => {
                        const Icon = opt.icon;
                        return (
                          <button key={opt.value} onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                            className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left transition-all
                              ${sortBy === opt.value
                                ? 'bg-rose-500/20 text-rose-400 font-bold'
                                : isDark ? 'text-zinc-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50'}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {opt.label[language]}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="relative mt-4">
            <div className="overflow-x-auto pb-3 premium-scrollbar scroll-fade-edges">
              <div className="flex gap-1.5 px-4 w-max mx-auto">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${selectedCategory === cat
                      ? isDark
                        ? 'bg-white text-zinc-900 shadow-md scale-105'
                        : 'bg-slate-900 text-white shadow-md scale-105'
                      : isDark
                        ? 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                        : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900'
                      }`}>
                    {cat === 'All' ? (isFr ? 'Tout' : 'All') : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredItems.map((item) => {
              const isFavorite = getFavorites()?.includes(item.id);
              const st = dishStats[item.id];

              return (
                <motion.div layout key={item.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                  onClick={() => openDish(item)}
                  className={`group relative rounded-[2.5rem] overflow-hidden cursor-pointer border transition-all duration-500 shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] ${isDark
                    ? 'bg-zinc-900/40 border-white/5 hover:border-white/15 hover:bg-zinc-900/60'
                    : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}>

                  {/* Image Container */}
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name[language]}
                      className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                    {/* Quick Labels (Top) */}
                    <div className="absolute top-5 left-5 right-5 flex justify-between items-center">
                      <div className="flex gap-2">
                        {item.isVeg && (
                          <div className="bg-emerald-500/90 backdrop-blur-md text-white p-2.5 rounded-full shadow-lg border border-emerald-400/20">
                            <Leaf className="w-4 h-4" />
                          </div>
                        )}
                        {item.popularity && item.popularity > 95 && (
                          <div className="bg-orange-500/90 backdrop-blur-md text-white p-2.5 rounded-full shadow-lg border border-orange-400/20">
                            <Flame className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                        className={`p-3 rounded-full backdrop-blur-md transition-all duration-500
                          ${isFavorite
                            ? 'bg-rose-500 text-white shadow-[0_8px_16px_rgba(244,63,94,0.4)] scale-110'
                            : 'bg-black/20 hover:bg-white/20 text-white hover:scale-110'}`}>
                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Price Tag (Bottom) */}
                    <div className="absolute bottom-5 left-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white drop-shadow-lg">
                          {item.prices[0] !== 0 ? item.prices[0].toFixed(2) + ' €' : ''}
                        </span>
                        {item.originalPrice && (
                          <span className="text-sm font-bold text-white/50 line-through">
                            {item.originalPrice.toFixed(2)}€
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-7">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-500 px-3 py-1 rounded-full bg-rose-500/10">
                        {item.category}
                      </span>
                    </div>

                    <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 leading-tight ${isDark ? 'text-white group-hover:text-rose-400' : 'text-slate-900 group-hover:text-rose-600'}`}>
                      {item.name[language]}
                    </h3>

                    <p className={`text-sm line-clamp-2 mb-6 leading-relaxed font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      {item.description[language]}
                    </p>

                    {/* Footer Row */}
                    <div className="flex items-center justify-between pt-4 border-t border-dashed border-zinc-500/20">
                      <div className="flex items-center gap-4">
                        {st && st.totalReviews > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-amber-400/10 text-amber-500 px-2 py-1 rounded-lg">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span className="text-xs font-black">{st.avgRating}</span>
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                              {st.totalReviews} {isFr ? 'Avis' : 'Reviews'}
                            </span>
                          </div>
                        ) : (
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                            {isFr ? 'Nouveau' : 'New'}
                          </span>
                        )}
                      </div>

                      <div className={`p-2 rounded-xl transition-all duration-500 group-hover:bg-rose-500 group-hover:text-white ${isDark ? 'bg-white/5 text-zinc-500' : 'bg-slate-100 text-slate-400'
                        }`}>
                        <ChevronRight className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Empty state */}
          {filteredItems.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-24 text-center">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-xl ${isDark ? 'bg-white/5 text-zinc-500' : 'bg-white text-slate-300 border border-slate-100'
                }`}>
                <Search className="w-10 h-10" />
              </div>
              <h3 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isFr ? 'Aucun plat trouvé' : 'No dishes found'}
              </h3>
              <p className={isDark ? 'text-zinc-400' : 'text-slate-500'}>
                {isFr ? 'Essayez de modifier votre recherche.' : 'Try adjusting your search.'}
              </p>
              <button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setShowFavorites(false); }}
                className={`mt-8 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg hover:scale-105 active:scale-95 ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}>
                {isFr ? 'Effacer les filtres' : 'Clear Filters'}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedDish && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setSelectedDish(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={`
                fixed z-50 overflow-hidden flex flex-col shadow-2xl border
                inset-x-0 bottom-0 max-h-[92vh] rounded-t-[2.5rem]
                md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                md:max-w-xl md:w-full md:rounded-3xl md:max-h-[85vh]
                ${isDark ? "bg-zinc-950 border-white/10" : "bg-white border-slate-200"}
              `}
            >

              <div className="overflow-y-auto flex-1 p-0 pb-8" style={{ scrollbarWidth: 'thin' }}>
                {/* Hero */}
                <div className="relative h-64 sm:h-80 overflow-hidden">
                  <img src={selectedDish.image} alt={selectedDish.name[language]} className="w-full h-full object-cover" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-zinc-950 via-zinc-950/40' : 'from-white via-white/20'} to-transparent`} />
                  <button onClick={() => setSelectedDish(null)}
                    className="absolute top-4 right-4 p-2.5 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all">
                    <X className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="relative text-start">
                      <div
                        className={`
                          text-xs font-black uppercase tracking-[0.3em] rounded-2xl px-3 py-2 mb-2 drop-shadow-md whitespace-nowrap
                          ${isDark 
                            ? "text-rose-200 bg-rose-600/80 border border-rose-400/20" 
                            : "text-rose-600 bg-rose-100 border border-rose-300/40"
                          }
                        `}
                      >
                        {selectedDish.category}
                      </div>
                    </div>

                    <h2 className={`text-4xl sm:text-5xl font-black mb-4 leading-tight drop-shadow-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedDish.name[language]}</h2>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className={`px-6 py-2.5 rounded-2xl font-black text-xl shadow-2xl ${isDark ? 'bg-white text-zinc-900' : 'bg-slate-900 text-white'} ${selectedDish.prices[0] === 0 ? 'hidden' : ''}`}>
                        {selectedDish.prices[0].toFixed(2)}€
                      </span>
                      {stats && stats.totalReviews > 0 && (
                        <div className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-2xl backdrop-blur-xl border ${isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-white/80 border-slate-200 text-slate-900'}`}>
                          <Star className="w-4 h-4 text-amber-400 fill-current" />
                          <span className="font-black">{stats.avgRating}</span>
                          <span className={`${isDark ? 'text-zinc-500' : 'text-slate-400'} font-bold`}>• {stats.totalReviews} {isFr ? 'avis' : 'reviews'}</span>
                        </div>
                      )}
                      {selectedDish.isVeg && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 backdrop-blur-md">
                          <Leaf className="w-4 h-4" /> {isFr ? 'VÉGÉTARIEN' : 'VEGETARIAN'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-2 md:px-8 pt-8 max-w-4xl mx-auto w-full">
                  <p className={`text-lg leading-relaxed mb-12 font-medium ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>{selectedDish.description[language]}</p>

                  {/* ===== REVIEWS SECTION ===== */}
                  <div className={`border-t pt-10 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    <div className="flex items-center justify-between mb-8">
                      <h3 className={`text-2xl font-black flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <MessageCircle className="w-7 h-7 text-rose-500" />
                        {isFr ? 'Avis de la Communauté' : 'Community Reviews'}
                      </h3>
                      {stats && stats.totalReviews > 0 && (
                        <span className={`text-xs flex px-4 py-1.5 rounded-full text-nowrap font-black ${isDark ? 'bg-white/5 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
                          {stats.totalReviews} {isFr ? 'TOTAL' : 'TOTAL'}
                        </span>
                      )}
                    </div>

                    {/* Write review card */}
                    <div className={`rounded-[2.5rem] p-8 mb-12 border transition-all ${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-rose-500/10 text-rose-500' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'}`}>
                          <Star className="w-6 h-6" />
                        </div>
                        <div>
                          <p className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {isFr ? 'Partagez votre avis' : 'Share your thought'}
                          </p>
                          <p className={`text-xs font-bold ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                            {isFr ? 'Aidez la communauté à choisir' : 'Help the community decide'}
                          </p>
                        </div>
                      </div>

                      {!user ? (
                        <button onClick={() => openAuthModal('signin')}
                          className="w-full flex items-center justify-center gap-4 py-5 rounded-2xl bg-white/5 border border-white/10 text-zinc-300 font-black text-sm hover:bg-white/10 transition-all group">
                          <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          {isFr ? 'Connectez-vous pour commenter' : 'Sign in to comment'}
                        </button>
                      ) : (
                        <div className="space-y-6">
                          {/* Star input */}
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map(s => (
                              <button key={s}
                                onMouseEnter={() => setHoverRating(s)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setNewRating(s)}
                                className="transition-all duration-300 transform active:scale-95 group/star">
                                <Star className={`w-10 h-10 transition-all ${s <= (hoverRating || newRating) ? 'text-amber-400 fill-current drop-shadow-[0_0_10px_rgba(251,191,36,0.4)] scale-110' : 'text-zinc-700 hover:text-zinc-500'}`} />
                              </button>
                            ))}
                            {newRating > 0 && (
                              <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                className="text-sm font-black text-amber-500 ml-4 bg-amber-500/10 px-3 py-1 rounded-full">
                                {newRating}/5
                              </motion.span>
                            )}
                          </div>

                          <div className="relative">
                            <textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder={isFr ? 'Racontez votre expérience culinaire...' : 'Tell us about your culinary experience...'}
                              className={`w-full border rounded-[2rem] px-6 py-5 text-base outline-none transition-all resize-none h-40 ${isDark
                                ? 'bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-rose-500/30 focus:bg-white/8'
                                : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-rose-500/30 shadow-sm'
                                }`}
                              maxLength={1000}
                            />
                            <div className="absolute bottom-4 right-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                              {newComment.length}/1000
                            </div>
                          </div>

                          {reviewError && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-bold text-rose-500 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              {reviewError}
                            </motion.p>
                          )}

                          <div className="flex justify-end">
                            <button onClick={submitReview} disabled={submittingReview}
                              className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-rose-500 text-white font-black text-sm hover:bg-rose-600 transition-all disabled:opacity-50 shadow-2xl shadow-rose-500/30 hover:scale-105 active:scale-95 group">
                              {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                              {isFr ? 'PUBLIER MON AVIS' : 'POST MY REVIEW'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Reviews list */}
                    {reviewsLoading ? (
                      <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">{isFr ? 'CHARGEMENT DES AVIS...' : 'LOADING REVIEWS...'}</p>
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="text-center py-20 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10">
                        <MessageCircle className="w-12 h-12 text-zinc-800 mx-auto mb-4 opacity-50" />
                        <p className="text-zinc-500 font-bold">{isFr ? 'Aucun avis pour le moment. Soyez le premier !' : 'No reviews yet. Be the first to share!'}</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {reviews.map((review) => {
                          const myVote = getUserVote(review);
                          const isExpanded = expandedReplies.has(review._id);

                          return (
                            <motion.div key={review._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                              className={`rounded-[2.2rem] p-7 border transition-all duration-300 ${isDark ? 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                                }`}>

                              {/* Review header */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                  <div className="relative group/avatar">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/10 flex items-center justify-center text-rose-500 text-lg font-black transition-transform duration-500 group-hover/avatar:rotate-12">
                                      {review.userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-rose-500 rounded-lg border-2 border-[#010104] flex items-center justify-center">
                                      <Star className="w-2.5 h-2.5 text-white fill-current" />
                                    </div>
                                  </div>
                                  <div>
                                    <p className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{review.userName}</p>
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-400/5 w-fit">
                                      {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-amber-400 fill-current' : 'text-zinc-800'}`} />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                                  <Clock className="w-3.5 h-3.5" />
                                  {new Date(review.createdAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                              </div>

                              {/* Review content */}
                              <div className="relative mb-6">
                                <p className={`text-base leading-relaxed font-medium italic ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                                  {review.comment}
                                </p>
                              </div>

                              {/* Interaction Footer */}
                              <div className="flex items-center gap-3">
                                <div className={`flex items-center p-1 rounded-2xl ${isDark ? 'bg-black/40 border border-white/5' : 'bg-slate-100 border border-slate-200'}`}>
                                  <button onClick={() => voteReview(review._id, 'up')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-bold text-xs ${myVote === 'up'
                                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105'
                                      : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                                      }`}>
                                    <ThumbsUp className={`w-4 h-4 ${myVote === 'up' ? 'fill-current' : ''}`} />
                                    <span>{review.upvotes}</span>
                                  </button>

                                  <div className={`w-px h-4 mx-1 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />

                                  <button onClick={() => voteReview(review._id, 'down')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-bold text-xs ${myVote === 'down'
                                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 scale-105'
                                      : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                                      }`}>
                                    <ThumbsDown className={`w-4 h-4 ${myVote === 'down' ? 'fill-current' : ''}`} />
                                    <span>{review.downvotes}</span>
                                  </button>
                                </div>

                                <button onClick={() => {
                                  if (!user) { openAuthModal('signin'); return; }
                                  setReplyingTo(replyingTo === review._id ? null : review._id);
                                }}
                                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl transition-all duration-300 ml-auto font-black text-xs uppercase tracking-widest ${replyingTo === review._id
                                    ? 'bg-rose-500 text-white shadow-lg'
                                    : isDark ? 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}>
                                  <MessageCircle className="w-4 h-4" />
                                  <span>{isFr ? 'Répondre' : 'Reply'}</span>
                                </button>
                              </div>

                              {/* Nested Replies */}
                              {review.replies.length > 0 && (
                                <div className="mt-6 pt-5 border-t border-white/5">
                                  <button onClick={() => setExpandedReplies(prev => {
                                    const n = new Set(prev);
                                    n.has(review._id) ? n.delete(review._id) : n.add(review._id);
                                    return n;
                                  })}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/5 text-rose-400 text-[10px] font-black uppercase tracking-[0.15em] hover:bg-rose-500/10 transition-all">
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                                    {isExpanded ? (isFr ? 'Fermer' : 'Close') : (isFr ? `${review.replies.length} Réponse(s)` : `${review.replies.length} Reply/ies`)}
                                  </button>

                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                        className="mt-6 pl-6 space-y-5 border-l-2 border-rose-500/20 overflow-hidden">
                                        {review.replies.map((reply: any, idx: number) => (
                                          <div
                                            key={reply._id || idx}
                                            className="relative group/reply"
                                          >
                                            {/* Header */}
                                            <div className="flex items-center gap-3 mb-2">
                                              {/* Avatar */}
                                              <div
                                                className={`
                                                  w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black
                                                  border
                                                  ${isDark ? "bg-white/5 border-white/10 text-zinc-400" : "bg-black/5 border-black/10 text-zinc-600"}
                                                `}
                                              >
                                                {reply.userName.charAt(0).toUpperCase()}
                                              </div>

                                              {/* Username */}
                                              <span
                                                className={`
                                                  text-xs font-black
                                                  ${isDark ? "text-white" : "text-zinc-900"}
                                                `}
                                              >
                                                {reply.userName}
                                              </span>

                                              {/* Date */}
                                              <span
                                                className={`
                                                  text-[9px] font-bold uppercase tracking-widest
                                                  ${isDark ? "text-zinc-600" : "text-zinc-500"}
                                                `}
                                              >
                                                {new Date(reply.createdAt).toLocaleDateString(
                                                  language === "fr" ? "fr-FR" : "en-US",
                                                  { day: "numeric", month: "short" }
                                                )}
                                              </span>
                                            </div>

                                            {/* Comment */}
                                            <p
                                              className={`
                                                text-sm font-medium leading-relaxed px-1
                                                ${isDark ? "text-zinc-400" : "text-zinc-700"}
                                              `}
                                            >
                                              {reply.comment}
                                            </p>
                                          </div>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}

                              {/* Reply input */}
                              <AnimatePresence>
                                {replyingTo === review._id && user && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                    className="mt-3 overflow-hidden">
                                    <div className="flex gap-2">
                                      <input
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder={isFr ? 'Votre réponse...' : 'Your reply...'}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-white/20"
                                        maxLength={500}
                                        onKeyDown={(e) => { if (e.key === 'Enter') submitReply(review._id); }}
                                      />
                                      <button onClick={() => submitReply(review._id)} disabled={submittingReply}
                                        className="px-3 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-all disabled:opacity-50">
                                        {submittingReply ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
