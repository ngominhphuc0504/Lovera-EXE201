import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  Image as ImageIcon, 
  Plus, 
  Calendar, 
  MapPin, 
  Clock, 
  Filter, 
  Search, 
  Sparkles, 
  X, 
  Check, 
  Edit3, 
  Trash2, 
  Download, 
  Share2, 
  LayoutGrid, 
  List, 
  Camera, 
  Bookmark, 
  HeartHandshake,
  AlertCircle
} from 'lucide-react';
import { MemoryItem, MemoryTag, CoupleData, Partner } from '../../types';
import { playSound, formatVNDate, calculateTotalDays } from '../../utils/audio';
import { MemoryImageEditor, MemoryImageEditorHandle } from '../common/MemoryImageEditor';
import { memoryService } from '../../services/memoryService';
import { MemoryPhoto } from '../common/MemoryPhoto';

const MAX_BACKEND_IMAGE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const TAG_COLORS: Record<MemoryTag, string> = {
  'Hẹn hò': 'bg-rose-50 text-rose-700 border-rose-200',
  'Kỷ niệm': 'bg-purple-50 text-purple-700 border-purple-200',
  'Du lịch': 'bg-sky-50 text-sky-700 border-sky-200',
  'Đời thường': 'bg-amber-50 text-amber-700 border-amber-200',
  'Khoảnh khắc': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

interface SharedSpaceScreenProps {
  couple: CoupleData;
  memories: MemoryItem[];
  isBackendMode?: boolean;
  isLoadingMemories?: boolean;
  memoriesError?: string;
  onRetryLoadMemories?: () => void;
  onAddMemory: (memory: Omit<MemoryItem, 'id' | 'likes' | 'createdAt'>, imageFile?: File) => Promise<void> | void;
  onEditMemory: (id: string, updated: Partial<MemoryItem>) => void;
  onDeleteMemory: (id: string) => Promise<void> | void;
  onLikeMemory: (id: string) => void;
  onNavigateToHome?: () => void;
}

export const SharedSpaceScreen: React.FC<SharedSpaceScreenProps> = ({
  couple,
  memories,
  isBackendMode = false,
  isLoadingMemories = false,
  memoriesError = '',
  onRetryLoadMemories,
  onAddMemory,
  onEditMemory,
  onDeleteMemory,
  onLikeMemory,
  onNavigateToHome,
}) => {
  const { userA, userB, startDate } = couple;
  const totalDays = calculateTotalDays(startDate);

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [selectedTag, setSelectedTag] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);
  const [deletingMemoryId, setDeletingMemoryId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Add form state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [newCaption, setNewCaption] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newLocation, setNewLocation] = useState<string>('');
  const [newTag, setNewTag] = useState<MemoryTag>('Hẹn hò');
  const editorRef = useRef<MemoryImageEditorHandle>(null);
  const [imageReady, setImageReady] = useState(false);
  const submitLock = useRef(false);
  useEffect(() => () => { if (newImageUrl) URL.revokeObjectURL(newImageUrl); }, [newImageUrl]);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [submissionError, setSubmissionError] = useState('');
  const [isSubmittingMemory, setIsSubmittingMemory] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeletingMemory, setIsDeletingMemory] = useState(false);

  // Edit form state
  const [editCaption, setEditCaption] = useState<string>('');
  const [editLocation, setEditLocation] = useState<string>('');
  const [editTag, setEditTag] = useState<MemoryTag>('Hẹn hò');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2600);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || isSubmittingMemory) return;
    setSubmissionError('');
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      setSubmissionError('Ảnh phải có định dạng PNG, JPEG hoặc WebP.'); return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setSubmissionError('Ảnh gốc tối đa 20MB. Ảnh sau khi crop phải dưới 5MB.'); return;
    }
    setImageReady(false);
    setSelectedImageFile(file);
    setNewImageUrl(URL.createObjectURL(file));
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    playSound('click');
    setNewImageUrl('');
    setSelectedImageFile(null);
    setImageReady(false);
    setSubmissionError('');
    setNewCaption('');
    setNewTag('Hẹn hò');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewLocation('');
    setIsAddModalOpen(true);
  };

  // Submit Add Memory
  const handleSubmitAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImageFile || !imageReady || submitLock.current) {
      return;
    }

    submitLock.current = true;
    setIsSubmittingMemory(true);
    setSubmissionError('');
    try {
      const uploadFile = await editorRef.current!.exportImage();
      if (uploadFile.size > MAX_BACKEND_IMAGE_BYTES) throw new Error('Ảnh sau khi crop vượt giới hạn 5MB.');
      const savedImageUrl = isBackendMode ? '' : await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Không thể đọc ảnh đã crop.'));
        reader.readAsDataURL(uploadFile);
      });

      await onAddMemory({
        imageUrl: savedImageUrl,
        caption: newCaption.trim() || 'Một khoảnh khắc đáng nhớ của hai đứa.',
        date: newDate,
        location: newLocation.trim() || 'Nơi hẹn hò thân quen',
        tag: newTag,
        authorName: userA.name,
        authorAvatar: userA.avatar,
      }, uploadFile || undefined);

      setIsAddModalOpen(false);
      setSelectedImageFile(null);
      setNewImageUrl('');
      playSound('success');
      showToast(isBackendMode
        ? 'Đã lưu kỷ niệm vào Không gian chung!'
        : 'Đã lưu kỷ niệm vào Không gian chung! (+10 Love Points 🌱)');
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Không thể lưu kỷ niệm. Vui lòng thử lại.');
      playSound('error');
    } finally {
      submitLock.current = false;
      setIsSubmittingMemory(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (mem: MemoryItem) => {
    playSound('click');
    setEditingMemory(mem);
    setEditCaption(mem.caption);
    setEditLocation(mem.location || '');
    setEditTag(mem.tag);
    if (selectedMemory) setSelectedMemory(null);
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemory) return;

    onEditMemory(editingMemory.id, {
      caption: editCaption.trim(),
      location: editLocation.trim(),
      tag: editTag,
    });

    setEditingMemory(null);
    playSound('success');
    showToast('Đã cập nhật kỷ niệm thành công!');
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingMemoryId) return;
    const target = memories.find(m => m.id === deletingMemoryId);
    if (isBackendMode && target && target.isMyMemory === false) {
      setDeleteError(`Chỉ người đăng (${target.authorName}) mới có quyền xóa ảnh này.`);
      return;
    }
    setIsDeletingMemory(true);
    setDeleteError('');
    try {
      await onDeleteMemory(deletingMemoryId);
      setDeletingMemoryId(null);
      if (selectedMemory && selectedMemory.id === deletingMemoryId) {
        setSelectedMemory(null);
      }
      playSound('click');
      showToast('Đã xóa kỷ niệm khỏi Không gian chung.');
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Không thể xóa kỷ niệm. Vui lòng thử lại.');
      playSound('error');
    } finally {
      setIsDeletingMemory(false);
    }
  };

  // Filter memories
  const filteredMemories = memories.filter((mem) => {
    const matchesTag = selectedTag === 'Tất cả' || mem.tag === selectedTag;
    const matchesSearch = 
      mem.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mem.location && mem.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      mem.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const totalLikes = memories.reduce((acc, m) => acc + (m.likes || 0), 0);

  return (
    <div className="space-y-4 pb-28 pt-2 text-stone-800 select-none">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER & SPACE SUMMARY                                     */}
      {/* ------------------------------------------------------------- */}
      <div className="mx-4 bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-rose-100 block">
                Shared Space
              </span>
              <h2 className="text-base font-bold font-serif-romantic text-white">
                Kho Kỷ Niệm Tình Yêu
              </h2>
            </div>
          </div>
          <div className="flex items-center -space-x-2">
            <img src={userA.avatar} alt={userA.name} className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-2xs" />
            <img src={userB.avatar} alt={userB.name} className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-2xs" />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/20 text-center relative z-10">
          <div className="bg-white/15 backdrop-blur-xs rounded-2xl p-2">
            <span className="block text-[10px] text-rose-100">Ảnh kỷ niệm</span>
            <strong className="text-base font-bold text-white">{memories.length}</strong>
          </div>
          <div className="bg-white/15 backdrop-blur-xs rounded-2xl p-2">
            <span className="block text-[10px] text-rose-100">Lượt yêu thích</span>
            <strong className="text-base font-bold text-white">{totalLikes}</strong>
          </div>
          <div className="bg-white/15 backdrop-blur-xs rounded-2xl p-2">
            <span className="block text-[10px] text-rose-100">Bên nhau</span>
            <strong className="text-base font-bold text-white">{totalDays} ngày</strong>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="mx-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2 shadow-xs animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {memoriesError && isBackendMode && (
        <div className="mx-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center justify-between gap-3">
          <span>{memoriesError}</span>
          <button
            type="button"
            onClick={onRetryLoadMemories}
            className="shrink-0 font-bold text-rose-700 underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. ACTION CONTROLS & SEARCH                                   */}
      {/* ------------------------------------------------------------- */}
      <div className="mx-4 space-y-2.5">
        <div className="flex items-center gap-2">
          {/* Main Add Button */}
          <button
            onClick={() => handleOpenAddModal()}
            className="flex-1 min-h-[44px] py-2.5 px-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-rose-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{isBackendMode ? 'Thêm Kỷ Niệm Mới' : 'Thêm Kỷ Niệm Mới (+10 Pts)'}</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200">
            <button
              onClick={() => {
                playSound('click');
                setViewMode('grid');
              }}
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-rose-600 shadow-2xs' : 'text-stone-400 hover:text-stone-600'}`}
              title="Xem dạng lưới ảnh"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                playSound('click');
                setViewMode('timeline');
              }}
              className={`p-2 rounded-xl transition-all ${viewMode === 'timeline' ? 'bg-white text-rose-600 shadow-2xs' : 'text-stone-400 hover:text-stone-600'}`}
              title="Xem dạng dòng thời gian"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2 bg-white rounded-2xl p-2 border border-stone-200/80 shadow-2xs">
          <Search className="w-4 h-4 text-stone-400 ml-1.5 shrink-0" />
          <input
            type="text"
            placeholder="Tìm theo cảm nghĩ, địa điểm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-transparent text-stone-800 placeholder-stone-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {['Tất cả', 'Hẹn hò', 'Kỷ niệm', 'Du lịch', 'Đời thường', 'Khoảnh khắc'].map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => {
                  playSound('click');
                  setSelectedTag(tag);
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-rose-500 text-white shadow-2xs'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. MEMORIES DISPLAY (GRID OR TIMELINE)                        */}
      {/* ------------------------------------------------------------- */}
      {isBackendMode && isLoadingMemories && memories.length === 0 ? (
        <div className="mx-4 py-12 px-6 bg-white/90 rounded-3xl border border-stone-200 text-center space-y-3 shadow-2xs">
          <div className="w-14 h-14 rounded-3xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
            <ImageIcon className="w-7 h-7 animate-pulse" />
          </div>
          <p className="text-xs text-stone-500">Đang tải kỷ niệm của hai bạn...</p>
        </div>
      ) : isBackendMode && memoriesError && memories.length === 0 ? (
        <div className="mx-4 py-8 px-6 bg-white/90 rounded-3xl border border-stone-200 text-center text-xs text-stone-500 shadow-2xs">
          Chưa thể xác định danh sách kỷ niệm. Hãy thử tải lại.
        </div>
      ) : filteredMemories.length === 0 ? (
        /* Empty State */
        <div className="mx-4 py-12 px-6 bg-white/90 rounded-3xl border border-stone-200 text-center space-y-3 shadow-2xs">
          <div className="w-14 h-14 rounded-3xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
            <ImageIcon className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-stone-900 font-serif-romantic">
              Chưa có kỷ niệm nào phù hợp
            </h4>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              Hãy lưu lại những khoảnh khắc đầu tiên của hai bạn vào Không gian chung.
            </p>
          </div>
          <button
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm ảnh kỷ niệm đầu tiên</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (2 Cột hiện đại) */
        <div className="mx-4 grid grid-cols-2 gap-3">
          {filteredMemories.map((mem) => (
            <div
              key={mem.id}
              onClick={() => {
                playSound('click');
                setSelectedMemory(mem);
              }}
              className="bg-white rounded-3xl overflow-hidden border border-stone-200/90 shadow-2xs hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between"
            >
              {/* Photo Image Container */}
              <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
                <MemoryPhoto
                  memoryId={mem.id}
                  imageUrl={mem.imageUrl}
                  alt={mem.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  isBackendMode={isBackendMode}
                  loading="lazy"
                />

                {/* Tag Pill */}
                <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold border backdrop-blur-md shadow-2xs ${TAG_COLORS[mem.tag]}`}>
                  {mem.tag}
                </span>

                {/* Like Button on Image */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playSound('ping');
                    onLikeMemory(mem.id);
                  }}
                  className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-transform active:scale-90 ${
                    mem.isLiked ? 'bg-rose-500 text-white shadow-xs' : 'bg-black/30 hover:bg-black/40 text-white'
                  }`}
                  title="Yêu thích ảnh này"
                >
                  <Heart className={`w-3.5 h-3.5 ${mem.isLiked ? 'fill-white' : ''}`} />
                </button>

                {/* Date Tag */}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/40 text-white text-[9px] font-medium backdrop-blur-xs">
                  {formatVNDate(mem.date)}
                </div>
              </div>

              {/* Caption & Author Info */}
              <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                <p className="text-[11px] font-medium text-stone-800 line-clamp-2 leading-snug">
                  {mem.caption}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[10px] text-stone-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <img
                      src={mem.authorAvatar}
                      alt={mem.authorName}
                      className="w-4 h-4 rounded-full object-cover ring-1 ring-stone-200 shrink-0"
                    />
                    <span className="truncate">{mem.authorName}</span>
                  </div>
                  <span className="flex items-center gap-0.5 text-rose-500 font-semibold shrink-0">
                    <Heart className="w-2.5 h-2.5 fill-rose-500" />
                    <span>{mem.likes}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TIMELINE VIEW (Dòng thời gian lãng mạn) */
        <div className="mx-4 relative pl-5 space-y-5">
          {/* Vertical Timeline Rule */}
          <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-rose-400 via-pink-400 to-purple-400 rounded-full"></div>

          {filteredMemories.map((mem) => (
            <div key={mem.id} className="relative group">
              {/* Timeline Indicator Dot */}
              <div className="absolute -left-[19px] top-4 w-3.5 h-3.5 rounded-full bg-white border-3 border-rose-500 shadow-2xs"></div>

              {/* Memory Card */}
              <div
                onClick={() => {
                  playSound('click');
                  setSelectedMemory(mem);
                }}
                className="bg-white rounded-3xl p-4 border border-stone-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-3"
              >
                {/* Header info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={mem.authorAvatar}
                      alt={mem.authorName}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-rose-300"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 leading-tight">
                        {mem.authorName}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{formatVNDate(mem.date)}</span>
                        </span>
                        {mem.location && (
                          <span className="flex items-center gap-0.5 text-stone-500">
                            <MapPin className="w-2.5 h-2.5 text-rose-500" />
                            <span>{mem.location}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${TAG_COLORS[mem.tag]}`}>
                    {mem.tag}
                  </span>
                </div>

                {/* Photo */}
                <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-stone-100 relative">
                  <MemoryPhoto
                    memoryId={mem.id}
                    imageUrl={mem.imageUrl}
                    alt={mem.caption}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    isBackendMode={isBackendMode}
                  />
                </div>

                {/* Caption */}
                <p className="text-xs text-stone-700 leading-relaxed font-medium">
                  {mem.caption}
                </p>

                {/* Actions bottom bar */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playSound('ping');
                      onLikeMemory(mem.id);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                      mem.isLiked ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${mem.isLiked ? 'fill-rose-500 text-rose-500' : 'text-stone-400'}`} />
                    <span>{mem.likes} Yêu thích</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {!isBackendMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(mem);
                        }}
                        className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
                        title="Sửa ghi chú"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(!isBackendMode || mem.isMyMemory) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteError('');
                          setDeletingMemoryId(mem.id);
                        }}
                        className="p-1.5 rounded-xl hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors"
                        title="Xóa ảnh kỷ niệm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. MODAL: THÊM KỶ NIỆM MỚI (ADD MEMORY)                       */}
      {/* ------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none">
          <div role="dialog" aria-modal="true" aria-labelledby="add-memory-title" className="bg-white rounded-3xl max-w-sm w-full min-w-0 max-h-[90dvh] overflow-hidden flex flex-col shadow-xl border border-rose-100 animate-scale-in">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-rose-50 px-4 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 id="add-memory-title" className="font-serif-romantic text-sm sm:text-base font-bold text-stone-900">
                  Thêm Kỷ Niệm Mới
                </h3>
              </div>
              <button
                disabled={isSubmittingMemory}
                aria-label="Đóng"
                onClick={() => { setIsAddModalOpen(false); setNewImageUrl(''); setSelectedImageFile(null); }}
                className="w-11 h-11 shrink-0 rounded-full text-stone-500 hover:bg-rose-50 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAddMemory} className="flex min-h-0 min-w-0 flex-col text-xs">
              <div className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-3 space-y-3">
              <fieldset disabled={isSubmittingMemory} className="space-y-2 min-w-0">
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-full min-h-11 px-3 py-2 rounded-2xl border border-dashed border-rose-200 bg-rose-50 text-rose-700 font-semibold">
                  {newImageUrl ? 'Đổi ảnh' : 'Tải ảnh từ thiết bị'}
                </button>
                {newImageUrl && <MemoryImageEditor key={newImageUrl} ref={editorRef} src={newImageUrl} disabled={isSubmittingMemory} onReady={setImageReady} />}
                {newImageUrl && !imageReady && <p role="status" className="text-rose-600">Đang đọc ảnh. Nếu ảnh không hiển thị, vui lòng chọn ảnh khác.</p>}
              </fieldset>

              {/* Caption Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-stone-700">
                    Lời nhắn / Cảm xúc:
                  </label>
                  <span className="text-[10px] text-stone-400">{newCaption.length} / 5000</span>
                </div>
                <textarea
                  rows={2}
                  maxLength={5000}
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="Hôm nay hai đứa đã có khoảnh khắc thật đẹp..."
                  className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {/* Metadata row: Location & Date */}
              <div className="grid grid-cols-2 gap-2 [&>div]:min-w-0 [&_input]:min-w-0">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Địa điểm:
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="VD: Bến Bạch Đằng, Q1"
                    className="w-full p-2 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Ngày chụp:
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-2 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              {/* Tag Selection */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Chủ đề:
                </label>
                <select
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value as MemoryTag)}
                  className="w-full p-2 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  <option value="Hẹn hò">Hẹn hò</option>
                  <option value="Kỷ niệm">Kỷ niệm</option>
                  <option value="Du lịch">Du lịch</option>
                  <option value="Đời thường">Đời thường</option>
                  <option value="Khoảnh khắc">Khoảnh khắc</option>
                </select>
              </div>

              {isBackendMode && (
                <p className="text-[10px] text-stone-500 leading-relaxed">
                  Máy chủ hiện lưu ảnh, lời nhắn và ngày đăng. Địa điểm, ngày chụp và chủ đề chỉ lưu trong Demo.
                </p>
              )}

              {/* Submit CTA */}
              {submissionError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submissionError}</span>
                </div>
              )}
              </div>
              <div className="shrink-0 border-t border-rose-100 bg-white px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <button
                  type="submit"
                  disabled={!imageReady || isSubmittingMemory}
                  className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-rose-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isSubmittingMemory
                      ? 'Đang lưu kỷ niệm...'
                      : isBackendMode ? 'Lưu Kỷ Niệm' : 'Lưu Kỷ Niệm (+10 Love Points 🌱)'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. MODAL: XEM ẢNH CHI TIẾT (LIGHTBOX / MEMORY DETAIL)         */}
      {/* ------------------------------------------------------------- */}
      {selectedMemory && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white rounded-3xl max-w-sm w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
            {/* Top action bar on photo */}
            <div className="relative aspect-[4/3] w-full bg-stone-900">
              <MemoryPhoto
                memoryId={selectedMemory.id}
                imageUrl={selectedMemory.imageUrl}
                alt={selectedMemory.caption}
                className="w-full h-full object-contain"
                isBackendMode={isBackendMode}
                loading="eager"
              />
              <button
                onClick={() => setSelectedMemory(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center backdrop-blur-xs transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${TAG_COLORS[selectedMemory.tag]}`}>
                {selectedMemory.tag}
              </span>
            </div>

            {/* Detail Content */}
            <div className="p-4 space-y-3 overflow-y-auto">
              {/* Author & Date */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={selectedMemory.authorAvatar}
                    alt={selectedMemory.authorName}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-rose-400"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 leading-tight">
                      {selectedMemory.authorName}
                    </h4>
                    <p className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1.5">
                      <span>{formatVNDate(selectedMemory.date)}</span>
                      {selectedMemory.location && (
                        <span className="flex items-center gap-0.5 text-stone-500">
                          <MapPin className="w-2.5 h-2.5 text-rose-500" />
                          <span>{selectedMemory.location}</span>
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    playSound('ping');
                    onLikeMemory(selectedMemory.id);
                    setSelectedMemory(prev => prev ? {
                      ...prev,
                      likes: prev.isLiked ? Math.max(0, prev.likes - 1) : prev.likes + 1,
                      isLiked: !prev.isLiked
                    } : null);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-transform active:scale-95 cursor-pointer ${
                    selectedMemory.isLiked ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-stone-100 text-stone-600 hover:bg-rose-50'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${selectedMemory.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{selectedMemory.likes} Yêu thích</span>
                </button>
              </div>

              {/* Caption */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100">
                <p className="text-xs text-stone-700 leading-relaxed font-medium">
                  "{selectedMemory.caption}"
                </p>
              </div>

              {/* Management Actions */}
              <div className="pt-1 border-t border-stone-100">
                {!isBackendMode || selectedMemory.isMyMemory ? (
                  <button
                    onClick={() => {
                      setDeleteError('');
                      setDeletingMemoryId(selectedMemory.id);
                    }}
                    className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa ảnh kỷ niệm này</span>
                  </button>
                ) : (
                  <div className="py-2 px-3 bg-stone-50 text-stone-400 rounded-xl text-[11px] text-center font-medium">
                    Chỉ người đăng ({selectedMemory.authorName}) mới có quyền xóa ảnh này
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. MODAL: SỬA GHI CHÚ KỶ NIỆM (EDIT MEMORY)                  */}
      {/* ------------------------------------------------------------- */}
      {editingMemory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-rose-100 animate-scale-in">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <h3 className="font-serif-romantic text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-rose-500" />
                <span>Chỉnh Sửa Ghi Chú Kỷ Niệm</span>
              </h3>
              <button
                onClick={() => setEditingMemory(null)}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Ghi chú cảm nghĩ:
                </label>
                <textarea
                  rows={3}
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Địa điểm:
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full p-2 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Chủ đề:
                </label>
                <select
                  value={editTag}
                  onChange={(e) => setEditTag(e.target.value as MemoryTag)}
                  className="w-full p-2 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  <option value="Hẹn hò">Hẹn hò</option>
                  <option value="Kỷ niệm">Kỷ niệm</option>
                  <option value="Du lịch">Du lịch</option>
                  <option value="Đời thường">Đời thường</option>
                  <option value="Khoảnh khắc">Khoảnh khắc</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMemory(null)}
                  className="flex-1 py-2 px-3 bg-stone-100 text-stone-700 font-semibold rounded-xl text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. MODAL: XÁC NHẬN XÓA KỶ NIỆM (CONFIRM DELETE)               */}
      {/* ------------------------------------------------------------- */}
      {deletingMemoryId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 space-y-3.5 shadow-xl border border-rose-100 text-center animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif-romantic text-sm font-bold text-stone-900">
                Xóa Ảnh Kỷ Niệm Này?
              </h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Ảnh sẽ được gỡ khỏi Không gian chung của hai bạn. Hành động này không thể hoàn tác.
              </p>
            </div>
            {deleteError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] rounded-xl flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                disabled={isDeletingMemory}
                onClick={() => {
                  setDeleteError('');
                  setDeletingMemoryId(null);
                }}
                className="flex-1 py-2 px-3 bg-stone-100 text-stone-700 font-medium rounded-xl text-xs"
              >
                Giữ lại
              </button>
              <button
                disabled={isDeletingMemory}
                onClick={handleConfirmDelete}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs disabled:opacity-60"
              >
                {isDeletingMemory ? 'Đang xóa...' : 'Xác nhận Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
