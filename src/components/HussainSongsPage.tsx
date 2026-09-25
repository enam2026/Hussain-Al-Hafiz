import { useState, useMemo, useEffect, FormEvent, MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Search,
  ExternalLink,
  ChevronLeft,
  Share2,
  Check,
  Plus,
  X,
  Sparkles,
  Youtube,
  Radio,
  ThumbsUp,
  SlidersHorizontal,
  CheckCircle2,
  SkipForward,
  SkipBack,
  MoreVertical,
  Volume2,
  Maximize2,
  ListFilter,
  Flame,
  Music2,
  Bell,
  Clock,
  Shuffle,
  Compass,
  Film,
  Trash2
} from "lucide-react";
import {
  HUSSAIN_NASHEEDS_DATA,
  NasheedItem,
  toBengaliNumber
} from "../data/hussainNasheeds";

interface HussainSongsPageProps {
  onBack?: () => void;
  langKey?: string;
}

const LOCAL_STORAGE_KEY = "hussain_al_hafiz_custom_nasheeds_v1";
const HIDDEN_SONGS_KEY = "hussain_hidden_song_ids_v1";
const HUSSAIN_PHOTO_URL = "https://res.cloudinary.com/nwbfiy4i/image/upload/v1790000601/811710864_2674975879585073_7646566003431641265_n_ocrc3e.jpg";
const HUSSAIN_BANNER_URL = "https://res.cloudinary.com/nwbfiy4i/image/upload/v1790315784/HH_zqzh9i.jpg";

export default function HussainSongsPage({ onBack, langKey = "bn" }: HussainSongsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [activeVideo, setActiveVideo] = useState<NasheedItem | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [likedSongIds, setLikedSongIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem("hussain_liked_songs");
      return saved ? JSON.parse(saved) : [1, 2, 3, 4, 13];
    } catch {
      return [1, 2, 3, 4, 13];
    }
  });
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "kolarob" | "ahmad" | "badruzzaman" | "others">("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Custom added songs stored locally
  const [customSongs, setCustomSongs] = useState<NasheedItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Hidden/Removed songs (e.g. if unavailable on YouTube)
  const [hiddenSongIds, setHiddenSongIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(HIDDEN_SONGS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Automatically filter out any songs whose YouTube thumbnail returns the 120px gray placeholder
  const [brokenSongIds, setBrokenSongIds] = useState<number[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const allSongs: NasheedItem[] = useMemo(() => {
    return [...HUSSAIN_NASHEEDS_DATA, ...customSongs].filter(
      (song) => !hiddenSongIds.includes(song.id) && !brokenSongIds.includes(song.id)
    );
  }, [customSongs, hiddenSongIds, brokenSongIds]);

  // YouTube Category Filter Chips
  const filterChips = useMemo(() => {
    return [
      { id: "all", label: `সবগুলো (${allSongs.length})` },
      { id: "favorites", label: `পছন্দের গান (${likedSongIds.length})` },
      { id: "কলরব", label: "কলরব শিল্পীগোষ্ঠী" },
      { id: "আহমদ আবদুল্লাহ", label: "আহমদ আবদুল্লাহ" },
      { id: "মুহাম্মদ বদরুজ্জামান", label: "মুহাম্মদ বদরুজ্জামান" },
      { id: "আবু রায়হান", label: "আবু রায়হান" },
      { id: "খিজির মুহাম্মদ", label: "খিজির মুহাম্মদ" },
      { id: "তাহসিনুল ইসলাম", label: "তাহসিনুল ইসলাম" },
      { id: "কাউসার আহমদ", label: "কাউসার আহমদ সোহাইল" },
      { id: "তাওহীদ জামিল", label: "তাওহীদ জামিল" },
      { id: "রমজান", label: "মাহে রমজান" },
      { id: "ঈদ", label: "ঈদ স্পেশাল" },
      { id: "শিক্ষা", label: "শিক্ষা ও ইলম" },
      { id: "দেশাত্মবোধক", label: "দেশাত্মবোধক" },
    ];
  }, [allSongs.length, likedSongIds.length]);

  const filteredSongs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allSongs.filter((song) => {
      const matchesQuery =
        !query ||
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        song.bnId.includes(query) ||
        song.id.toString().includes(query);

      if (selectedCategoryFilter === "favorites") {
        return matchesQuery && likedSongIds.includes(song.id);
      }

      const matchesCategory =
        selectedCategoryFilter === "all" ||
        song.artist.includes(selectedCategoryFilter) ||
        (song.category && song.category.includes(selectedCategoryFilter)) ||
        (song.tags && song.tags.some((t) => t.includes(selectedCategoryFilter)));

      return matchesQuery && matchesCategory;
    });
  }, [allSongs, searchQuery, selectedCategoryFilter, likedSongIds]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const handleCopyLink = (song: NasheedItem) => {
    navigator.clipboard.writeText(song.youtubeUrl);
    setCopiedId(song.id);
    showToast("লিংক কপি হয়েছে!");
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const toggleLike = (songId: number) => {
    setLikedSongIds((prev) => {
      const next = prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId];
      try {
        localStorage.setItem("hussain_liked_songs", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleNextSong = () => {
    if (!activeVideo) return;
    const currentIndex = allSongs.findIndex((s) => s.id === activeVideo.id);
    if (currentIndex >= 0 && currentIndex < allSongs.length - 1) {
      setActiveVideo(allSongs[currentIndex + 1]);
    } else {
      setActiveVideo(allSongs[0]);
    }
  };

  const handlePrevSong = () => {
    if (!activeVideo) return;
    const currentIndex = allSongs.findIndex((s) => s.id === activeVideo.id);
    if (currentIndex > 0) {
      setActiveVideo(allSongs[currentIndex - 1]);
    } else {
      setActiveVideo(allSongs[allSongs.length - 1]);
    }
  };

  const handleShufflePlay = () => {
    const randomIndex = Math.floor(Math.random() * allSongs.length);
    setActiveVideo(allSongs[randomIndex]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddSong = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    // extract video id
    let vidId = "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = newUrl.match(regExp);
    if (match && match[2].length === 11) {
      vidId = match[2];
    } else {
      vidId = newUrl.trim();
    }

    const nextId = allSongs.length + 1;
    const newSong: NasheedItem = {
      id: nextId,
      bnId: toBengaliNumber(nextId),
      title: newTitle.trim(),
      artist: newArtist.trim() || "হুসাইন আল হাফিজ",
      youtubeUrl: newUrl.trim(),
      youtubeId: vidId,
      category: newCategory.trim() || "নতুন প্রকাশিত",
      tags: [newArtist.trim() || "নাশিদ"],
    };

    const updated = [...customSongs, newSong];
    setCustomSongs(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    setNewTitle("");
    setNewArtist("");
    setNewUrl("");
    setNewCategory("");
    setShowAddModal(false);
    showToast("নতুন নাশিদ সফলভাবে তালিকায় যোগ করা হয়েছে!");
  };

  const handleRemoveSong = (song: NasheedItem, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm(`"${song.title}" গানটি কি তালিকা থেকে সরিয়ে ফেলতে চান?`)) {
      if (customSongs.some((s) => s.id === song.id)) {
        const updated = customSongs.filter((s) => s.id !== song.id);
        setCustomSongs(updated);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
      } else {
        setHiddenSongIds((prev) => {
          const next = [...prev, song.id];
          try {
            localStorage.setItem(HIDDEN_SONGS_KEY, JSON.stringify(next));
          } catch {}
          return next;
        });
      }
      if (activeVideo?.id === song.id) {
        setActiveVideo(null);
      }
      showToast(`"${song.title}" তালিকা থেকে সরানো হয়েছে`);
    }
  };

  const handleRestoreDefaultSongs = () => {
    setHiddenSongIds([]);
    try {
      localStorage.removeItem(HIDDEN_SONGS_KEY);
    } catch {}
    showToast("সকল গান ফিরিয়ে আনা হয়েছে");
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#F1F1F1] font-sans antialiased selection:bg-[#CC0000] selection:text-white pb-24">
      {/* ────────────────────────────────────────────────────────
          YOUTUBE STYLE TOP HEADER / NAVBAR
          ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#0F0F0F]/95 backdrop-blur-md border-b border-[#272727] px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Back & YouTube Red Logo Branding */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-[#272727] text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="ফিরে যান"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* YouTube Iconic Logo Mark */}
          <div
            onClick={() => {
              setSearchQuery("");
              setSelectedCategoryFilter("all");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2 cursor-pointer select-none group"
            title="হুসাইন আল হাফিজ - ১০০ গান (হোম)"
          >
            <div className="w-8 h-5.5 sm:w-9 sm:h-6 bg-[#FF0000] group-hover:bg-[#CC0000] rounded-md sm:rounded-lg flex items-center justify-center shadow-sm transition-colors">
              <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
            </div>
            <div className="flex items-baseline">
              <span className="font-bold tracking-tighter text-base sm:text-lg text-white font-sans">
                হুসাইন আল হাফিজ
              </span>
              <span className="text-[10px] font-bold text-red-500 ml-1.5 font-mono tracking-wider uppercase bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/40">
                {toBengaliNumber(allSongs.length)} গান
              </span>
            </div>
          </div>
        </div>

        {/* Center: YouTube Iconic Pill Search Bar */}
        <div className="hidden md:flex items-center justify-center flex-1 max-w-xl mx-4">
          <div className="flex items-center w-full">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="গানের শিরোনাম বা শিল্পী দিয়ে খুঁজুন..."
                className="w-full pl-4 pr-9 py-2 bg-[#121212] border border-[#303030] rounded-l-full text-sm text-[#f1f1f1] placeholder-[#888888] focus:outline-none focus:border-[#3EA6FF] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              className="bg-[#222222] hover:bg-[#272727] border border-l-0 border-[#303030] px-5 py-2 rounded-r-full text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="খুঁজুন"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: + Create Button (YouTube style) & Quick Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Search Toggle */}
          <div className="md:hidden flex items-center">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="খুঁজুন..."
                className="w-28 sm:w-44 pl-7 pr-2 py-1.5 bg-[#121212] border border-[#303030] rounded-full text-xs text-white placeholder-neutral-500 focus:outline-none focus:w-48 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-[#272727] hover:bg-[#383838] border border-[#383838] text-xs font-medium text-white transition-colors cursor-pointer"
            title="নতুন নাশিদ যোগ করুন"
          >
            <Plus className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden sm:inline">নতুন নাশিদ</span>
          </button>

          <button
            onClick={handleShufflePlay}
            className="p-2 rounded-full hover:bg-[#272727] text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="র‍্যান্ডম যে কোনো গান চালান"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {/* YouTube Channel Avatar Badge */}
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-amber-600 to-red-600 text-white font-bold text-xs flex items-center justify-center shadow ring-1 ring-neutral-700">
            হ
          </div>
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────
          YOUTUBE WATCH THEATER MODE (WHEN A VIDEO IS ACTIVE)
          ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#0b0b0b] border-b border-[#272727] overflow-hidden"
          >
            <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Main Player Column (Left 8 cols) */}
                <div className="lg:col-span-8">
                  <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-[#272727]">
                    {activeVideo.youtubeId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                        title={activeVideo.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                        <Youtube className="w-16 h-16 text-red-600 mb-3" />
                        <h4 className="text-white text-base font-bold mb-2">{activeVideo.title}</h4>
                        <p className="text-neutral-400 text-xs mb-4">ভিডিওটি ইউটিউবে সরাসরি উপভোগ করতে নিচের লিংকে ক্লিক করুন:</p>
                        <a
                          href={activeVideo.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-2.5 rounded-full bg-[#FF0000] hover:bg-[#CC0000] text-white font-bold text-xs inline-flex items-center gap-2 shadow"
                        >
                          <Youtube className="w-4 h-4" />
                          <span>ইউটিউবে সরাসরি দেখুন</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Video Title */}
                  <div className="mt-4">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight">
                      #{activeVideo.bnId}। {activeVideo.title} [{activeVideo.artist}]
                    </h2>
                  </div>

                  {/* Channel Row & Action Buttons */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#272727]">
                    {/* Left: Channel Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-red-500/50 shadow-md shrink-0 bg-[#1e1e1e]">
                        <img
                          src={HUSSAIN_PHOTO_URL}
                          alt="হুসাইন আল হাফিজ"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-sm sm:text-base text-white">
                          <span>হুসাইন আল হাফিজ</span>
                          <CheckCircle2 className="w-4 h-4 text-[#AAAAAA] fill-[#AAAAAA] text-black" />
                        </div>
                        <div className="text-xs text-[#AAAAAA]">
                          গীতিকার • নাশিদ সম্ভার
                        </div>
                      </div>
                      <button
                        onClick={() => setIsSubscribed(!isSubscribed)}
                        className={`ml-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          isSubscribed
                            ? "bg-[#272727] hover:bg-[#383838] text-white"
                            : "bg-white hover:bg-neutral-200 text-black shadow"
                        }`}
                      >
                        {isSubscribed ? "সাবস্ক্রাইবড" : "সাবস্ক্রাইব"}
                      </button>
                    </div>

                    {/* Right: Actions (Like, Share, Prev/Next, Close) */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleLike(activeVideo.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                          likedSongIds.includes(activeVideo.id)
                            ? "bg-white text-black"
                            : "bg-[#272727] hover:bg-[#383838] text-white"
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{likedSongIds.includes(activeVideo.id) ? "লাইক করা হয়েছে" : "লাইক"}</span>
                      </button>

                      <button
                        onClick={() => handleCopyLink(activeVideo)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#272727] hover:bg-[#383838] text-xs font-semibold text-white transition-colors cursor-pointer"
                      >
                        {copiedId === activeVideo.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                        <span>{copiedId === activeVideo.id ? "কপি হয়েছে" : "শেয়ার"}</span>
                      </button>

                      <a
                        href={activeVideo.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#272727] hover:bg-[#383838] text-xs font-semibold text-red-500 hover:text-red-400 transition-colors"
                        title="ইউটিউবে সরাসরি ওপেন করুন"
                      >
                        <Youtube className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">ইউটিউব</span>
                      </a>

                      <button
                        onClick={() => handleRemoveSong(activeVideo)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#272727] hover:bg-red-950/80 text-xs font-semibold text-neutral-400 hover:text-red-400 border border-transparent hover:border-red-900/60 transition-colors cursor-pointer"
                        title="ইউটিউবে পাওয়া না গেলে গানটি তালিকা থেকে মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">মুছুন</span>
                      </button>

                      <button
                        onClick={handlePrevSong}
                        className="p-2 rounded-full bg-[#272727] hover:bg-[#383838] text-white transition-colors cursor-pointer"
                        title="আগের গান"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>

                      <button
                        onClick={handleNextSong}
                        className="p-2 rounded-full bg-[#272727] hover:bg-[#383838] text-white transition-colors cursor-pointer"
                        title="পরের গান"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setActiveVideo(null)}
                        className="p-2 rounded-full bg-[#272727] hover:bg-red-900/60 text-neutral-300 hover:text-white transition-colors cursor-pointer ml-1"
                        title="প্লেয়ার বন্ধ করুন"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* YouTube Expandable Description Box */}
                  <div className="mt-3 bg-[#272727] rounded-xl p-3.5 text-xs text-[#F1F1F1] leading-relaxed">
                    <div className="font-bold flex items-center gap-2 mb-1.5 text-white">
                      <span>অফিসিয়াল নাশিদ • ক্রমিক #{activeVideo.bnId}</span>
                      <span className="text-[#AAAAAA]">•</span>
                      <span className="text-[#3EA6FF]">{activeVideo.category || "ইসলামিক নাশিদ"}</span>
                    </div>
                    <p className="text-[#D0D0D0]">
                      গীত ও সুর: <strong>হুসাইন আল হাফিজ</strong> • কণ্ঠ/দল: <strong>{activeVideo.artist}</strong>
                    </p>
                    <p className="text-[#AAAAAA] mt-1 break-all">
                      ইউটিউব লিংক: <a href={activeVideo.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-[#3EA6FF] hover:underline">{activeVideo.youtubeUrl}</a>
                    </p>
                  </div>
                </div>

                {/* Right Sidebar: Up Next YouTube Playlist (Right 4 cols) */}
                <div className="lg:col-span-4 bg-[#181818] border border-[#272727] rounded-2xl p-3.5">
                  <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#272727]">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>পরবর্তী নাশিদসমূহ</span>
                        <span className="text-xs font-mono text-neutral-400">({allSongs.length})</span>
                      </h3>
                      <p className="text-[11px] text-neutral-400">হুসাইন আল হাফিজের প্লেলিস্ট</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <span>অটোপ্লে</span>
                      <button
                        onClick={() => setAutoplayNext(!autoplayNext)}
                        className={`w-9 h-5 rounded-full transition-colors p-0.5 relative cursor-pointer ${
                          autoplayNext ? "bg-[#3EA6FF]" : "bg-[#383838]"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            autoplayNext ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Mini Videos Queue */}
                  <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-neutral-700">
                    {allSongs.map((song) => {
                      const isCurrent = activeVideo.id === song.id;
                      const thumb = song.youtubeId
                        ? `https://img.youtube.com/vi/${song.youtubeId}/mqdefault.jpg`
                        : "";

                      return (
                        <div
                          key={song.id}
                          onClick={() => setActiveVideo(song)}
                          className={`group flex items-start gap-2.5 p-2 rounded-xl cursor-pointer transition-colors ${
                            isCurrent
                              ? "bg-[#272727] ring-1 ring-[#3EA6FF]/50"
                              : "hover:bg-[#222222]"
                          }`}
                        >
                          {/* Mini Thumbnail */}
                          <div className="relative w-28 sm:w-32 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={song.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onLoad={(e) => {
                                  if (e.currentTarget.naturalWidth <= 120) {
                                    setBrokenSongIds((prev) => (prev.includes(song.id) ? prev : [...prev, song.id]));
                                  }
                                }}
                                onError={() => {
                                  setBrokenSongIds((prev) => (prev.includes(song.id) ? prev : [...prev, song.id]));
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                                <Music2 className="w-4 h-4 text-neutral-600" />
                              </div>
                            )}
                            <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/85 text-[10px] font-mono font-bold text-white">
                              #{song.bnId}
                            </span>
                            {isCurrent && (
                              <div className="absolute inset-0 bg-red-600/40 flex items-center justify-center">
                                <Volume2 className="w-5 h-5 text-white animate-pulse" />
                              </div>
                            )}
                          </div>

                          {/* Mini Details */}
                          <div className="min-w-0 flex-1">
                            <h4 className={`text-xs font-semibold line-clamp-2 leading-snug ${isCurrent ? "text-[#3EA6FF]" : "text-white group-hover:text-neutral-200"}`}>
                              {song.title}
                            </h4>
                            <p className="text-[11px] text-[#AAAAAA] truncate mt-0.5">
                              {song.artist}
                            </p>
                            <span className="inline-block text-[10px] text-neutral-500 font-mono mt-1">
                              অফিসিয়াল নাশিদ
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ────────────────────────────────────────────────────────
          YOUTUBE CHANNEL BANNER & HEADER SECTION
          ──────────────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        {/* Top Visual Hero Banner with Atmospheric Light Effects */}
        <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden mb-6 sm:mb-8 border border-white/10 shadow-2xl bg-black group">
          {/* Ambient Outer Light Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600/30 via-amber-500/20 to-cyan-500/20 rounded-2xl sm:rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* Banner Container */}
          <div className="relative w-full h-44 sm:h-64 md:h-80 lg:h-96 overflow-hidden">
            {/* Main Banner Image */}
            <img
              src={HUSSAIN_BANNER_URL}
              alt="হুসাইন আল হাফিজ ব্যানার"
              className="w-full h-full object-cover object-center scale-[1.01] group-hover:scale-105 transition-transform duration-1000 ease-out"
            />

            {/* Dynamic Light Beams & Glow Overlay */}
            {/* Top-down dramatic light beam */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/85 pointer-events-none" />
            
            {/* Diagonal Sunbeam / Light Flare */}
            <div className="absolute -top-24 -left-20 w-96 h-96 bg-gradient-to-br from-amber-300/25 via-red-500/15 to-transparent rounded-full blur-3xl pointer-events-none transform -rotate-12 animate-pulse" style={{ animationDuration: '4s' }} />
            
            {/* Right Accent Light */}
            <div className="absolute top-1/4 -right-16 w-80 h-80 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Subtle Horizon Light Line */}
            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none" />

            {/* Bottom Overlay Content with badge */}
            <div className="absolute bottom-3 sm:bottom-5 left-4 sm:left-7 right-4 sm:right-7 flex items-end justify-between gap-3 pointer-events-none">
              <div className="backdrop-blur-md bg-black/55 border border-white/15 px-3.5 py-1.5 rounded-full inline-flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-[11px] sm:text-xs font-semibold text-white tracking-wide">
                  হুসাইন আল হাফিজ • {toBengaliNumber(allSongs.length)}টি নাশিদ কালেকশন
                </span>
              </div>

              <div className="hidden sm:inline-flex backdrop-blur-md bg-red-600/80 border border-red-400/30 px-3 py-1 rounded-full items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span className="text-[11px] font-bold text-white tracking-wider uppercase font-mono">
                  Official Playlist
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Channel Info & Actions Card */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-[#1E1E1E] via-[#2A1810] to-[#1A1A1A] border border-[#272727] p-5 sm:p-7 mb-6 shadow-xl">
          <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -top-10 w-60 h-60 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4 sm:gap-6">
              {/* Channel Profile Avatar */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-[#FF0000] via-orange-600 to-amber-500 shadow-2xl">
                  <img
                    src={HUSSAIN_PHOTO_URL}
                    alt="হুসাইন আল হাফিজ"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-red-600 text-white p-1 rounded-full border-2 border-[#0F0F0F] shadow-sm">
                  <Play className="w-3 h-3 fill-white" />
                </div>
              </div>

              {/* Channel Info */}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                    হুসাইন আল হাফিজের নাশিদ সম্ভার
                  </h1>
                  <CheckCircle2 className="w-5 h-5 text-[#AAAAAA] fill-[#AAAAAA] text-black" />
                </div>

                <p className="text-xs sm:text-sm text-[#AAAAAA] mt-1 flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white">@hussainalhafiz</span>
                  <span>•</span>
                  <span>{toBengaliNumber(allSongs.length)}টি সক্রিয় নাশিদ</span>
                  <span>•</span>
                  <span>গীতিকার ও সুরকার</span>
                </p>

                <p className="text-xs sm:text-sm text-neutral-300 mt-2 max-w-2xl leading-relaxed">
                  নাশিদের লিঙ্কসহ তালিকা। পরবর্তী সময়ে কোনো নাশিদ প্রকাশিত হলে সেটিও যুক্ত রাখার চেষ্টা করবো।
                </p>
              </div>
            </div>

            {/* Channel Quick Actions */}
            <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 flex-wrap">
              {hiddenSongIds.length > 0 && (
                <button
                  onClick={handleRestoreDefaultSongs}
                  className="px-3 py-2 rounded-full bg-[#272727] hover:bg-[#383838] border border-[#383838] text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="মুছে ফেলা গানগুলো আবার তালিকায় আনুন"
                >
                  পুনরুদ্ধার ({toBengaliNumber(hiddenSongIds.length)})
                </button>
              )}

              <button
                onClick={() => {
                  if (allSongs.length > 0) {
                    setActiveVideo(allSongs[0]);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>সব গান চালান</span>
              </button>

              <button
                onClick={handleShufflePlay}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#272727] hover:bg-[#383838] border border-[#383838] text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer"
                title="এলোমেলো গান চালান"
              >
                <Shuffle className="w-4 h-4" />
                <span className="hidden sm:inline">শাফল</span>
              </button>
            </div>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────
            YOUTUBE CATEGORY FILTER PILLS (HORIZONTAL SCROLLER)
            ──────────────────────────────────────────────────────── */}
        <div className="sticky top-[61px] z-30 bg-[#0F0F0F]/95 backdrop-blur-md py-3 border-b border-[#272727] mb-6">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            {filterChips.map((chip) => {
              const isActive = selectedCategoryFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setSelectedCategoryFilter(chip.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none ${
                    isActive
                      ? "bg-white text-black shadow-sm"
                      : "bg-[#272727] hover:bg-[#383838] text-white border border-transparent"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Results Summary */}
        <div className="flex items-center justify-between gap-4 mb-5 text-xs text-[#AAAAAA]">
          <div className="flex items-center gap-2">
            <span>প্রদর্শিত নাশিদ:</span>
            <strong className="text-white font-mono">{filteredSongs.length}টি</strong>
            {searchQuery && (
              <span>("{searchQuery}" দিয়ে খোঁজা হয়েছে)</span>
            )}
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-[#3EA6FF] hover:underline"
            >
              সব ফলাফল দেখুন
            </button>
          )}
        </div>

        {/* ────────────────────────────────────────────────────────
            YOUTUBE VIDEO CARDS GRID (100% YOUTUBE LAYOUT)
            ──────────────────────────────────────────────────────── */}
        {filteredSongs.length === 0 ? (
          <div className="text-center py-20 bg-[#161616] border border-[#272727] rounded-2xl p-8">
            <Youtube className="w-14 h-14 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">কোনো নাশিদ খুঁজে পাওয়া যায়নি</h3>
            <p className="text-xs text-neutral-400 mb-4">
              অন্য কোনো গানের শিরোনাম বা শিল্পী দিয়ে সার্চ করে দেখুন।
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategoryFilter("all");
              }}
              className="px-4 py-2 rounded-full bg-[#272727] hover:bg-[#383838] text-xs font-semibold text-white"
            >
              ফিল্টার রিসেট করুন
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {filteredSongs.map((song, index) => {
              const thumbUrl = song.youtubeId
                ? `https://img.youtube.com/vi/${song.youtubeId}/hqdefault.jpg`
                : "";

              return (
                <div
                  key={song.id}
                  className="group flex flex-col cursor-pointer"
                  onClick={() => {
                    setActiveVideo(song);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  {/* Thumbnail Container (16:9) */}
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#212121] mb-3 shadow-md">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={song.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onLoad={(e) => {
                          // YouTube returns a 120x90 grey placeholder when a video is deleted or unavailable
                          if (e.currentTarget.naturalWidth <= 120) {
                            setBrokenSongIds((prev) => (prev.includes(song.id) ? prev : [...prev, song.id]));
                          }
                        }}
                        onError={() => {
                          setBrokenSongIds((prev) => (prev.includes(song.id) ? prev : [...prev, song.id]));
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                        <Music2 className="w-8 h-8 text-neutral-700" />
                      </div>
                    )}

                    {/* YouTube Hover Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* YouTube Red Hover Progress Bar Indicator */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800">
                      <div className="h-full bg-[#FF0000] w-0 group-hover:w-full transition-all duration-500" />
                    </div>

                    {/* Duration / Index Badge (Bottom Right - YouTube style) */}
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/85 text-white font-mono text-[11px] font-bold tracking-tight">
                      #{song.bnId}
                    </span>

                    {/* Category Pill (Top Left) */}
                    {song.category && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-medium text-neutral-200">
                        {song.category}
                      </span>
                    )}
                  </div>

                  {/* Video Metadata (Avatar + Two-line Title + Channel Name) */}
                  <div className="flex items-start gap-3">
                    {/* Channel / Artist Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 via-orange-600 to-red-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow mt-0.5">
                      {song.artist.slice(0, 1) || "হু"}
                    </div>

                    {/* Title and Metadata */}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-[#3EA6FF] transition-colors">
                        #{song.bnId}। {song.title}
                      </h3>

                      <div className="flex items-center gap-1 text-xs text-[#AAAAAA] hover:text-white transition-colors mt-1">
                        <span className="truncate">[{song.artist}]</span>
                        <CheckCircle2 className="w-3 h-3 text-[#AAAAAA] fill-[#AAAAAA] text-black shrink-0" />
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-[#AAAAAA] mt-0.5">
                        <span>গীত: হুসাইন আল হাফিজ</span>
                        <span>•</span>
                        <span>অফিসিয়াল</span>
                      </div>
                    </div>

                    {/* Actions Trigger (Copy + Remove if broken) */}
                    <div className="shrink-0 pt-0.5 flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleCopyLink(song)}
                        className="p-1.5 rounded-full hover:bg-[#272727] text-neutral-400 hover:text-white transition-colors"
                        title="লিংক কপি করুন"
                      >
                        {copiedId === song.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={(e) => handleRemoveSong(song, e)}
                        className="p-1.5 rounded-full hover:bg-red-950/80 text-neutral-500 hover:text-red-400 transition-colors opacity-70 group-hover:opacity-100"
                        title="ইউটিউবে পাওয়া না গেলে বা বাদ দিতে ক্লিক করুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────
          FOOTER WITH SOCIAL / FACEBOOK BUTTONS
          ──────────────────────────────────────────────────────── */}
      <footer className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-10 pb-16">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-b from-[#181818] via-[#141414] to-[#0A0A0A] border border-[#272727] p-6 sm:p-8 md:p-10 shadow-2xl">
          {/* Ambient Lighting Background */}
          <div className="absolute top-0 right-1/4 w-96 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left Info */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/40 text-blue-400 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                <span>সোশ্যাল মিডিয়া ও অফিশিয়াল সংযোগ</span>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                হুসাইন আল হাফিজের সাথে যুক্ত থাকুন
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-lg leading-relaxed">
                নতুন গানের রিলিজ, সাহিত্য ও ইসলামিক সৃষ্টির নিয়মিত আপডেট পেতে ফেসবুক প্রোফাইল ও অফিশিয়াল ক্যানভাস পেজে ফলো করুন।
              </p>
            </div>

            {/* Right Buttons: 2 Distinctive Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
              {/* Button 1: হুসাইন আল হাফিজের ফেসবুক */}
              <a
                href="https://web.facebook.com/husa.ina.ala.haphija"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-[#1877F2]/10 hover:bg-[#1877F2] border border-[#1877F2]/30 hover:border-[#1877F2] text-white shadow-lg transition-all duration-300 hover:shadow-[0_0_25px_rgba(24,119,242,0.45)] hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-[#1877F2] group-hover:bg-white text-white group-hover:text-[#1877F2] flex items-center justify-center shadow-md transition-colors shrink-0">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <div className="text-left pr-2">
                  <div className="text-[11px] text-blue-300 group-hover:text-blue-100 font-medium">
                    ব্যক্তিগত প্রোফাইল
                  </div>
                  <div className="text-sm font-bold text-white tracking-wide">
                    হুসাইন আল হাফিজের ফেসবুক
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-blue-400 group-hover:text-white transition-colors ml-auto shrink-0" />
              </a>

              {/* Button 2: হুসাইন আল হাফিজের ক্যানভাস */}
              <a
                href="https://web.facebook.com/canvas290"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-purple-950/30 to-indigo-950/30 hover:from-purple-600 hover:to-indigo-600 border border-purple-500/30 hover:border-purple-400 text-white shadow-lg transition-all duration-300 hover:shadow-[0_0_25px_rgba(147,51,234,0.45)] hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 group-hover:bg-white text-white group-hover:text-purple-600 flex items-center justify-center shadow-md transition-colors shrink-0">
                  {/* Art Canvas / Palette Icon */}
                  <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
                    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
                    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
                    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                  </svg>
                </div>
                <div className="text-left pr-2">
                  <div className="text-[11px] text-purple-300 group-hover:text-purple-100 font-medium">
                    অফিসিয়াল পেইজ
                  </div>
                  <div className="text-sm font-bold text-white tracking-wide">
                    হুসাইন আল হাফিজের ক্যানভাস
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-purple-400 group-hover:text-white transition-colors ml-auto shrink-0" />
              </a>
            </div>
          </div>

          {/* Bottom Copyright & Credit Line */}
          <div className="mt-8 pt-6 border-t border-[#222222] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
            <p>© {new Date().getFullYear()} হুসাইন আল হাফিজ • সর্বস্বত্ব সংরক্ষিত।</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-neutral-400">ইসলামিক নাশিদ সংগ্রহশালা</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ────────────────────────────────────────────────────────
          YOUTUBE STUDIO STYLE "+ CREATE / নতুন নাশিদ" MODAL
          ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#282828] border border-[#3F3F3F] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-[#F1F1F1]"
            >
              {/* YouTube Studio Modal Header */}
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#3F3F3F] bg-[#212121]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-red-600 flex items-center justify-center text-white">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white">নতুন নাশিদ যুক্ত করুন</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-full hover:bg-[#383838] text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleAddSong} className="p-5 space-y-4">
                <p className="text-xs text-[#AAAAAA] leading-relaxed">
                  হুসাইন আল হাফিজের নতুন কোনো নাশিদ প্রকাশিত হলে ইউটিউব লিংকসহ এখানে যোগ করে দিলে তালিকায় যুক্ত থাকবে:
                </p>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    নাশিদের শিরোনাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="যেমন: আলো ছড়িয়ে দাও"
                    className="w-full px-3.5 py-2.5 bg-[#121212] border border-[#3F3F3F] focus:border-[#3EA6FF] rounded-xl text-xs sm:text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    শিল্পী / শিল্পীগোষ্ঠী *
                  </label>
                  <input
                    type="text"
                    required
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    placeholder="যেমন: আহমদ আবদুল্লাহ, কলরব"
                    className="w-full px-3.5 py-2.5 bg-[#121212] border border-[#3F3F3F] focus:border-[#3EA6FF] rounded-xl text-xs sm:text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    ইউটিউব ভিডিও লিংক *
                  </label>
                  <input
                    type="url"
                    required
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="যেমন: https://youtu.be/..."
                    className="w-full px-3.5 py-2.5 bg-[#121212] border border-[#3F3F3F] focus:border-[#3EA6FF] rounded-xl text-xs sm:text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    ক্যাটাগরি / বিভাগ (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="যেমন: মাহে রমজান / দেশাত্মবোধক"
                    className="w-full px-3.5 py-2.5 bg-[#121212] border border-[#3F3F3F] focus:border-[#3EA6FF] rounded-xl text-xs sm:text-sm text-white focus:outline-none"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-[#3F3F3F] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-full hover:bg-[#383838] text-xs font-semibold text-neutral-300 transition-colors"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-[#3EA6FF] hover:bg-[#65b8ff] text-black font-bold text-xs shadow-md transition-colors"
                  >
                    তালিকায় যোগ করুন
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#212121] border border-[#383838] text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
