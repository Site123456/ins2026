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
      .catch(() => {});
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
    } catch {}
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
    } catch {}
    finally { setSubmittingReply(false); }
  };

  const getUserVote = (review: Review): 'up' | 'down' | null => {
    const odine = user ? `u_${user.email}` : guestOdine;
    const found = review.votedBy?.find(v => v.odine === odine);
    return found?.vote || null;
  };

  const stats = selectedDish ? (dishStats[selectedDish.id] || { avgRating: 0, totalReviews: 0, totalVoteScore: 0 }) : null;

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#010104]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">
            {isFr ? 'Explorer Notre Menu' : 'Explore Our Menu'}
            <span className="text-rose-500">.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-lg max-w-2xl mx-auto text-zinc-400">
            {isFr
              ? 'Découvrez les saveurs authentiques de l\'Inde et du Népal, notées par notre communauté.'
              : 'Discover the authentic flavors of India and Nepal, rated by our community.'}
          </motion.p>
        </div>

        {/* Search + Filters */}
        <div className="relative mb-12 z-10 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-3 items-stretch">
            {/* Search */}
            <div className="relative flex-1 rounded-2xl border bg-white/5 border-white/10 focus-within:border-white/30 focus-within:bg-white/8 transition-all duration-300">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                placeholder={isFr ? 'Rechercher un plat, ingrédient...' : 'Search for a dish, ingredient...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-4 pl-14 pr-6 bg-transparent outline-none text-base text-white placeholder:text-zinc-500"
              />
            </div>

            {/* Favorites */}
            <button onClick={() => setShowFavorites(!showFavorites)}
              className={`flex items-center gap-2 px-5 py-4 rounded-2xl font-bold transition-all duration-300 whitespace-nowrap
                ${showFavorites ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'}`}>
              <Heart className={`w-5 h-5 ${showFavorites ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{isFr ? 'Favoris' : 'Favorites'}</span>
            </button>

            {/* Sort */}
            <div className="relative">
              <button onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-5 py-4 rounded-2xl font-bold bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-all whitespace-nowrap w-full md:w-auto justify-center">
                <SlidersHorizontal className="w-5 h-5" />
                <span className="hidden sm:inline">{sortOptions.find(s => s.value === sortBy)?.label[language] || 'Sort'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-zinc-900/95 border border-white/10 backdrop-blur-xl shadow-2xl z-50 overflow-hidden">
                    {sortOptions.map(opt => {
                      const Icon = opt.icon;
                      return (
                        <button key={opt.value} onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-all
                            ${sortBy === opt.value ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-300 hover:bg-white/5'}`}>
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

          {/* Categories */}
          <div className="mt-6 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            <div className="flex gap-2 px-1 w-max mx-auto">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300
                    ${selectedCategory === cat
                      ? 'bg-white text-zinc-900 shadow-lg scale-105'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}`}>
                  {cat === 'All' ? (isFr ? 'Tout' : 'All') : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredItems.map((item) => {
              const isFavorite = getFavorites()?.includes(item.id);
              const st = dishStats[item.id];

              return (
                <motion.div layout key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => openDish(item)}
                  className="group relative rounded-[1.5rem] overflow-hidden cursor-pointer bg-white/5 border border-white/5 hover:border-white/15 hover:bg-white/8 transition-all duration-500">

                  {/* Image */}
                  <div className="relative h-56 overflow-hidden">
                    <img src={item.image} alt={item.name[language]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Price */}
                    <div className="absolute bottom-4 left-4 flex gap-2">
                      <span className="bg-white/95 text-zinc-900 px-3.5 py-1.5 rounded-full font-black text-sm shadow-lg">
                        {item.prices[0].toFixed(2)} €
                      </span>
                      {item.originalPrice && (
                        <span className="px-3 py-1.5 rounded-full font-bold text-white bg-red-500/80 line-through text-xs flex items-center">
                          {item.originalPrice.toFixed(2)} €
                        </span>
                      )}
                    </div>

                    {/* Favorite */}
                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                      className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md transition-all duration-300
                        ${isFavorite ? 'bg-rose-500/90 text-white shadow-[0_4px_12px_rgba(244,63,94,0.4)]' : 'bg-black/30 hover:bg-black/50 text-white hover:scale-110'}`}>
                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      {item.isVeg && (
                        <div className="bg-emerald-500/90 backdrop-blur-md text-white p-2 rounded-full shadow-lg">
                          <Leaf className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {item.popularity && item.popularity > 95 && (
                        <div className="bg-orange-500/90 backdrop-blur-md text-white p-2 rounded-full shadow-lg">
                          <Flame className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 text-zinc-500">{item.category}</p>
                    <h3 className="text-lg font-bold mb-1.5 text-white">{item.name[language]}</h3>
                    <p className="text-sm line-clamp-2 text-zinc-400 mb-3">{item.description[language]}</p>

                    {/* Review badge */}
                    <div className="flex items-center gap-3">
                      {st && st.totalReviews > 0 ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <div className="flex items-center gap-0.5 text-amber-400">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="font-bold">{st.avgRating}</span>
                          </div>
                          <span className="text-zinc-500">({st.totalReviews} {isFr ? 'avis' : 'reviews'})</span>
                          {st.totalVoteScore > 0 && (
                            <span className="text-emerald-400 text-[10px] flex items-center gap-0.5">
                              <ThumbsUp className="w-3 h-3" />+{st.totalVoteScore}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600">{isFr ? 'Aucun avis' : 'No reviews yet'}</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-zinc-600 ml-auto group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Empty state */}
          {filteredItems.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 bg-white/5 text-zinc-500">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">{isFr ? 'Aucun plat trouvé' : 'No dishes found'}</h3>
              <p className="text-zinc-400">{isFr ? 'Essayez de modifier votre recherche.' : 'Try adjusting your search.'}</p>
              <button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setShowFavorites(false); }}
                className="mt-6 px-6 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white transition-all">
                {isFr ? 'Effacer les filtres' : 'Clear Filters'}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* ===== DISH DETAIL DRAWER ===== */}
      <AnimatePresence>
        {selectedDish && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setSelectedDish(null)} />

            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] bg-zinc-950 rounded-t-3xl border-t border-white/10 overflow-hidden flex flex-col"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2 shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/15" />
              </div>

              <div className="overflow-y-auto flex-1 pb-8" style={{ scrollbarWidth: 'thin' }}>
                {/* Hero */}
                <div className="relative h-56 sm:h-72 overflow-hidden">
                  <img src={selectedDish.image} alt={selectedDish.name[language]} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                  <button onClick={() => setSelectedDish(null)}
                    className="absolute top-4 right-4 p-2.5 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all">
                    <X className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-4 left-5 right-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-1">{selectedDish.category}</p>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">{selectedDish.name[language]}</h2>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="bg-white/95 text-zinc-900 px-4 py-1.5 rounded-full font-black text-sm shadow-lg">
                        {selectedDish.prices[0].toFixed(2)} €
                      </span>
                      {stats && stats.totalReviews > 0 && (
                        <div className="flex items-center gap-1.5 text-sm bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
                          <Star className="w-4 h-4 text-amber-400 fill-current" />
                          <span className="text-white font-bold">{stats.avgRating}</span>
                          <span className="text-zinc-400">({stats.totalReviews})</span>
                        </div>
                      )}
                      {selectedDish.isVeg && (
                        <span className="bg-emerald-500/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Leaf className="w-3 h-3" /> {isFr ? 'Végétarien' : 'Vegetarian'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-5 pt-4">
                  <p className="text-sm text-zinc-400 leading-relaxed mb-6">{selectedDish.description[language]}</p>

                  {/* ===== REVIEWS SECTION ===== */}
                  <div className="border-t border-white/5 pt-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-rose-400" />
                      {isFr ? 'Avis & Commentaires' : 'Reviews & Comments'}
                      {stats && stats.totalReviews > 0 && (
                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-zinc-400">{stats.totalReviews}</span>
                      )}
                    </h3>

                    {/* Write review */}
                    <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/5">
                      <p className="text-sm font-semibold text-white mb-3">
                        {isFr ? 'Donner votre avis' : 'Write a review'}
                      </p>

                      {!user && (
                        <button onClick={() => openAuthModal('signin')}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/20 text-rose-400 font-bold text-sm hover:bg-rose-500/30 transition-all">
                          <LogIn className="w-4 h-4" />
                          {isFr ? 'Connectez-vous pour donner votre avis' : 'Sign in to write a review'}
                        </button>
                      )}

                      {user && (
                        <>
                          {/* Star input */}
                          <div className="flex items-center gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map(s => (
                              <button key={s}
                                onMouseEnter={() => setHoverRating(s)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setNewRating(s)}
                                className="transition-transform hover:scale-125">
                                <Star className={`w-7 h-7 transition-colors ${s <= (hoverRating || newRating) ? 'text-amber-400 fill-current' : 'text-zinc-600'}`} />
                              </button>
                            ))}
                            {newRating > 0 && <span className="text-xs text-zinc-400 ml-2">{newRating}/5</span>}
                          </div>

                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={isFr ? 'Partagez votre expérience...' : 'Share your experience...'}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-white/20 resize-none h-20 mb-3"
                            maxLength={1000}
                          />

                          {reviewError && <p className="text-xs text-red-400 mb-2">{reviewError}</p>}

                          <button onClick={submitReview} disabled={submittingReview}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-all disabled:opacity-50">
                            {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {isFr ? 'Publier' : 'Submit'}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Reviews list */}
                    {reviewsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageCircle className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-500 text-sm">{isFr ? 'Soyez le premier à donner votre avis !' : 'Be the first to write a review!'}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reviews.map((review) => {
                          const myVote = getUserVote(review);
                          const isExpanded = expandedReplies.has(review._id);

                          return (
                            <motion.div key={review._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                              className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all">

                              {/* Review header */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                                    {review.userName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-white">{review.userName}</p>
                                    <div className="flex items-center gap-1">
                                      {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-amber-400 fill-current' : 'text-zinc-700'}`} />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(review.createdAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>

                              {/* Review comment */}
                              <p className="text-sm text-zinc-300 leading-relaxed mb-3">{review.comment}</p>

                              {/* Vote + Reply buttons */}
                              <div className="flex items-center gap-3 text-xs">
                                <button onClick={() => voteReview(review._id, 'up')}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${myVote === 'up' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}>
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                  <span className="font-semibold">{review.upvotes}</span>
                                </button>
                                <button onClick={() => voteReview(review._id, 'down')}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${myVote === 'down' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}>
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                  <span className="font-semibold">{review.downvotes}</span>
                                </button>

                                <button onClick={() => {
                                  if (!user) { openAuthModal('signin'); return; }
                                  setReplyingTo(replyingTo === review._id ? null : review._id);
                                }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 transition-all ml-auto">
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  {review.replies.length > 0 && <span className="font-semibold">{review.replies.length}</span>}
                                  <span>{isFr ? 'Répondre' : 'Reply'}</span>
                                </button>
                              </div>

                              {/* Replies */}
                              {review.replies.length > 0 && (
                                <div className="mt-3">
                                  <button onClick={() => setExpandedReplies(prev => {
                                    const n = new Set(prev);
                                    n.has(review._id) ? n.delete(review._id) : n.add(review._id);
                                    return n;
                                  })}
                                    className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-all mb-2">
                                    <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    {isExpanded
                                      ? (isFr ? 'Masquer les réponses' : 'Hide replies')
                                      : (isFr ? `Voir ${review.replies.length} réponse(s)` : `View ${review.replies.length} ${review.replies.length === 1 ? 'reply' : 'replies'}`)}
                                  </button>

                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                        className="space-y-2 pl-4 border-l-2 border-white/5 overflow-hidden">
                                        {review.replies.map((reply: any, idx: number) => (
                                          <div key={reply._id || idx} className="py-2">
                                            <div className="flex items-center gap-2 mb-1">
                                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-[8px] font-bold">
                                                {reply.userName.charAt(0).toUpperCase()}
                                              </div>
                                              <span className="text-xs font-semibold text-white">{reply.userName}</span>
                                              <span className="text-[10px] text-zinc-600">
                                                {new Date(reply.createdAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })}
                                              </span>
                                            </div>
                                            <p className="text-xs text-zinc-400 leading-relaxed">{reply.comment}</p>
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
