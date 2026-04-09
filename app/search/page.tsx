'use client';

import { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  Search, Heart, Star, Flame, Leaf, X, Send,
  ThumbsUp, ThumbsDown, MessageCircle, SlidersHorizontal,
  TrendingUp, ArrowUpDown, Clock, ChevronRight, Loader2, LogIn,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/components/hooks/useTheme';
import { useAccentFromCookies } from '@/components/hooks/useAccentFromCookies';
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
  const accent = useAccentFromCookies();
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
  const touchStartY = useRef(0);
  const touchDeltaY = useRef(0);
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
  }, [searchQuery, selectedCategory, showFavorites, sortBy, dishStats, language, user, getFavorites]);

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
        <div className="relative text-center mb-8 md:mb-20 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 w-64 h-64 blur-[120px] rounded-full -z-10"
            style={{ backgroundColor: `${accent}20` }}
          />
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-4xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}
          >
            {isFr ? 'L\'Art de la Cuisine' : 'The Art of Cuisine'}
            <span style={{ color: accent }} className="ml-1">.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`text-sm md:text-base font-medium max-w-2xl mx-auto ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}
          >
            {isFr ? 'Découvrez une sélection raffinée de plats traditionnels et modernes' : 'Discover a refined selection of traditional and modern dishes'}
          </motion.p>
        </div>

        <div className="relative mb-12 z-10 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-3 items-stretch">
            {/* Search */}
            <div
              className={`relative flex-1 rounded-[2rem] border transition-all duration-500 focus-within:ring-8 ${isDark
                ? 'bg-white/[0.03] border-white/10 focus-within:bg-white/[0.06]'
                : 'bg-white border-slate-200 shadow-sm'
                }`}
              style={{
                borderColor: showSortMenu ? accent : undefined,
                boxShadow: `0 0 0 1px ${accent}20 inset`
              }}
            >
              <Search className={`absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder={isFr ? 'Rechercher un plat...' : 'Search for a dish...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full py-5 pl-14 pr-8 bg-transparent outline-none text-base font-semibold placeholder:text-zinc-500 ${isDark ? 'text-white' : 'text-slate-900'}`}
              />
            </div>

            <div className="flex gap-2 shrink-0">
              {/* Favorites */}
              <button onClick={() => setShowFavorites(!showFavorites)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-black transition-all duration-300 whitespace-nowrap text-sm
                  ${showFavorites
                    ? 'text-white shadow-xl scale-105'
                    : isDark
                      ? 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                style={{ backgroundColor: showFavorites ? accent : undefined }}
              >
                <Heart className={`w-4 h-4 ${showFavorites ? 'fill-current' : ''}`} />
                <span>{isFr ? 'Favoris' : 'Favorites'}</span>
              </button>

              {/* Sort Dropdown */}
              <div className="relative flex-1 md:flex-none group/sort">
                <button onClick={() => setShowSortMenu(!showSortMenu)}
                  className={`w-full h-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-black transition-all duration-300 whitespace-nowrap text-sm ${isDark
                    ? 'bg-white/[0.03] border border-white/10 text-zinc-300 hover:bg-white/[0.08] hover:border-white/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  style={{ borderColor: showSortMenu ? accent : undefined }}
                >
                  <SlidersHorizontal className="w-4 h-4 group-hover/sort:rotate-90 transition-transform" />
                  <span className="hidden sm:inline">{sortOptions.find(s => s.value === sortBy)?.label[language] || 'Sort'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-500 ${showSortMenu ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showSortMenu && (
                    <motion.div
                      key="sort-menu"
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className={`absolute right-0 top-full mt-3 w-56 rounded-2xl border backdrop-blur-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] z-50 overflow-hidden p-1.5 ${isDark ? 'bg-zinc-950/90 border-white/10' : 'bg-white border-slate-200'
                        }`}
                    >
                      {sortOptions.map(opt => {
                        const Icon = opt.icon;
                        const active = sortBy === opt.value;
                        return (
                          <button key={opt.value} onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-left transition-all
                              ${active
                                ? 'text-white'
                                : isDark ? 'text-zinc-400 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                            style={{ backgroundColor: active ? accent : undefined }}
                          >
                            <Icon className="w-4 h-4" />
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

          <div className="relative mt-8">
            <div className="overflow-x-auto pb-4 premium-scrollbar scroll-fade-edges">
              <div className="flex gap-2 px-4 w-max mx-auto">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)}
                    className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${selectedCategory === cat
                      ? 'text-white shadow-[0_10px_20px_-5px_rgba(0,0,0,0.3)] scale-105'
                      : isDark
                        ? 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-white'
                        : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900'
                      }`}
                    style={{ backgroundColor: selectedCategory === cat ? accent : undefined }}
                  >
                    {cat === 'All' ? (isFr ? 'Tout' : 'All') : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => {
              const isFavorite = getFavorites()?.includes(item.id);
              const st = dishStats[item.id];

              return (
                <motion.div layout key={item.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => openDish(item)}
                  className={`group relative rounded-[2.5rem] overflow-hidden cursor-pointer border transition-all duration-500 hover:translate-y-[-8px] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] ${isDark
                    ? 'bg-zinc-900/40 border-white/5 hover:border-white/20'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                >
                  {/* Subtle Background Accent Glow */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-0 group-hover:opacity-20 transition-opacity duration-1000 blur-[80px] -z-10" style={{ backgroundColor: accent }} />

                  {/* Image Container */}
                  <div className="relative h-72 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name[language]}
                      className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-40 ${isDark ? 'from-black' : 'from-slate-900'}`} />

                    {/* Badge Overlays */}
                    <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                      <div className="flex flex-col gap-2">
                        {item.isVeg && (
                          <div className="bg-emerald-500/20 backdrop-blur-2xl text-emerald-400 p-2.5 rounded-full shadow-2xl border border-emerald-500/20">
                            <Leaf className="w-4.5 h-4.5" />
                          </div>
                        )}
                        {item.popularity && item.popularity > 95 && (
                          <div className="bg-orange-500/20 backdrop-blur-2xl text-orange-400 p-2.5 rounded-full shadow-2xl border border-orange-500/20">
                            <Flame className="w-4.5 h-4.5" />
                          </div>
                        )}
                      </div>

                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                        className={`p-3.5 rounded-2xl backdrop-blur-3xl transition-all duration-500 shadow-2xl
                          ${isFavorite
                            ? 'text-white border-transparent'
                            : 'bg-black/20 hover:bg-white/20 text-white border border-white/10'}`}
                        style={{
                          backgroundColor: isFavorite ? accent : undefined,
                          boxShadow: isFavorite ? `0 10px 30px ${accent}40` : undefined
                        }}
                      >
                        <Heart className={`w-5.5 h-5.5 ${isFavorite ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Quick Info & Price Overlay */}
                    <div className="absolute bottom-6 left-8 right-8 flex items-end justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
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
                  </div>

                  {/* Card Content */}
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className="text-[10px] font-black uppercase tracking-[0.25em] px-4 py-1.5 rounded-xl backdrop-blur-md transition-colors"
                        style={{
                          backgroundColor: `${accent}15`,
                          color: accent
                        }}
                      >
                        {item.category}
                      </span>
                      {st && st.totalReviews > 0 && (
                        <div className="flex items-center gap-1.5 bg-amber-400/10 text-amber-500 px-3 py-1.5 rounded-xl">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="text-xs font-black">{st.avgRating}</span>
                        </div>
                      )}
                    </div>

                    <h3 className={`text-2xl font-black mb-3 leading-tight transition-colors duration-300 ${isDark ? 'text-white group-hover:text-white' : 'text-slate-900 group-hover:text-slate-900'}`}>
                      {item.name[language]}
                    </h3>

                    <p className={`text-sm line-clamp-2 mb-8 leading-relaxed font-medium ${isDark ? 'text-zinc-500 group-hover:text-zinc-400' : 'text-slate-500'}`}>
                      {item.description[language]}
                    </p>

                    <div className="flex items-center justify-between pt-6 border-t border-dashed border-zinc-500/20">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                        {st && st.totalReviews > 0
                          ? `${st.totalReviews} ${isFr ? 'Avis' : 'Reviews'}`
                          : (isFr ? 'Nouveau' : 'New')
                        }
                      </span>

                      <div
                        className={`p-3 rounded-2xl transition-all duration-500 group-hover:rotate-[-5deg] group-hover:scale-110 shadow-lg ${isDark ? 'bg-white/5 text-zinc-500' : 'bg-slate-100 text-slate-400'}`}
                        style={{
                          backgroundColor: 'var(--hover-bg)',
                          color: 'var(--hover-text)'
                        }}
                        id="chevron-btn"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = accent;
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '';
                          e.currentTarget.style.color = '';
                        }}
                      >
                        <ChevronRight className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Empty state */}
          {filteredItems.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-32 text-center">
              <div className={`inline-flex items-center justify-center w-28 h-28 rounded-[2.5rem] mb-8 shadow-2xl ${isDark ? 'bg-white/5 text-zinc-700' : 'bg-white text-slate-200 border border-slate-100'
                }`}>
                <Search className="w-12 h-12" />
              </div>
              <h3 className={`text-3xl font-black mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isFr ? 'Aucun plat trouvé' : 'No dishes found'}
              </h3>
              <p className={`text-base font-medium mb-10 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                {isFr ? 'Désolé, nous n\'avons pas trouvé de plats correspondant à vos critères.' : 'Sorry, we couldn\'t find any dishes matching your criteria.'}
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setShowFavorites(false); }}
                className="px-12 py-5 rounded-[2rem] font-black transition-all shadow-2xl hover:scale-105 active:scale-95 text-white"
                style={{ backgroundColor: accent }}
              >
                {isFr ? 'Réinitialiser les filtres' : 'Reset All Filters'}
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
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
              onClick={() => setSelectedDish(null)}
            />

            {/* Modal */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 32, stiffness: 300 }}
              className={`
                fixed z-[60] overflow-hidden flex flex-col shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] border
                inset-x-0 bottom-0 max-h-[94vh] rounded-t-[3rem]
                md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                md:max-w-2xl md:w-full md:rounded-[3rem] md:max-h-[85vh]
                ${isDark ? "bg-[#050508] border-white/10" : "bg-white border-slate-200"}
              `}
            >
              {/* FIXED CLOSE BUTTON */}
              <button
                onClick={() => setSelectedDish(null)}
                className={`
                  absolute top-6 right-6 z-50 p-3 rounded-2xl backdrop-blur-3xl transition-all hover:scale-110 active:scale-90
                  ${isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/5 text-black hover:bg-black/10"}
                `}
              >
                <X className="w-6 h-6" />
              </button>

              <div
                className="overflow-y-auto flex-1 p-0 pb-12 overscroll-y-contain premium-scrollbar"
                style={{ scrollbarWidth: "none" }}
              >
                {/* Hero Header */}
                <div className="relative h-[22rem] md:h-[26rem] overflow-hidden">
                  <img src={selectedDish.image} alt={selectedDish.name[language]} className="w-full h-full object-cover" />

                  <div
                    className={`
                      absolute inset-0 bg-gradient-to-t
                      ${isDark ? "from-[#050508] via-[#050508]/40" : "from-white via-white/20"}
                      to-transparent
                    `}
                  />

                  <div className="absolute bottom-10 left-10 right-10">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-4"
                    >
                      <div className="flex justify-start">
                        <span
                          className="text-[10px] font-black uppercase tracking-[0.3em] rounded-xl px-4 py-1.5 backdrop-blur-2xl border border-white/10 shadow-2xl"
                          style={{ backgroundColor: `${accent}20`, color: accent }}
                        >
                          {selectedDish.category}
                        </span>
                      </div>

                      <h2 className={`text-4xl md:text-6xl font-black leading-tight tracking-tight drop-shadow-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {selectedDish.name[language]}
                      </h2>

                      <div className="flex items-center gap-4 flex-wrap">
                        <span
                          className="px-8 py-3 rounded-2xl font-black text-2xl shadow-2xl text-white"
                          style={{ backgroundColor: accent }}
                        >
                          {selectedDish.prices[0].toFixed(2)}€
                        </span>

                        {stats && stats.totalReviews > 0 && (
                          <div className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl backdrop-blur-3xl border ${isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-white/80 border-slate-200 text-slate-900'}`}>
                            <Star className="w-5 h-5 text-amber-400 fill-current" />
                            <span className="font-black text-lg">{stats.avgRating}</span>
                            <span className={`${isDark ? 'text-zinc-500' : 'text-slate-400'} font-bold`}>• {stats.totalReviews} {isFr ? 'avis' : 'reviews'}</span>
                          </div>
                        )}

                        {selectedDish.isVeg && (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 backdrop-blur-3xl">
                            <Leaf className="w-4 h-4" /> {isFr ? 'VÉGÉTARIEN' : 'VEGETARIAN'}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>

                <div className="px-6 md:px-12 pt-10">
                  <p className={`text-xl leading-relaxed mb-16 font-medium ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    {selectedDish.description[language]}
                  </p>

                  {/* ===== REVIEWS SECTION ===== */}
                  <div className={`border-t pt-12 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    <div className="flex items-center justify-between mb-10">
                      <h3 className={`text-3xl font-black flex items-center gap-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <MessageCircle className="w-8 h-8" style={{ color: accent }} />
                        {isFr ? 'Communauté' : 'Community'}
                      </h3>
                      {stats && stats.totalReviews > 0 && (
                        <span className={`text-[10px] font-black tracking-widest px-5 py-2 rounded-full ${isDark ? 'bg-white/5 text-zinc-500' : 'bg-slate-100 text-slate-500'}`}>
                          {stats.totalReviews} {isFr ? 'AVIS' : 'REVIEWS'}
                        </span>
                      )}
                    </div>

                    {/* Write review card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-[3rem] p-10 mb-16 border transition-all ${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50 border-slate-100'}`}
                    >
                      <div className="flex items-center gap-5 mb-8">
                        <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center shadow-2xl`} style={{ backgroundColor: accent, color: 'white' }}>
                          <Star className="w-7 h-7" />
                        </div>
                        <div>
                          <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {isFr ? 'Votre Expérience' : 'Your Experience'}
                          </p>
                          <p className={`text-sm font-bold ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                            {isFr ? 'Partagez votre avis sur ce plat' : 'Share your thoughts on this dish'}
                          </p>
                        </div>
                      </div>

                      {!user ? (
                        <button onClick={() => openAuthModal('signin')}
                          className="w-full flex items-center justify-center gap-4 py-6 rounded-2xl bg-white/5 border border-white/10 text-zinc-300 font-black text-sm hover:bg-white/10 transition-all group active:scale-[0.98]">
                          <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          {isFr ? 'Connectez-vous pour participer' : 'Sign in to participate'}
                        </button>
                      ) : (
                        <div className="space-y-8">
                          {/* Star input */}
                          <div className="flex items-center gap-3">
                            {[1, 2, 3, 4, 5].map(s => (
                              <button key={s}
                                onMouseEnter={() => setHoverRating(s)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setNewRating(s)}
                                className="transition-all duration-300 transform active:scale-90"
                              >
                                <Star
                                  className={`w-12 h-12 transition-all ${s <= (hoverRating || newRating) ? 'fill-current scale-110' : 'text-zinc-800'}`}
                                  style={{ color: s <= (hoverRating || newRating) ? accent : undefined, filter: s <= (hoverRating || newRating) ? `drop-shadow(0 0 12px ${accent}60)` : 'none' }}
                                />
                              </button>
                            ))}
                            {newRating > 0 && (
                              <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                className="text-sm font-black text-amber-500 ml-4 bg-amber-500/10 px-4 py-1.5 rounded-full"
                                style={{ color: accent, backgroundColor: `${accent}15` }}
                              >
                                {newRating}/5
                              </motion.span>
                            )}
                          </div>

                          <div className="relative">
                            <textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder={isFr ? 'Laissez un commentaire...' : 'Leave a comment...'}
                              className={`w-full border rounded-[2.5rem] px-8 py-7 text-lg outline-none transition-all resize-none h-48 ${isDark
                                ? 'bg-white/5 border-white/10 text-white placeholder:text-zinc-700'
                                : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-sm'
                                }`}
                              style={{ borderColor: newComment.length > 0 ? `${accent}40` : undefined }}
                              maxLength={1000}
                            />
                            <div className="absolute bottom-6 right-8 text-[11px] font-black text-zinc-600 uppercase tracking-widest">
                              {newComment.length}/1000
                            </div>
                          </div>

                          {reviewError && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-bold text-rose-500 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              {reviewError}
                            </motion.p>
                          )}

                          <div className="flex justify-end">
                            <button onClick={submitReview} disabled={submittingReview}
                              className="flex items-center gap-4 px-12 py-5 rounded-[2rem] text-white font-black text-base transition-all disabled:opacity-50 shadow-2xl hover:scale-105 active:scale-95 group"
                              style={{ backgroundColor: accent, boxShadow: `0 20px 40px ${accent}30` }}
                            >
                              {submittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                              {isFr ? 'PUBLIER' : 'PUBLISH'}
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>

                    {/* Reviews list */}
                    {reviewsLoading ? (
                      <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <Loader2 className="w-10 h-10 animate-spin" style={{ color: accent }} />
                        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">{isFr ? 'RECHERCHE D\'AVIS...' : 'SEARCHING REVIEWS...'}</p>
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="text-center py-24 bg-white/[0.01] rounded-[4rem] border border-dashed border-white/10">
                        <MessageCircle className="w-16 h-16 text-zinc-900 mx-auto mb-6 opacity-20" />
                        <p className="text-zinc-600 font-bold text-lg">{isFr ? 'Aucun avis pour le moment' : 'No reviews yet'}</p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {reviews.map((review) => {
                          const myVote = getUserVote(review);
                          const isExpanded = expandedReplies.has(review._id);

                          return (
                            <motion.div key={review._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                              className={`rounded-[2.5rem] p-8 border transition-all duration-300 ${isDark ? 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                                }`}>

                              {/* Review header */}
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-5">
                                  <div className="relative group/avatar">
                                    <div
                                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black transition-transform duration-500 group-hover/avatar:scale-110"
                                      style={{ backgroundColor: `${accent}15`, color: accent, border: `1px solid ${accent}20` }}
                                    >
                                      {review.userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg border-2 border-[#050508] flex items-center justify-center shadow-lg" style={{ backgroundColor: accent }}>
                                      <Star className="w-3 h-3 text-white fill-current" />
                                    </div>
                                  </div>
                                  <div>
                                    <p className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{review.userName}</p>
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/20 w-fit mt-1">
                                      {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-amber-400 fill-current' : 'text-zinc-800'}`} />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2.5 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                                  <Clock className="w-4 h-4" />
                                  {new Date(review.createdAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })}
                                </div>
                              </div>

                              {/* Review content */}
                              <div className="mb-8">
                                <p className={`text-lg leading-relaxed font-medium ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                                  {review.comment}
                                </p>
                              </div>

                              {/* Interaction Footer */}
                              <div className="flex items-center gap-4">
                                <div className={`flex items-center p-1.5 rounded-2xl ${isDark ? 'bg-black/60 border border-white/5 shadow-inner' : 'bg-slate-50 border border-slate-100'}`}>
                                  <button onClick={() => voteReview(review._id, 'up')}
                                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all duration-300 font-black text-sm ${myVote === 'up'
                                      ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 scale-105'
                                      : isDark ? 'text-zinc-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                                      }`}>
                                    <ThumbsUp className={`w-4 h-4 ${myVote === 'up' ? 'fill-current' : ''}`} />
                                    <span>{review.upvotes}</span>
                                  </button>

                                  <div className={`w-px h-5 mx-2 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />

                                  <button onClick={() => voteReview(review._id, 'down')}
                                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all duration-300 font-black text-sm ${myVote === 'down'
                                      ? 'text-white shadow-xl scale-105'
                                      : isDark ? 'text-zinc-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                                      }`}
                                    style={{ backgroundColor: myVote === 'down' ? accent : undefined }}
                                  >
                                    <ThumbsDown className={`w-4 h-4 ${myVote === 'down' ? 'fill-current' : ''}`} />
                                    <span>{review.downvotes}</span>
                                  </button>
                                </div>

                                <button onClick={() => {
                                  if (!user) { openAuthModal('signin'); return; }
                                  setReplyingTo(replyingTo === review._id ? null : review._id);
                                }}
                                  className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl transition-all duration-300 ml-auto font-black text-xs uppercase tracking-widest shadow-lg ${replyingTo === review._id
                                    ? 'text-white'
                                    : isDark ? 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  style={{ backgroundColor: replyingTo === review._id ? accent : undefined }}
                                >
                                  <MessageCircle className="w-5 h-5" />
                                  <span>{isFr ? 'Répondre' : 'Reply'}</span>
                                </button>
                              </div>

                              {/* Nested Replies */}
                              {review.replies.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-white/5">
                                  <button onClick={() => setExpandedReplies(prev => {
                                    const n = new Set(prev);
                                    n.has(review._id) ? n.delete(review._id) : n.add(review._id);
                                    return n;
                                  })}
                                    className="flex items-center gap-3 px-5 py-2 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95"
                                    style={{ backgroundColor: `${accent}10`, color: accent }}
                                  >
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                                    {isFr ? `${review.replies.length} Réponse(s)` : `${review.replies.length} Reply/ies`}
                                  </button>

                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0, filter: 'blur(10px)' }}
                                        animate={{ height: 'auto', opacity: 1, filter: 'blur(0px)' }}
                                        exit={{ height: 0, opacity: 0, filter: 'blur(10px)' }}
                                        className="mt-8 pl-8 space-y-7 border-l-2 relative"
                                        style={{ borderImage: `linear-gradient(to bottom, ${accent}40, transparent) 1` }}
                                      >
                                        {review.replies.map((reply: any, idx: number) => (
                                          <div key={reply._id || idx} className="relative group/reply">
                                            <div className="flex items-center gap-4 mb-3">
                                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black border ${isDark ? "bg-white/5 border-white/10 text-zinc-400" : "bg-black/5 border-black/10 text-zinc-600"}`}>
                                                {reply.userName.charAt(0).toUpperCase()}
                                              </div>
                                              <div className="flex flex-col">
                                                <span className={`text-sm font-black ${isDark ? "text-white" : "text-zinc-900"}`}>{reply.userName}</span>
                                                <span className={`text-[9px] font-bold uppercase tracking-[0.15em] ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
                                                  {new Date(reply.createdAt).toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", { day: 'numeric', month: 'short' })}
                                                </span>
                                              </div>
                                            </div>
                                            <p className={`text-[15px] font-medium leading-relaxed px-1 ${isDark ? "text-zinc-400" : "text-zinc-700"}`}>
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
                                    className="mt-6 overflow-hidden">
                                    <div className="flex gap-3">
                                      <input
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder={isFr ? 'Votre réponse...' : 'Your reply...'}
                                        className={`flex-1 rounded-2xl px-6 py-4 text-sm font-medium outline-none transition-all focus:border-[var(--accent)] ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder:text-zinc-600 focus:bg-white/10' : 'bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white'}`}
                                        maxLength={500}
                                        onKeyDown={(e) => { if (e.key === 'Enter') submitReply(review._id); }}
                                      />
                                      <button
                                        onClick={() => submitReply(review._id)}
                                        disabled={submittingReply}
                                        className="px-6 py-4 rounded-2xl text-white shadow-xl transition-all disabled:opacity-50 hover:scale-105 active:scale-95"
                                        style={{ backgroundColor: accent }}
                                      >
                                        {submittingReply ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
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
