import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  Heart, 
  RotateCcw, 
  Smile, 
  Compass, 
  Gift, 
  MessageSquareHeart, 
  Utensils, 
  HelpCircle,
  Copy,
  Check,
  Award,
  KeyRound,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  X,
  ShieldCheck
} from 'lucide-react';
import { CoupleData, ChatMessage } from '../../types';
import { playSound } from '../../utils/audio';
import {
  generateGeminiReply,
  getGeminiApiKey,
  setGeminiApiKey,
  isGeminiConfigured
} from '../../services/geminiService';

interface ChatbotScreenProps {
  couple: CoupleData;
  onEarnPoints?: (amount: number, reason: string) => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_welcome',
    sender: 'bot',
    text: `Chào bạn! Mình là Lovera AI — trợ lý tình yêu thông minh của hai bạn ✨\n\nBạn cần mình gợi ý ý tưởng hẹn hò ngọt ngào, tìm quà tặng bất ngờ, bí quyết làm lành khi dỗi nhau, hay gợi ý món ăn hôm nay? Cứ thoải mái chia sẻ với mình nhé!`,
    timestamp: 'Vừa xong',
    suggestions: [
      '💡 Ý tưởng hẹn hò cuối tuần',
      '🎁 Chọn quà tặng người yêu',
      '💕 Cách làm lành khi người ấy dỗi',
      '🍲 Hôm nay hai đứa ăn món gì?'
    ]
  }
];

const QUICK_TOPICS = [
  { label: '💡 Buổi hẹn lãng mạn', prompt: 'Gợi ý cho mình một buổi hẹn hò cuối tuần lãng mạn và ấm cúng' },
  { label: '🎁 Quà tặng bất ngờ', prompt: 'Gợi ý quà tặng ý nghĩa cho người yêu vào ngày kỷ niệm' },
  { label: '💕 Cách làm lành', prompt: 'Người yêu mình đang dỗi, mình nên nhắn gì để làm lành chân thành nhất?' },
  { label: '🍲 Hôm nay ăn gì?', prompt: 'Gợi ý món ăn tối nay cho hai đứa vừa ngon vừa ấm cúng' },
  { label: '🎲 Câu hỏi thấu hiểu', prompt: 'Cho mình 3 câu hỏi sâu sắc để hai đứa cùng trò chuyện tối nay' },
  { label: '💌 Lời chúc ngọt ngào', prompt: 'Viết cho mình một lời nhắn chúc ngủ ngon thật dễ thương gửi người yêu' },
  { label: '💆 An ủi khi mệt mỏi', prompt: 'Người yêu mình vừa đi làm về mệt, mình nên làm gì để chăm sóc người ấy?' }
];

export const ChatbotScreen: React.FC<ChatbotScreenProps> = ({
  couple,
  onEarnPoints,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('lovera_chat_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback to default
    }
    return INITIAL_MESSAGES;
  });

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(true);
  const [geminiActive, setGeminiActive] = useState<boolean>(() => isGeminiConfigured());
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyText, setShowKeyText] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-hide Gamification Banner after 5 seconds
  useEffect(() => {
    if (!showBanner) return;
    const timer = setTimeout(() => {
      setShowBanner(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [showBanner]);

  useEffect(() => {
    try {
      localStorage.setItem('lovera_chat_history', JSON.stringify(messages));
    } catch {
      // Ignore storage errors
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Intelligent Response Generator based on romantic couple domain
  const generateBotReply = (userQuery: string): { text: string; suggestions: string[] } => {
    const q = userQuery.toLowerCase();

    // 1. Dating Ideas
    if (q.includes('hẹn hò') || q.includes('đi chơi') || q.includes('cuối tuần') || q.includes('buổi hẹn')) {
      return {
        text: `Dưới đây là 3 gợi ý buổi hẹn hò ngọt ngào được thiết kế riêng cho hai bạn:\n\n✨ **1. Workshop Làm Gốm & Cà Phê Chiều:**\nCùng nhau nặn một chiếc cốc đôi khắc tên hai bạn. Vừa rèn luyện tính kiên nhẫn, vừa có kỷ vật lưu giữ mãi về sau!\n\n✨ **2. Picnic Hoàng Hôn Bên Bờ Sông:**\nChuẩn bị một tấm thảm caro, vài chiếc bánh ngọt, trái cây và tai nghe đôi để cùng nghe bản nhạc quen khi hoàng hôn buông xuống.\n\n✨ **3. Rạp Chiếu Phim Tại Gia (Home Cinema):**\nBật đèn vàng ấm, chuẩn bị bắp rang bơ, gối ôm êm ái và chọn một bộ phim tình cảm lãng mạn (gợi ý: *About Time* hoặc *La La Land*).`,
        suggestions: [
          'Chi phí dự kiến cho buổi hẹn này là bao nhiêu?',
          'Nên mặc trang phục gì để chụp ảnh đôi đẹp?',
          'Gợi ý thêm buổi hẹn dành cho ngày mưa'
        ]
      };
    }

    // 2. Gifts
    if (q.includes('quà') || q.includes('tặng') || q.includes('sinh nhật') || q.includes('kỷ niệm')) {
      return {
        text: `Chọn quà tặng người yêu thì "tâm ý và sự tinh tế" luôn là quan trọng nhất! Đây là những gợi ý tuyệt vời:\n\n🎁 **Quà mang dấu ấn cá nhân:**\n• Cuốn album ảnh kỷ niệm in lại những khoảnh khắc đẹp từ Không Gian Chung (Shared Space).\n• Dây chuyền hoặc lắc tay khắc ngày hai bạn chính thức yêu nhau.\n\n🎁 **Quà chăm sóc sức khỏe & tinh thần:**\n• Nến thơm mùi hoa cỏ nhẹ nhàng giúp người ấy thư giãn sau giờ làm.\n• Bình giữ nhiệt khắc tên hoặc máy sấy tóc ion âm bảo vệ tóc.\n\n🎁 **Quà bất ngờ lãng mạn:**\n• Một hộp quà nhỏ giấu 10 lá thư tay với chủ đề "10 lý do mình yêu bạn".`,
        suggestions: [
          'Cách viết thư tay ngắn nhưng chân thành',
          'Cách tạo bất ngờ khi trao quà',
          'Quà tặng cho người thích sự giản dị'
        ]
      };
    }

    // 3. Resolving Conflicts / Making up
    if (q.includes('dỗi') || q.includes('giận') || q.includes('cãi') || q.includes('làm lành') || q.includes('xin lỗi')) {
      return {
        text: `Trong tình yêu, giận dỗi là cơ hội để hai bạn hiểu nhau hơn nếu biết xử lý khéo léo. Hãy áp dụng công thức "3 bước ngọt ngào" này nhé:\n\n1️⃣ **Lắng nghe & Thừa nhận cảm xúc:**\nĐừng vội phân bua đúng sai. Hãy nói: *"Mình biết bạn đang buồn và mình rất trân trọng cảm xúc của bạn."*\n\n2️⃣ **Chủ động mở lời chân thành:**\nMẫu tin nhắn gửi người ấy:\n> *"Em/Anh ơi, mình không thích cảm giác hai đứa giận nhau thế này chút nào. Chiều nay mình mua món bạn thích qua ngồi tâm sự với bạn một chút nhé?"*\n\n3️⃣ **Hành động xoa dịu nhỏ:**\nGửi một cốc trà sữa người ấy thích kèm tờ giấy ghi lời nhắn dễ thương. Khi gặp nhau, một cái ôm thật chặt sẽ giải tỏa 80% cơn giận!`,
        suggestions: [
          'Gợi ý tin nhắn xin lỗi ngắn gọn',
          'Nếu người ấy im lặng không trả lời thì làm sao?',
          'Làm sao để tránh lặp lại mâu thuẫn này?'
        ]
      };
    }

    // 4. Food & Dining
    if (q.includes('ăn gì') || q.includes('món ăn') || q.includes('ăn tối') || q.includes('quán ăn') || q.includes('đói')) {
      return {
        text: `Câu hỏi "huyền thoại" của mọi cặp đôi đây rồi! Hãy để mình gợi ý theo tâm trạng nhé:\n\n🍲 **Nếu muốn ấm cúng & gần gũi:**\nNồi lẩu Haidilao hoặc lẩu nấm nghi ngút khói, vừa gắp đồ ăn cho nhau vừa trò chuyện rôm rả.\n\n🥩 **Nếu muốn lãng mạn & riêng tư:**\nBữa tối bít tết (Steak) hoặc mỳ Ý sốt kem nấm dưới ánh nến lung linh.\n\n🥢 **Nếu muốn thoải mái & vui vẻ:**\nDạo phố ẩm thực đường phố: bánh tráng nướng, ốc nóng, chè khúc bạch, vừa đi vừa nắm tay nhau dạo mát.\n\n🍳 **Ý tưởng tuyệt nhất:**\nCùng nhau vào bếp nấu một bữa cơm giản dị: trứng cuộn, canh sườn chua và cùng rửa bát!`,
        suggestions: [
          'Gợi ý thực đơn tự nấu tại nhà nhanh gọn',
          'Quán cà phê view đẹp để hẹn hò sau khi ăn',
          'Món tráng miệng ngọt ngào cho buổi tối'
        ]
      };
    }

    // 5. Deep Questions / Couple Quiz
    if (q.includes('câu hỏi') || q.includes('thấu hiểu') || q.includes('trò chơi') || q.includes('tâm sự') || q.includes('100')) {
      return {
        text: `Dành 15 phút buổi tối để cùng trả lời 3 câu hỏi này sẽ giúp hai bạn thêm gắn kết sâu sắc:\n\n1. *"Khoảnh khắc nào trong thời gian yêu nhau khiến bạn cảm thấy mình yêu đối phương nhiều nhất?"*\n2. *"Có điều gì bạn đang ấp ủ hoặc lo lắng trong cuộc sống mà bạn chưa có dịp kể cho mình nghe không?"*\n3. *"Nếu được cùng nhau đi du lịch ở bất kỳ nơi nào trên thế giới vào tuần tới, bạn muốn chúng mình đi đâu?"*\n\n💡 **Mẹo:** Hãy lắng nghe trọn vẹn, không phán xét và trao cho nhau một nụ cười ấm áp sau mỗi câu trả lời!`,
        suggestions: [
          'Cho mình thêm 3 câu hỏi vui nhộn nữa',
          'Câu hỏi về tương lai của hai đứa',
          'Cách duy trì sự mới mẻ trong tình yêu'
        ]
      };
    }

    // 6. Sweet Wishes / Messages
    if (q.includes('chúc') || q.includes('lời nhắn') || q.includes('tin nhắn') || q.includes('ngọt ngào') || q.includes('ngủ ngon')) {
      return {
        text: `Đây là những tin nhắn ngọt ngào tan chảy bạn có thể gửi ngay cho người ấy:\n\n🌙 **Chúc ngủ ngon:**\n> *"Hôm nay bạn đã vất vả rồi. Hãy buông hết âu lo và ngủ một giấc thật ngon nhé. Trong giấc mơ mình vẫn ở ngay cạnh bạn đấy. Yêu bạn nhiều! ❤️"*\n\n☀️ **Chào buổi sáng:**\n> *"Chào buổi sáng người đáng yêu nhất quả đất! Chúc bạn một ngày mới ngập tràn năng lượng và nụ cười. Nhớ ăn sáng đầy đủ nhé, lát mình gọi nha! ✨"*\n\n💌 **Bất ngờ giữa ngày:**\n> *"Tự nhiên nhớ bạn quá, chỉ muốn nhắn một câu là mình thấy thật may mắn vì có bạn bên cạnh mỗi ngày."*`,
        suggestions: [
          'Viết lời chúc nhân dịp 100 ngày yêu',
          'Tin nhắn cổ vũ khi người yêu gặp áp lực',
          'Lời chúc sinh nhật lãng mạn'
        ]
      };
    }

    // 7. Comfort / Stress relief
    if (q.includes('mệt') || q.includes('áp lực') || q.includes('stress') || q.includes('buồn') || q.includes('an ủi')) {
      return {
        text: `Khi người yêu mệt mỏi, điều họ cần nhất không phải là lời khuyên hay bài học, mà là **cảm giác được thấu hiểu và an toàn**:\n\n🌿 **Những việc bạn có thể làm ngay:**\n• Chuẩn bị một cốc nước ấm hoặc đồ uống người ấy thích.\n• Nhẹ nhàng mát-xa vai hoặc gội đầu/sấy tóc cho người ấy.\n• Đừng hỏi dồn dập, chỉ cần nói: *"Mình ở đây rồi, nếu muốn kể thì mình nghe, còn nếu mệt thì cứ tựa vào vai mình nghỉ nhé."*\n• Ôm thật lâu trong im lặng — một cái ôm ấm áp kích thích tiết ra oxytocin giúp xoa dịu căng thẳng cực kỳ hiệu quả!`,
        suggestions: [
          'Gợi ý bản nhạc êm dịu để nghe cùng nhau',
          'Nên mua món gì tẩm bổ cho người yêu?',
          'Cách chăm sóc người yêu khi bị ốm'
        ]
      };
    }

    // Default Friendly Romantic AI Response
    return {
      text: `Cảm ơn bạn đã tâm sự với Lovera AI! 💕\n\nĐối với câu hỏi của bạn: *" ${userQuery} "*\n\nTrong tình yêu của hai bạn (${couple.userA.name} & ${couple.userB.name}), điều quan trọng nhất là sự thấu hiểu, trân trọng những điều giản dị và luôn dành thời gian chất lượng cho nhau.\n\nBạn có muốn mình tư vấn cụ thể hơn về khía cạnh này không?`,
      suggestions: [
        '💡 Gợi ý buổi hẹn hò cuối tuần',
        '🎁 Chọn quà tặng người yêu',
        '🎲 Câu hỏi thấu hiểu nhau hơn'
      ]
    };
  };

  const handleOpenKeyModal = () => {
    setApiKeyInput(getGeminiApiKey());
    setShowKeyText(false);
    setSaveStatus(null);
    setIsKeyModalOpen(true);
  };

  const handleSaveKey = () => {
    setGeminiApiKey(apiKeyInput);
    const active = isGeminiConfigured();
    setGeminiActive(active);
    setSaveStatus(active ? 'Đã kích hoạt Gemini AI thành công! ✨' : 'Đã xóa API Key');
    playSound('chime');
    setTimeout(() => {
      setIsKeyModalOpen(false);
      setSaveStatus(null);
    }, 800);
  };

  const handleRemoveKey = () => {
    setGeminiApiKey('');
    setApiKeyInput('');
    setGeminiActive(false);
    setSaveStatus('Đã xóa API Key!');
    playSound('click');
    setTimeout(() => {
      setIsKeyModalOpen(false);
      setSaveStatus(null);
    }, 800);
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isTyping) return;

    playSound('click');
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: 'Vừa xong'
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      const replyData = await generateGeminiReply(
        query,
        updatedMessages,
        couple,
        generateBotReply
      );

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: replyData.text,
        timestamp: 'Vừa xong',
        suggestions: replyData.suggestions,
        isGemini: replyData.isGeminiPowered
      };

      setMessages(prev => [...prev, botMsg]);
      playSound('chime');
      onEarnPoints?.(5, 'Trò chuyện cùng Lovera AI');
    } catch (err) {
      console.error('Error generating reply:', err);
      const fallback = generateBotReply(query);
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: fallback.text,
        timestamp: 'Vừa xong',
        suggestions: fallback.suggestions,
        isGemini: false
      };
      setMessages(prev => [...prev, botMsg]);
      playSound('chime');
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    if (window.confirm('Bạn có muốn làm mới cuộc trò chuyện với Lovera AI không?')) {
      playSound('click');
      setMessages(INITIAL_MESSAGES);
      localStorage.removeItem('lovera_chat_history');
      setShowBanner(true);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    playSound('click');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 select-none pb-[58px] sm:pb-[60px]">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP CHATBOT HEADER                                         */}
      {/* ------------------------------------------------------------- */}
      <header className="px-4 py-3 bg-white/95 backdrop-blur-md border-b border-rose-100 flex items-center justify-between shadow-2xs shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-xs ring-2 ring-rose-200">
              <Bot className="w-5 h-5" />
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${geminiActive ? 'bg-purple-500 animate-pulse' : 'bg-emerald-500'}`}></span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-stone-900 leading-tight">
                Lovera AI Assistant
              </h2>
              <button
                type="button"
                onClick={handleOpenKeyModal}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all cursor-pointer ${
                  geminiActive
                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-200 shadow-2xs hover:border-purple-300'
                    : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                }`}
                title="Cấu hình Google Gemini AI"
              >
                <Sparkles className={`w-2.5 h-2.5 ${geminiActive ? 'text-purple-600' : 'text-stone-400'}`} />
                <span>{geminiActive ? 'Gemini 2.5' : 'Bật Gemini'}</span>
              </button>
            </div>
            <p className="text-[11px] text-stone-500 flex items-center gap-1">
              <span>Trợ lý tình yêu 1:1 cho {couple.userA.name} & {couple.userB.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleOpenKeyModal}
            title="Cài đặt Gemini API Key"
            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors active:scale-95 cursor-pointer ${
              geminiActive
                ? 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-600 shadow-2xs'
                : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-500'
            }`}
          >
            <KeyRound className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetChat}
            title="Làm mới cuộc trò chuyện"
            className="w-8 h-8 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-500 flex items-center justify-center transition-colors active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Gamification Banner (Tự động biến mất sau 5s) */}
      {showBanner && (
        <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50 px-4 py-1.5 border-b border-rose-100/60 flex items-center justify-between text-[11px] text-rose-700 font-medium transition-all duration-500 animate-fade-in">
          <span className="flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-rose-500" />
            <span>Nhận <strong>+5 Love Points</strong> mỗi lượt tâm sự cùng AI</span>
          </span>
          <span className="text-rose-500 font-bold">🌸 Love Garden</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. CHAT MESSAGE THREAD                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div className={`flex items-end gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Avatar */}
                {!isUser ? (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <img
                    src={couple.userA.avatar}
                    alt={couple.userA.name}
                    className="w-7 h-7 rounded-xl object-cover shrink-0 border border-rose-200 shadow-2xs"
                  />
                )}

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs relative group ${
                    isUser
                      ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-br-xs'
                      : 'bg-white text-stone-800 border border-rose-100/80 rounded-bl-xs'
                  }`}
                >
                  {!isUser && msg.isGemini && (
                    <div className="inline-flex items-center gap-1 mb-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-100 via-pink-100 to-rose-100 text-purple-800 text-[10px] font-bold border border-purple-200/60 shadow-2xs">
                      <Sparkles className="w-3 h-3 text-purple-600 animate-spin [animation-duration:4s]" />
                      <span>Gemini Flash</span>
                    </div>
                  )}

                  <div className="whitespace-pre-line font-normal">
                    {msg.text}
                  </div>

                  {/* Copy Button for Bot Messages */}
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-500"
                      title="Sao chép câu trả lời"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Timestamp */}
              <span className={`text-[10px] text-stone-400 px-9 ${isUser ? 'text-right' : 'text-left'}`}>
                {msg.timestamp}
              </span>

              {/* Interactive Suggestions Chips (if provided by bot) */}
              {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                <div className="pl-9 pt-1 flex flex-wrap gap-1.5">
                  {msg.suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(sug)}
                      className="text-[11px] bg-white hover:bg-rose-50 text-rose-600 border border-rose-200/80 rounded-xl px-2.5 py-1 font-medium transition-all active:scale-95 shadow-2xs text-left"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-end gap-2 max-w-[85%]">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-white border border-rose-100 rounded-2xl rounded-bl-xs px-4 py-3 shadow-2xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]"></span>
              <span className="text-[11px] text-stone-400 font-medium ml-1">Lovera AI đang soạn lời khuyên...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. QUICK PROMPT PILLS CAROUSEL                                */}
      {/* ------------------------------------------------------------- */}
      <div className="px-3 py-1.5 bg-white/80 border-t border-rose-100/60 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider shrink-0 pl-1">
          Gợi ý:
        </span>
        {QUICK_TOPICS.map((topic, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(topic.prompt)}
            className="shrink-0 text-[11px] bg-rose-50/70 hover:bg-rose-100/80 text-stone-700 px-2.5 py-1 rounded-xl border border-rose-100 font-medium transition-colors active:scale-95"
          >
            {topic.label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. CHAT INPUT BAR                                             */}
      {/* ------------------------------------------------------------- */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="px-3 py-2 bg-white border-t border-rose-100 flex items-center gap-2 shrink-0"
      >
        <button
          type="button"
          onClick={() => handleSend('Gửi cho mình một lời chúc ngọt ngào bất ngờ nhé ❤️')}
          title="Gửi tim yêu thương"
          className="w-10 h-10 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-colors active:scale-95 shrink-0 border border-rose-100"
        >
          <Heart className="w-5 h-5 fill-rose-500" />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi ý tưởng hẹn hò, quà tặng, tâm sự..."
          className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl px-3.5 py-2.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
        />

        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="w-10 h-10 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-xs active:scale-95 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* ------------------------------------------------------------- */}
      {/* 5. GEMINI API KEY CONFIGURATION MODAL                         */}
      {/* ------------------------------------------------------------- */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-rose-100 overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 p-5 text-white flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white ring-1 ring-white/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-snug">Cấu Hình Google Gemini AI</h3>
                  <p className="text-white/80 text-xs">Trợ lý tình yêu thông minh thế hệ mới</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-3 text-xs text-purple-900 leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-purple-950">Bảo mật thiết bị</p>
                  <p className="text-stone-600 text-[11px] mt-0.5">
                    API key được lưu an toàn trên trình duyệt của bạn và chỉ gửi trực tiếp tới máy chủ Google GenAI khi tạo phản hồi.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Google Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showKeyText ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Dán AIzaSy..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyText(!showKeyText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-stone-500 flex items-center justify-between">
                <span>Chưa có API Key miễn phí?</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-700 font-semibold inline-flex items-center gap-1 underline underline-offset-2"
                >
                  Lấy key tại Google AI Studio
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {saveStatus && (
                <div className="text-center text-xs font-medium text-emerald-600 bg-emerald-50 py-2 rounded-xl border border-emerald-200">
                  {saveStatus}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                {geminiActive && (
                  <button
                    type="button"
                    onClick={handleRemoveKey}
                    className="px-3 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-medium transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  Lưu & Áp Dụng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
