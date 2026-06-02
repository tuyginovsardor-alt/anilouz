import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './services/supabaseClient';
import { useNotification } from './hooks/useNotification';
import { getLiveChatMessages, sendLiveChatMessage, uploadFile } from './services/dbService';
import { LiveChatMessage, UserProfile, UserRole } from './types';
import { 
    MessageSquare, Send, Mic, MicOff, Smile, Play, Pause, Trash2, 
    Settings, Users, Shield, Plus, Volume2, VolumeX, ShieldCheck, 
    Calendar, Video, VideoOff, Pin, ThumbsUp, Heart, Star, 
    FolderClosed, Edit3, X, Eye, Lock, Globe, Clock, Sparkles, Check, ChevronRight, UserMinus, UserCheck, AlertCircle
} from 'lucide-react';

// Web Audio API Synthesizer for high-end click / feed notification sounds
const playFrictionSound = (type: 'click' | 'send' | 'receive' | 'join' | 'mute') => {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1000, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'send') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(950, now + 0.12);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'receive') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.setValueAtTime(750, now + 0.08);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'join') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
            osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        } else if (type === 'mute') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        }
    } catch (e) {
        console.warn("Sound generation disabled or failed", e);
    }
};

interface ChatRoom {
    id: string;
    name: string;
    description: string;
    creator_id: string;
    emoji: string;
    is_private?: boolean;
    allowed_roles?: string[];
    expiry_days: number; // custom deletion age max 5
}

interface AdminPermissions {
    canDeleteMessages: boolean;
    canPinMessages: boolean;
    canMuteUsers: boolean;
    canInviteUsers: boolean;
    canEditGroupInfo: boolean;
    canAddAdmins: boolean;
    canStartVideoChat: boolean;
    canSendVoiceNotes: boolean;
    canScheduleMessages: boolean;
    canManageBlockedWords: boolean;
}

const DEFAULT_PERMISSIONS: AdminPermissions = {
    canDeleteMessages: true,
    canPinMessages: true,
    canMuteUsers: true,
    canInviteUsers: true,
    canEditGroupInfo: false,
    canAddAdmins: false,
    canStartVideoChat: true,
    canSendVoiceNotes: true,
    canScheduleMessages: true,
    canManageBlockedWords: false
};

interface ScheduledMessage {
    id: string;
    roomId: string;
    text: string;
    type: 'text' | 'voice';
    voiceUrl?: string;
    voiceDuration?: number;
    sendAt: string; // ISO String
}

export const ChatPage: React.FC = () => {
    const { addNotification } = useNotification();
    const [user, setUser] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    // Channels / Rooms State
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
    const [showNewRoomModal, setShowNewRoomModal] = useState(false);
    
    // New Room Fields
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomDesc, setNewRoomDesc] = useState('');
    const [newRoomEmoji, setNewRoomEmoji] = useState('🔥');
    const [newRoomExpiry, setNewRoomExpiry] = useState(5); // default 5 days
    const [newRoomPrivate, setNewRoomPrivate] = useState(false);

    // Messages state
    const [messages, setMessages] = useState<LiveChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [soundEnabled, setSoundEnabled] = useState(true);

    // UI Panel displays
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showSettingsPanel, setShowSettingsPanel] = useState(false);
    const [showParticipantsPanel, setShowParticipantsPanel] = useState(false);
    const [showScheduleDrawer, setShowScheduleDrawer] = useState(false);

    // Video Chat Lounge state
    const [isVideoChatActive, setIsVideoChatActive] = useState(false);
    const [cameraOn, setCameraOn] = useState(true);
    const [microphoneOn, setMicrophoneOn] = useState(true);
    const [videoParticipants, setVideoParticipants] = useState<any[]>([]);
    const videoCanvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Voice Notes state
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const recordingIntervalRef = useRef<any>(null);
    const [uploadingVoice, setUploadingVoice] = useState(false);
    const [currentlyPlayingAudio, setCurrentlyPlayingAudio] = useState<string | null>(null);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    // Scheduled messages State
    const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
    const [scheduleTime, setScheduleTime] = useState('');
    const [showSchedulePicker, setShowSchedulePicker] = useState(false);

    // Group Management / Admin list
    // Stored as: roomId -> userId -> AdminPermissions
    const [adminRightsMap, setAdminRightsMap] = useState<Record<string, Record<string, AdminPermissions>>>({});
    const [appointedAdmins, setAppointedAdmins] = useState<Record<string, string[]>>({}); // roomId -> userIds list
    const [selectedUserForAdmin, setSelectedUserForAdmin] = useState<UserProfile | null>(null);
    const [showAdminRightsModal, setShowAdminRightsModal] = useState(false);
    const [editingPermissions, setEditingPermissions] = useState<AdminPermissions>(DEFAULT_PERMISSIONS);
    const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);

    const getActiveParticipants = (): UserProfile[] => {
        const uniqueParticipants = new Map<string, UserProfile>();
        if (user && userProfile) {
            uniqueParticipants.set(user.id, userProfile);
        }
        allProfiles.forEach(p => {
            if (p && p.id) uniqueParticipants.set(p.id, p);
        });
        messages.forEach(msg => {
            if (msg && msg.user_id && !uniqueParticipants.has(msg.user_id)) {
                uniqueParticipants.set(msg.user_id, {
                    id: msg.user_id,
                    username: msg.username || 'Animechi',
                    avatar_url: msg.avatar_url || null,
                    role: (msg.role as any) || 'user',
                    full_name: msg.username || 'Foydalanuvchi',
                    email: '',
                    balance: 0,
                    phone: null,
                    short_id: '',
                    email_notifications: true,
                    push_notifications: true,
                    language: 'uz',
                    created_at: msg.created_at || new Date().toISOString(),
                    subscription_plan: null,
                    subscription_end_at: null,
                    free_trial_started_at: null
                });
            }
        });
        return Array.from(uniqueParticipants.values());
    };

    // Muted members
    const [mutedUsers, setMutedUsers] = useState<Record<string, string[]>>({}); // roomId -> userIds

    // Pin feature
    const [pinnedMessages, setPinnedMessages] = useState<Record<string, LiveChatMessage>>({}); // roomId -> message

    // Emoji overlay state
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Play helper respecting user audio preference
    const triggerTone = (sound: 'click' | 'send' | 'receive' | 'join' | 'mute') => {
        if (soundEnabled) playFrictionSound(sound);
    };

    // Load initial user auth
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user: u } }) => {
            if (u) {
                setUser(u);
                supabase.from('profiles').select('*').eq('id', u.id).maybeSingle().then(({ data }) => {
                    if (data) setUserProfile(data);
                });
            }
        });

        // Load rooms from localStorage or create defaults
        const storedRooms = localStorage.getItem('anilo_anime_chat_rooms');
        if (storedRooms) {
            try {
                const parsed = JSON.parse(storedRooms);
                setRooms(parsed);
                if (parsed.length > 0) setActiveRoom(parsed[0]);
            } catch (e) {
                setDefaults();
            }
        } else {
            setDefaults();
        }

        // Load configurations
        const storedAdmins = localStorage.getItem('anilo_anime_chat_admins');
        if (storedAdmins) {
            try { setAppointedAdmins(JSON.parse(storedAdmins)); } catch(e){}
        }
        const storedRights = localStorage.getItem('anilo_anime_chat_rights');
        if (storedRights) {
            try { setAdminRightsMap(JSON.parse(storedRights)); } catch(e){}
        }
        const storedMuted = localStorage.getItem('anilo_anime_chat_muted');
        if (storedMuted) {
            try { setMutedUsers(JSON.parse(storedMuted)); } catch(e){}
        }
        const storedScheduled = localStorage.getItem('anilo_anime_chat_scheduled');
        if (storedScheduled) {
            try { setScheduledMessages(JSON.parse(storedScheduled)); } catch(e){}
        }
        const storedPinned = localStorage.getItem('anilo_anime_chat_pinned');
        if (storedPinned) {
            try { setPinnedMessages(JSON.parse(storedPinned)); } catch(e){}
        }

        // Load fallback user list for admin appointing
        supabase.from('profiles').select('*').limit(30).then(({ data }) => {
            if (data) setAllProfiles(data);
        });
    }, []);

    // Function to initialize standard default anime channels
    const setDefaults = () => {
        const defaults: ChatRoom[] = [
            { id: 'anilo_room_global', name: 'umumiy-muloqot', description: 'Barcha animechilar muloqot markazi va yangiliklar!', creator_id: 'system', emoji: '✨', expiry_days: 5 },
            { id: 'anilo_room_shonen', name: 'shonen-va-muhokama', description: 'Attack on Titan, Naruto, Bleach va boshqalar bo\'yicha suhbat', creator_id: 'system', emoji: '⚔️', expiry_days: 3 },
            { id: 'anilo_room_voice', name: 'ovozli-va-vlog', description: 'Ovozli xabarlar va anime soundtreklar almashish xonasi', creator_id: 'system', emoji: '🎙️', expiry_days: 2 },
            { id: 'anilo_room_memes', name: 'anime-memlar', description: 'Eng kulgili va qiziqarli anime mem xonasi', creator_id: 'system', emoji: '😂', expiry_days: 4 }
        ];
        setRooms(defaults);
        setActiveRoom(defaults[0]);
        localStorage.setItem('anilo_anime_chat_rooms', JSON.stringify(defaults));
    };

    // Save scheduled messages & timer checker
    useEffect(() => {
        localStorage.setItem('anilo_anime_chat_scheduled', JSON.stringify(scheduledMessages));

        // Trigger active timer checker for scheduled messages
        const timer = setInterval(() => {
            const now = new Date();
            const toSend = scheduledMessages.filter(msg => new Date(msg.sendAt) <= now);
            if (toSend.length > 0) {
                toSend.forEach(msg => {
                    // Send this scheduled message
                    const payloadMsg = {
                        text: msg.text,
                        voiceUrl: msg.voiceUrl,
                        voiceDuration: msg.voiceDuration,
                        type: msg.type,
                        isScheduled: true
                    };
                    executeSendMessageRaw(msg.roomId, JSON.stringify(payloadMsg));
                });
                // Remove from local scheduled array
                setScheduledMessages(prev => prev.filter(msg => new Date(msg.sendAt) > now));
            }
        }, 3000);

        return () => clearInterval(timer);
    }, [scheduledMessages]);

    // Save pinned, muted and admin rights when updated
    useEffect(() => {
        if (rooms.length > 0) {
            localStorage.setItem('anilo_anime_chat_rooms', JSON.stringify(rooms));
        }
    }, [rooms]);

    // Active Room subscription & Messages Loading
    useEffect(() => {
        if (!activeRoom) return;

        // Auto-prune old messages for this channel
        pruneOldMessages(activeRoom.id, activeRoom.expiry_days);

        // Load recent chat messages (last 100)
        getLiveChatMessages(activeRoom.id).then(msgList => {
            setMessages(msgList);
            scrollToBottom();
        });

        // Supabase Realtime client connection
        const channel = supabase
            .channel(`live_chat_${activeRoom.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'live_chat_messages',
                filter: `stream_id=eq.${activeRoom.id}`
            }, payload => {
                if (payload.eventType === 'INSERT') {
                    const newMsg = payload.new as LiveChatMessage;
                    setMessages(prev => {
                        // Guard against duplicated messages through connection sync
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                    triggerTone('receive');
                    scrollToBottom();
                } else if (payload.eventType === 'DELETE') {
                    const deletedId = payload.old.id;
                    setMessages(prev => prev.filter(m => m.id !== deletedId));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeRoom]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // Auto delete function inside the app
    const pruneOldMessages = async (roomId: string, days: number) => {
        try {
            const limitDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
            // Perform delete request
            await supabase
                .from('live_chat_messages')
                .delete()
                .eq('stream_id', roomId)
                .lt('created_at', limitDate);
        } catch (e) {
            console.error("Failed to prune old records", e);
        }
    };

    // Custom sound effect helper on click
    const handleButtonClickWithSound = (fn: () => void) => {
        triggerTone('click');
        fn();
    };

    // User Right Checker
    const hasPermission = (userId: string, permission: keyof AdminPermissions): boolean => {
        if (!activeRoom) return false;
        // Group creator/owner has absolute rights
        if (activeRoom.creator_id === userId || userProfile?.role === 'owner' || userProfile?.role === 'admin') return true;
        
        // System defaults rights for everyone
        if (['canSendVoiceNotes', 'canScheduleMessages', 'canInviteUsers'].includes(permission)) {
            return true;
        }

        const roomAdmins = appointedAdmins[activeRoom.id] || [];
        if (!roomAdmins.includes(userId)) return false;

        const roomPermissions = adminRightsMap[activeRoom.id]?.[userId];
        if (roomPermissions) {
            return roomPermissions[permission];
        }
        return DEFAULT_PERMISSIONS[permission];
    };

    // Create a new room
    const handleCreateRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoomName) return;

        const cleanName = newRoomName.trim().toLowerCase().replace(/\s+/g, '-');
        const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        const newRoom: ChatRoom = {
            id: roomId,
            name: cleanName,
            description: newRoomDesc || 'Ushbu xonada muloqot qiziqarli kechishini tiliymiz.',
            creator_id: user?.id || 'system',
            emoji: newRoomEmoji,
            is_private: newRoomPrivate,
            allowed_roles: newRoomPrivate ? ['admin', 'owner'] : undefined,
            expiry_days: Math.min(Math.max(newRoomExpiry, 1), 5) // max 5 days
        };

        const updated = [...rooms, newRoom];
        setRooms(updated);
        localStorage.setItem('anilo_anime_chat_rooms', JSON.stringify(updated));
        setActiveRoom(newRoom);
        setShowNewRoomModal(false);

        // Reset inputs
        setNewRoomName('');
        setNewRoomDesc('');
        setNewRoomEmoji('🔥');
        setNewRoomPrivate(false);
        setNewRoomExpiry(5);

        triggerTone('join');
        addNotification({
            type: 'success',
            title: 'Guruh yaratildi!',
            message: `#${cleanName} xonasi muvaffaqiyatli ochildi.`
        });
    };

    // Deleting complete room
    const handleDeleteRoom = (roomId: string) => {
        if (window.confirm("Haqiqatan ham ushbu xonani o'chirmoqchimisiz?")) {
            const filtered = rooms.filter(r => r.id !== roomId);
            setRooms(filtered);
            localStorage.setItem('anilo_anime_chat_rooms', JSON.stringify(filtered));
            
            // Clean related messages in supabase
            supabase.from('live_chat_messages').delete().eq('stream_id', roomId).then(() => {
                if (activeRoom?.id === roomId && filtered.length > 0) {
                    setActiveRoom(filtered[0]);
                }
            });

            triggerTone('mute');
            addNotification({
                type: 'info',
                title: 'O\'chirildi',
                message: 'Chat xonasi butunlay olib tashlandi.'
            });
        }
    };

    // Raw message posting to supabase
    const executeSendMessageRaw = async (roomId: string, messageBody: string) => {
        if (!user) {
            addNotification({ type: 'warning', title: 'Kirish', message: 'Muloqot qilish uchun tizimga kiring.' });
            return;
        }

        try {
            const chatMsgPayload = {
                stream_id: roomId,
                user_id: user.id,
                username: userProfile?.username || user.email?.split('@')[0] || 'Animechi',
                avatar_url: userProfile?.avatar_url || '',
                message: messageBody,
                role: userProfile?.role || 'user',
                created_at: new Date().toISOString()
            };

            await sendLiveChatMessage(chatMsgPayload);
            triggerTone('send');
        } catch (e) {
            console.error("Send failed", e);
            addNotification({ type: 'error', title: 'Xatolik', message: 'Xabarni yuborishda xato kechdi.' });
        }
    };

    // Message Send Handler
    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputText.trim()) return;

        // Check is muted
        if (activeRoom && mutedUsers[activeRoom.id]?.includes(user?.id)) {
            addNotification({ type: 'error', title: 'Cheklangansiz', message: 'Sizning ushbu xonada yozish huquqingiz cheklangan (Mute)!' });
            return;
        }

        const msgString = inputText.trim();
        setInputText('');
        setShowEmojiPicker(false);

        if (showSchedulePicker && scheduleTime) {
            // Rejalashtirilgan xabar
            const sendAtDate = new Date(scheduleTime);
            if (sendAtDate <= new Date()) {
                addNotification({ type: 'warning', title: 'Xatolik', message: 'Kelajakdagi vaqtni belgilang.' });
                return;
            }

            const newScheduled: ScheduledMessage = {
                id: Math.random().toString(36).substring(2, 9),
                roomId: activeRoom!.id,
                text: JSON.stringify({ type: 'text', text: msgString }),
                type: 'text',
                sendAt: sendAtDate.toISOString()
            };

            setScheduledMessages(prev => [...prev, newScheduled]);
            setShowSchedulePicker(false);
            setScheduleTime('');
            
            addNotification({
                type: 'success',
                title: 'Rejalashtirildi!',
                message: `Xabar ruxsat etilgan vaqtda (${sendAtDate.toLocaleTimeString()}) yuboriladi.`
            });
            return;
        }

        // Standard direct text message
        const payload = JSON.stringify({
            type: 'text',
            text: msgString
        });

        if (activeRoom) {
            await executeSendMessageRaw(activeRoom.id, payload);
        }
    };

    // Emoji clicks
    const addEmoji = (em: string) => {
        setInputText(prev => prev + em);
        triggerTone('click');
    };

    // Admin deletion of single messages
    const handleDeleteMessage = async (msgId: string) => {
        if (!user) return;
        if (!hasPermission(user.id, 'canDeleteMessages')) {
            addNotification({ type: 'error', title: 'Taqiqlangan', message: 'Ushbu xabarni o\'chirish huquqingiz yo\'q.' });
            return;
        }

        triggerTone('mute');
        try {
            const { error } = await supabase.from('live_chat_messages').delete().eq('id', msgId);
            if (!error) {
                setMessages(prev => prev.filter(m => m.id !== msgId));
                addNotification({ type: 'info', title: 'O\'chirildi', message: 'Xabar o\'chirib tashlandi.' });
            }
        } catch (e) {
            console.error("Delete err:", e);
        }
    };

    // Message pin handle
    const handlePinMessage = (msg: LiveChatMessage) => {
        if (!user || !activeRoom) return;
        if (!hasPermission(user.id, 'canPinMessages')) {
            addNotification({ type: 'error', title: 'Taqiqlangan', message: 'Xabarlarni qadash ruxsatingiz yo\'q.' });
            return;
        }

        triggerTone('click');
        const nextPinned = { ...pinnedMessages, [activeRoom.id]: msg };
        setPinnedMessages(nextPinned);
        localStorage.setItem('anilo_anime_chat_pinned', JSON.stringify(nextPinned));
        
        // Broadcast System Message that alert group has pinned
        const systemPinAlert = JSON.stringify({
            type: 'system',
            text: `📌 ${msg.username} ning xabari guruh tepasiga qadaldi.`
        });
        executeSendMessageRaw(activeRoom.id, systemPinAlert);

        addNotification({ type: 'success', title: 'Qadaldi', message: 'Xabar guruh tepasiga o\'rnatildi.' });
    };

    const handleUnpin = () => {
        if (!activeRoom) return;
        triggerTone('click');
        const nextPinned = { ...pinnedMessages };
        delete nextPinned[activeRoom.id];
        setPinnedMessages(nextPinned);
        localStorage.setItem('anilo_anime_chat_pinned', JSON.stringify(nextPinned));
    };

    // Recording and saving Voice message Note
    const startRecording = async () => {
        if (!activeRoom) return;
        if (mutedUsers[activeRoom.id]?.includes(user?.id)) {
            addNotification({ type: 'error', title: 'Inkor etildi', message: 'Ovoz yozish ruxsatingiz yo\'q (Mute).' });
            return;
        }

        triggerTone('click');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });

                setUploadingVoice(true);
                addNotification({ type: 'info', title: 'Yuklanmoqda', message: 'Ovozli xabar yuklanmoqda...' });

                try {
                    // Try voice bucket, fallback to posters/anilos3 if unavailable
                    let url = '';
                    try {
                        url = await uploadFile(audioFile, 'voice');
                    } catch (e1) {
                        url = await uploadFile(audioFile, 'posters');
                    }

                    if (showSchedulePicker && scheduleTime) {
                        // Scheduled Voice message
                        const sendAtDate = new Date(scheduleTime);
                        const scheduledVoice: ScheduledMessage = {
                            id: Math.random().toString(36).substring(2, 9),
                            roomId: activeRoom.id,
                            text: JSON.stringify({ type: 'voice', url, duration: recordingTime }),
                            type: 'voice',
                            sendAt: sendAtDate.toISOString()
                        };
                        setScheduledMessages(prev => [...prev, scheduledVoice]);
                        setShowSchedulePicker(false);
                        setScheduleTime('');
                        addNotification({ type: 'success', title: 'Ovozlik rejalashtirildi!', message: 'Ruxsat etilgan vaqtda yuboriladi.' });
                    } else {
                        // Send Voice live inside JSON payload message
                        const payVal = JSON.stringify({
                            type: 'voice',
                            url: url,
                            duration: recordingTime
                        });
                        await executeSendMessageRaw(activeRoom.id, payVal);
                    }
                } catch (err: any) {
                    console.error("Voice upload error", err);
                    addNotification({ type: 'error', title: 'Yuklab bo\'lmadi', message: 'Fayl tizimida xatolik.' });
                } finally {
                    setUploadingVoice(false);
                    setRecordingTime(0);
                }

                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
            setRecordingTime(0);

            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (e) {
            console.error(e);
            addNotification({ type: 'error', title: 'Xatolik', message: 'Mikrofon ruxsati rad etildi!' });
        }
    };

    const stopRecording = () => {
        triggerTone('click');
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        }
    };

    // Voice Play handle
    const togglePlayVoice = (url: string) => {
        triggerTone('click');
        if (currentlyPlayingAudio === url) {
            audioPlayerRef.current?.pause();
            setCurrentlyPlayingAudio(null);
        } else {
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
            }
            const audio = new Audio(url);
            audio.play();
            audioPlayerRef.current = audio;
            setCurrentlyPlayingAudio(url);
            audio.onended = () => {
                setCurrentlyPlayingAudio(null);
            };
        }
    };

    // Appointing and managing intermediate Admin Permissions
    const handleOpenAssignAdmin = (prof: UserProfile) => {
        triggerTone('click');
        setSelectedUserForAdmin(prof);
        
        // See if already has some permission rights
        const existing = adminRightsMap[activeRoom?.id || '']?.[prof.id];
        if (existing) {
            setEditingPermissions(existing);
        } else {
            setEditingPermissions(DEFAULT_PERMISSIONS);
        }
        setShowAdminRightsModal(true);
    };

    const saveAdminPermissions = () => {
        if (!activeRoom || !selectedUserForAdmin) return;

        triggerTone('click');
        const rId = activeRoom.id;
        const uId = selectedUserForAdmin.id;

        // Save maps
        const currentAdmins = appointedAdmins[rId] || [];
        if (!currentAdmins.includes(uId)) {
            currentAdmins.push(uId);
        }

        const nextAdmins = { ...appointedAdmins, [rId]: currentAdmins };
        const nextRights = { 
            ...adminRightsMap, 
            [rId]: { 
                ...(adminRightsMap[rId] || {}), 
                [uId]: editingPermissions 
            } 
        };

        setAppointedAdmins(nextAdmins);
        setAdminRightsMap(nextRights);

        localStorage.setItem('anilo_anime_chat_admins', JSON.stringify(nextAdmins));
        localStorage.setItem('anilo_anime_chat_rights', JSON.stringify(nextRights));

        // System broadcast info message
        const systemAlert = JSON.stringify({
            type: 'system',
            text: `🛡️ ${selectedUserForAdmin.username} ushbu xonada "Administrator" etib tayinlandi.`
        });
        executeSendMessageRaw(activeRoom.id, systemAlert);

        setShowAdminRightsModal(false);
        setSelectedUserForAdmin(null);
        addNotification({
            type: 'success',
            title: 'Muvaffaqiyatli saqlandi',
            message: 'Adminlik huquqlari sozlandi.'
        });
    };

    const removeAdmin = (userId: string, userName: string) => {
        if (!activeRoom) return;
        triggerTone('mute');
        
        const rId = activeRoom.id;
        const currentAdmins = appointedAdmins[rId] || [];
        const nextList = currentAdmins.filter(id => id !== userId);

        const nextAdmins = { ...appointedAdmins, [rId]: nextList };
        const nextRights = { ...adminRightsMap };
        if (nextRights[rId]) {
            delete nextRights[rId][userId];
        }

        setAppointedAdmins(nextAdmins);
        setAdminRightsMap(nextRights);

        localStorage.setItem('anilo_anime_chat_admins', JSON.stringify(nextAdmins));
        localStorage.setItem('anilo_anime_chat_rights', JSON.stringify(nextRights));

        const systemAlert = JSON.stringify({
            type: 'system',
            text: `⚠️ ${userName} guruhda admin huquqlaridan mahrum etildi.`
        });
        executeSendMessageRaw(activeRoom.id, systemAlert);

        addNotification({ type: 'info', title: 'Vakolat olindi', message: 'Admin huquqlari o\'chirildi.' });
    };

    // Muting user from writing messages
    const handleMuteUserToggle = (userId: string, userName: string) => {
        if (!activeRoom) return;
        triggerTone('mute');

        const currentMuted = mutedUsers[activeRoom.id] || [];
        const isCurrentlyMuted = currentMuted.includes(userId);

        let nextList: string[];
        if (isCurrentlyMuted) {
            // Unmute
            nextList = currentMuted.filter(id => id !== userId);
            addNotification({ type: 'success', title: 'Ovoz ochildi (Unmute)', message: `${userName} endi yoza oladi.` });
            
            // System signal
            executeSendMessageRaw(activeRoom.id, JSON.stringify({
                type: 'system',
                text: `🔊 ${userName} ning xabarlar yuborish huquqi tiklandi.`
            }));
        } else {
            // Mute
            nextList = [...currentMuted, userId];
            addNotification({ type: 'info', title: 'Ovoz o\'chirildi (Mute)', message: `${userName} xabar yubora olmaydi.` });

            // System signal
            executeSendMessageRaw(activeRoom.id, JSON.stringify({
                type: 'system',
                text: `🔇 ${userName} tepadagi qoidani buzgani uchun muloqotdan cheklatildi.`
            }));
        }

        const nextMuted = { ...mutedUsers, [activeRoom.id]: nextList };
        setMutedUsers(nextMuted);
        localStorage.setItem('anilo_anime_chat_muted', JSON.stringify(nextMuted));
    };

    // Interactive Video Chat & Canvas Web audio loop representation
    const handleToggleVideoChat = () => {
        triggerTone('join');
        if (isVideoChatActive) {
            setIsVideoChatActive(false);
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        } else {
            if (!hasPermission(user?.id || '', 'canStartVideoChat')) {
                addNotification({ type: 'error', title: 'Inkor etildi', message: 'Video-chat boshlash ruxsatingiz yo\'q!' });
                return;
            }

            setIsVideoChatActive(true);
            
            // Populate video participants
            const fakeParticipants = [
                { id: user?.id || 'host', username: userProfile?.username || 'Siz (Host)', avatar_url: userProfile?.avatar_url || '', color: '#f97316', isMuted: !microphoneOn },
                { id: 'usr_2', username: 'Miku_Hatsune', avatar_url: '', color: '#06b6d4', isMuted: false, audioVal: 0.1 },
                { id: 'usr_3', username: 'Levi_Captain', avatar_url: '', color: '#3b82f6', isMuted: true, audioVal: 0 },
                { id: 'usr_4', username: 'Goku_Ultra', avatar_url: '', color: '#ef4444', isMuted: false, audioVal: 0.4 }
            ];
            setVideoParticipants(fakeParticipants);

            // Synthesize visual spectrum analyzer
            setTimeout(() => {
                if (videoCanvasRef.current) {
                    const canvas = videoCanvasRef.current;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        try {
                            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                            audioContextRef.current = audioCtx;
                        } catch (e) {}

                        const renderSpectrum = () => {
                            if (!canvas || !ctx) return;
                            ctx.fillStyle = '#09090b';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);

                            // Draw glowing grids
                            ctx.strokeStyle = 'rgba(249, 115, 22, 0.08)';
                            ctx.lineWidth = 1;
                            const gridInt = 20;
                            for(let x=0; x<canvas.width; x+=gridInt) {
                                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
                            }
                            for(let y=0; y<canvas.height; y+=gridInt) {
                                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
                            }

                            // Dynamic waves simulating spectrum audio
                            ctx.strokeStyle = 'rgba(249, 115, 22, 0.6)';
                            ctx.shadowColor = '#f97316';
                            ctx.shadowBlur = 10;
                            ctx.lineWidth = 3;
                            ctx.beginPath();
                            const width = canvas.width;
                            const height = canvas.height;
                            const waveNum = 3;

                            for (let w = 0; w < waveNum; w++) {
                                ctx.beginPath();
                                ctx.strokeStyle = w === 0 ? 'rgba(249, 115, 22, 0.7)' : (w === 1 ? 'rgba(147, 51, 234, 0.5)' : 'rgba(59, 130, 246, 0.4)');
                                const speed = Date.now() * 0.004 * (w + 1);
                                for (let i = 0; i < width; i++) {
                                    const amp = 15 + Math.sin(speed * 0.1) * 8;
                                    const y = height / 2 + Math.sin(i * 0.01 + speed) * amp * Math.cos(i * 0.003) * (microphoneOn ? 1 : 0.05);
                                    if (i === 0) ctx.moveTo(i, y);
                                    else ctx.lineTo(i, y);
                                }
                                ctx.stroke();
                            }
                            ctx.shadowBlur = 0; // reset

                            // Add neon technical grid identifiers
                            ctx.fillStyle = '#f97316';
                            ctx.font = '9px monospace';
                            ctx.fillText(`ANIME LINK AUDIO FEED LINK: ACTIVE`, 15, 18);
                            ctx.fillText(`MIC INTENSITY: ${microphoneOn ? 'REALTIME' : 'MUTED'}`, 15, 28);

                            animationFrameRef.current = requestAnimationFrame(renderSpectrum);
                        };
                        renderSpectrum();
                    }
                }
            }, 300);

            // system broadcast alert
            executeSendMessageRaw(activeRoom!.id, JSON.stringify({
                type: 'system',
                text: `📹 ${userProfile?.username || 'Owner'} video chat xonasini muvaffaqiyatli ishga tushirdi!`
            }));
        }
    };

    // Parser for JSON serialized body messages
    const parsePayload = (messageText: string) => {
        try {
            const data = JSON.parse(messageText);
            if (data && typeof data === 'object') {
                return data;
            }
        } catch(e) {}
        // Fallback plain text string
        return { type: 'text', text: messageText };
    };

    // Calculate dynamic styling classes
    const activeAdminList = activeRoom ? (appointedAdmins[activeRoom.id] || []) : [];

    return (
        <div className="flex h-[calc(100vh-6.5rem)] w-full overflow-hidden rounded-[2rem] border border-zinc-900 bg-[#09090b] shadow-2xl relative select-none animate-fade-in text-gray-200">
            
            {/* LEFT SIDEBAR: Channels and Group Actions */}
            <div className={`w-80 border-r border-zinc-900 flex flex-col bg-[#0b0b0d] shrink-0 transition-transform md:translate-x-0 absolute md:relative z-40 h-full ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:block'}`}>
                
                {/* HEAD PAN */}
                <div className="p-5 border-b border-zinc-900 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-orange-600/10 border border-orange-500/20 rounded-xl flex items-center justify-center">
                            <MessageSquare className="text-orange-500" size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-wider text-white">Anilo Chat</h2>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Anime Hamjamiyati</p>
                        </div>
                    </div>

                    {/* Sound Settings Indicator */}
                    <button 
                        onClick={() => handleButtonClickWithSound(() => setSoundEnabled(!soundEnabled))}
                        className={`p-2 rounded-xl border transition-all ${soundEnabled ? 'border-orange-500/10 bg-orange-500/5 text-orange-500' : 'border-zinc-800 text-zinc-600 hover:text-zinc-500'}`}
                        title={soundEnabled ? "Tovushlarni o'chirish" : "Tovushlarni yoqish"}
                    >
                        {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>
                </div>

                {/* CREATOR ACTION */}
                <div className="p-4">
                    <button 
                        onClick={() => handleButtonClickWithSound(() => setShowNewRoomModal(true))}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-3.5 px-4 rounded-xl border border-zinc-800 hover:border-orange-500/30 font-black uppercase text-[10px] tracking-wider transition-all flex items-center justify-center gap-2 group cursor-pointer"
                    >
                        <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                        <span>Yangi Guruh Ochish</span>
                    </button>
                </div>

                {/* ROOMS CHANNELS FEED SCROLLCONTAINER */}
                <div className="flex-1 overflow-y-auto px-3 space-y-1.5 scrollbar-none">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-3 mb-2 mt-2">Muloqot xonalari</p>
                    {rooms.map(room => {
                        const isSelected = activeRoom?.id === room.id;
                        return (
                            <div 
                                key={room.id}
                                onClick={() => handleButtonClickWithSound(() => setActiveRoom(room))}
                                className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-orange-600/10 border border-orange-500/20 text-white' : 'hover:bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border border-transparent'}`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-lg shrink-0">{room.emoji}</span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold truncate leading-tight">#{room.name}</p>
                                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">{room.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <Clock size={11} className="text-zinc-600" />
                                    <span className="text-[9px] font-black text-zinc-600">{room.expiry_days} k</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* FOOTER USER CAP */}
                <div className="p-4 border-t border-zinc-900 bg-zinc-950/40 flex items-center justify-between">
                    {user ? (
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full border border-zinc-800 overflow-hidden bg-zinc-900 shrink-0">
                                {userProfile?.avatar_url ? (
                                    <img src={userProfile.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-black text-xs text-orange-500">
                                        {userProfile?.username?.[0]?.toUpperCase() || 'A'}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-black text-white truncate leading-tight">@{userProfile?.username || 'Animechi'}</p>
                                <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 font-extrabold text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-md">
                                    {userProfile?.role || 'user'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">Mehmon rejimida</p>
                    )}
                </div>
            </div>

            {/* CHAT CENTRE WINDOW: Realtime Chat Core viewport */}
            <div className="flex-1 flex flex-col bg-[#070708] h-full relative overflow-hidden">
                
                {/* ROOM HEADER AND METADATA */}
                <div className="h-16 px-6 border-b border-zinc-900 flex items-center justify-between bg-[#0b0b0d] shrink-0 z-30">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="md:hidden text-zinc-400 p-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
                        >
                            <MessageSquare size={18} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg leading-none">{activeRoom?.emoji}</span>
                                <h1 className="text-sm md:text-base font-black uppercase text-white tracking-tight">
                                    #{activeRoom?.name}
                                </h1>
                            </div>
                            <p className="hidden md:block text-[10px] text-zinc-500 font-bold mt-0.5">{activeRoom?.description}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Video Chat Button activator */}
                        <button 
                            onClick={handleToggleVideoChat}
                            className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border transition-all ${isVideoChatActive ? 'bg-red-600 border-red-500 text-white shadow-lg animate-pulse' : 'bg-[#0f172a] hover:bg-zinc-800 border-zinc-800/80 text-orange-500 hover:text-orange-400'}`}
                        >
                            <Video size={13} fill="currentColor" />
                            <span>{isVideoChatActive ? 'Muloqotni Tugatish' : 'Video Muloqot'}</span>
                        </button>

                        <button 
                            onClick={() => handleButtonClickWithSound(() => setShowParticipantsPanel(!showParticipantsPanel))}
                            className={`p-2 rounded-xl bg-zinc-900 border transition-all ${showParticipantsPanel ? 'border-orange-500 text-orange-500 bg-orange-500/5' : 'border-zinc-800 text-zinc-400 hover:text-white'}`}
                        >
                            <Users size={16} />
                        </button>

                        {/* Settings Button */}
                        <button 
                            onClick={() => handleButtonClickWithSound(() => setShowSettingsPanel(!showSettingsPanel))}
                            className={`p-2 rounded-xl bg-zinc-900 border transition-all ${showSettingsPanel ? 'border-orange-500 text-orange-500 bg-orange-500/5' : 'border-zinc-800 text-zinc-400 hover:text-white'}`}
                        >
                            <Settings size={16} />
                        </button>
                    </div>
                </div>

                {/* PINNED MESSAGE CONSOLE HEADER */}
                {activeRoom && pinnedMessages[activeRoom.id] && (
                    <div className="bg-orange-500/10 border-b border-orange-500/15 px-6 py-2.5 flex items-center justify-between z-20 shrink-0">
                        <div className="flex items-center gap-3">
                            <Pin size={12} className="text-orange-500 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase text-orange-400 leading-none">Qadalgan xabar</p>
                                <p className="text-xs text-zinc-300 truncate mt-0.5 font-bold leading-tight">
                                    {parsePayload(pinnedMessages[activeRoom.id].message).text || 'Ovozli xabar'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={handleUnpin}
                            className="p-1 text-zinc-500 hover:text-white rounded-md transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* VIDEO CHAT LOUNGE ACTIVE SPLIT SCREEN CONTAINER */}
                {isVideoChatActive && (
                    <div className="bg-[#09090b] border-b border-zinc-900 p-4 shrink-0 transition-all z-20">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch h-56">
                            
                            {/* Visual Spectrum audio analyzer screen */}
                            <div className="lg:col-span-2 bg-[#09090b] border border-orange-500/20 rounded-2xl relative overflow-hidden group">
                                <canvas ref={videoCanvasRef} className="w-full h-full block" width={400} height={200} />
                                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#f97316]">EFIR JONLI SENSOR-XIZMATI</span>
                                </div>
                            </div>

                            {/* Controls and attendees bento cell */}
                            <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2">Video konferensiya</h3>
                                    <div className="space-y-1.5 overflow-y-auto max-h-24 scrollbar-none">
                                        {videoParticipants.map(part => (
                                            <div key={part.id} className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-900">
                                                <div className="w-4 h-4 rounded-full flex items-center justify-center font-bold text-[8px] text-white" style={{ backgroundColor: part.color }}>
                                                    {part.username[0]}
                                                </div>
                                                <span className="text-[10px] font-bold text-zinc-300">@{part.username}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Controls panel row */}
                                <div className="flex items-center gap-2 mt-2">
                                    <button 
                                        onClick={() => handleButtonClickWithSound(() => setCameraOn(!cameraOn))}
                                        className={`flex-1 py-1.5 rounded-xl border font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${cameraOn ? 'bg-orange-600/10 border-orange-500/20 text-orange-500' : 'bg-red-950/20 border-red-500/20 text-red-500'}`}
                                    >
                                        <Video size={11} />
                                        <span>Kamera</span>
                                    </button>
                                    <button 
                                        onClick={() => handleButtonClickWithSound(() => setMicrophoneOn(!microphoneOn))}
                                        className={`flex-1 py-1.5 rounded-xl border font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${microphoneOn ? 'bg-orange-600/10 border-orange-500/20 text-orange-500' : 'bg-red-950/20 border-red-500/20 text-red-500'}`}
                                    >
                                        <Mic size={11} />
                                        <span>Mik</span>
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* MESSAGES FLOWSTREAM FEED */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-[1.5rem] flex items-center justify-center mb-4">
                                <MessageSquare className="text-zinc-600 animate-pulse" size={28} />
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-tight">Suhbat hali boshlanmagan</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed mt-2.5">
                                Ushbu xonadagi xabarlar uzoqi {activeRoom?.expiry_days} kunda butunlay o'chib ketadi. Birinchi bo'lib muloqotni boshlang!
                            </p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMe = msg.user_id === user?.id;
                            const payload = parsePayload(msg.message);

                            // System info element style
                            if (payload.type === 'system') {
                                return (
                                    <div key={msg.id || index} className="flex justify-center my-3">
                                        <div className="bg-zinc-950 border border-zinc-900/50 rounded-2xl px-4 py-2 text-[11px] font-bold text-zinc-400 flex items-center gap-2 max-w-md shadow-inner">
                                            <span>{payload.text}</span>
                                        </div>
                                    </div>
                                );
                            }

                            // Scheduled Message indicators
                            const isScheduled = payload.isScheduled;

                            return (
                                <div key={msg.id || index} className={`flex gap-3 max-w-xl group relative ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                                    {/* User Avatar Circle */}
                                    <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0">
                                        {msg.avatar_url ? (
                                            <img src={msg.avatar_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-black text-xs text-orange-400">
                                                {msg.username?.[0]?.toUpperCase() || 'A'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Message Body Block */}
                                    <div className="space-y-1 min-w-0">
                                        <div className={`flex items-center gap-2 ${isMe ? 'justify-end' : ''}`}>
                                            <span className="text-[11px] font-black text-zinc-300">@{msg.username}</span>
                                            {msg.role === 'owner' ? (
                                                <span className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase scale-90">Owner</span>
                                            ) : (msg.role === 'admin' || activeAdminList.includes(msg.user_id) ? (
                                                <span className="bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase scale-90">Admin</span>
                                            ) : null)}
                                        </div>

                                        {/* Real bubble content block packaging */}
                                        <div className={`p-4 rounded-3xl min-w-[120px] shadow-lg ${isMe ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-[#15151a] border border-zinc-900 text-zinc-200 rounded-tl-none'}`}>
                                            
                                            {/* Text message renderer */}
                                            {payload.type === 'text' && (
                                                <p className="text-xs md:text-sm font-bold leading-relaxed whitespace-pre-wrap select-all">
                                                    {payload.text}
                                                </p>
                                            )}

                                            {/* Voice message note renderer */}
                                            {payload.type === 'voice' && (
                                                <div className="flex items-center gap-3.5 py-1 min-w-[180px]">
                                                    <button 
                                                        onClick={() => togglePlayVoice(payload.url)}
                                                        className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${isMe ? 'bg-white text-orange-600 border-white' : 'bg-orange-600 text-white border-orange-500'}`}
                                                    >
                                                        {currentlyPlayingAudio === payload.url ? (
                                                            <Pause size={14} fill="currentColor" />
                                                        ) : (
                                                            <Play size={14} fill="currentColor" className="ml-0.5" />
                                                        )}
                                                    </button>
                                                    <div className="flex-1">
                                                        {/* Simple visual sound bars indicator */}
                                                        <div className="flex items-center gap-0.5 h-4 mb-1">
                                                            {Array.from({ length: 15 }).map((_, bIdx) => {
                                                                const hVal = Math.sin(bIdx * 1) * 100;
                                                                return (
                                                                    <div 
                                                                        key={bIdx}
                                                                        className={`w-0.5 rounded-full ${currentlyPlayingAudio === payload.url ? 'animate-pulse' : ''} ${isMe ? 'bg-white/60' : 'bg-orange-500/60'}`}
                                                                        style={{ height: `${20 + Math.abs(hVal) % 60}%` }}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="flex justify-between items-center text-[8px] font-black uppercase opacity-65">
                                                            <span>Ovozli Xabar</span>
                                                            <span>0:{payload.duration < 10 ? '0' + payload.duration : payload.duration}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Clock meta marker segment */}
                                            <div className="flex justify-end items-center gap-1.5 mt-2.5 opacity-50 text-[9px]">
                                                {isScheduled && <Calendar size={9} />}
                                                <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Admin Action Bar overlays shown on hover */}
                                    {user && (
                                        <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${isMe ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'}`}>
                                            {/* Pin element */}
                                            {hasPermission(user.id, 'canPinMessages') && (
                                                <button 
                                                    onClick={() => handlePinMessage(msg)}
                                                    className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-orange-500 rounded-lg transition-colors"
                                                    title="Xabarni qadash"
                                                >
                                                    <Pin size={12} />
                                                </button>
                                            )}
                                            
                                            {/* Delete element */}
                                            {hasPermission(user.id, 'canDeleteMessages') && (
                                                <button 
                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                    className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-500 rounded-lg transition-colors"
                                                    title="Xabarni o'chirish"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* BOTTOM COMPACT FEED INPUT EDITOR PANEL */}
                <div className="p-4 bg-[#0b0b0d] border-t border-zinc-900 shrink-0 z-30">
                    {user ? (
                        <div className="relative">
                            
                            {/* Emoji Palette picker overlay drawer */}
                            {showEmojiPicker && (
                                <div className="absolute bottom-20 left-4 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-2xl z-50 flex flex-wrap gap-2.5 max-w-sm">
                                    {['😀', '😂', '🤣', '🔥', '✨', '🗡️', '🍜', '🍱', '🍙', '👑', '😎', '🦄', '💀', '💖', '👍', '👀', '💢', '🌟', '💔', '🎉'].map(em => (
                                        <button 
                                            key={em} 
                                            onClick={() => addEmoji(em)}
                                            className="text-xl hover:scale-130 transition-transform p-1.5 hover:bg-zinc-900 rounded-lg"
                                        >
                                            {em}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Scheduled date selector bar */}
                            {showSchedulePicker && (
                                <div className="absolute bottom-20 right-4 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-2xl z-50 max-w-xs space-y-3 animate-slide-up">
                                    <h4 className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                                        <Calendar size={13} className="text-orange-500" />
                                        <span>Xabarni Rejalashtirish</span>
                                    </h4>
                                    <input 
                                        type="datetime-local" 
                                        value={scheduleTime} 
                                        onChange={e => setScheduleTime(e.target.value)}
                                        className="w-full bg-zinc-900 text-xs border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-orange-500" 
                                    />
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setShowSchedulePicker(false)}
                                            className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-[9px] font-black uppercase tracking-wider border border-zinc-800 text-zinc-400"
                                        >
                                            Bekor qilish
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if (scheduleTime) {
                                                    addNotification({ type: 'info', title: 'Tayyor', message: 'Reja vaqti belgilandi.' });
                                                }
                                            }}
                                            className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider"
                                        >
                                            OK (Saqlash)
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Main Chat control Form bar */}
                            <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
                                
                                {/* Emoji toggle */}
                                <button 
                                    type="button"
                                    onClick={() => handleButtonClickWithSound(() => setShowEmojiPicker(!showEmojiPicker))}
                                    className={`p-3.5 rounded-xl border transition-all ${showEmojiPicker ? 'border-orange-500 bg-orange-500/5 text-orange-500' : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'}`}
                                >
                                    <Smile size={18} />
                                </button>

                                {/* Scheduled Message Toggle */}
                                <button 
                                    type="button"
                                    onClick={() => handleButtonClickWithSound(() => setShowSchedulePicker(!showSchedulePicker))}
                                    className={`p-3.5 rounded-xl border transition-all ${showSchedulePicker ? 'border-orange-500 bg-orange-500/5 text-orange-500' : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'}`}
                                    title="Xabarni rejalashtirish"
                                >
                                    <Calendar size={18} />
                                </button>

                                {/* Input frame */}
                                <div className="flex-1 relative">
                                    {isRecording ? (
                                        <div className="w-full bg-red-950/20 border border-red-500/30 rounded-2xl px-5 h-13 flex items-center justify-between text-red-500 animate-pulse text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span>
                                                <span className="font-extrabold uppercase tracking-wider">Ovozli xabar yozilyapti...</span>
                                            </div>
                                            <p className="font-mono font-bold text-sm">
                                                00:{recordingTime < 10 ? '0' + recordingTime : recordingTime}
                                            </p>
                                        </div>
                                    ) : (
                                        <input 
                                            type="text" 
                                            value={inputText}
                                            onChange={e => setInputText(e.target.value)}
                                            placeholder={showSchedulePicker ? "Rejalashtirish xabari matnini kiriting..." : "Animechilar uchun qiziqarli muloqot boshlang..."}
                                            className="w-full bg-zinc-900 border border-zinc-850 focus:border-orange-500 rounded-2xl px-5 h-13 text-xs md:text-sm text-white outline-none placeholder:text-zinc-650 transition-all focus:ring-1 focus:ring-orange-500"
                                        />
                                    )}
                                </div>

                                {/* Voice recorder Microphone or Submit send button */}
                                {inputText.trim() === '' ? (
                                    <button 
                                        type="button"
                                        onClick={isRecording ? stopRecording : startRecording}
                                        disabled={uploadingVoice}
                                        className={`p-3.5 rounded-2xl border transition-all ${isRecording ? 'bg-red-600 border-red-500 text-white shadow-xl animate-bounce' : 'bg-orange-650/10 border-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white'}`}
                                    >
                                        {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                                    </button>
                                ) : (
                                    <button 
                                        type="submit"
                                        className="bg-orange-600 hover:bg-orange-500 text-white p-3.5 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center shrink-0 border border-orange-500"
                                    >
                                        <Send size={18} />
                                    </button>
                                )}
                            </form>
                        </div>
                    ) : (
                        <div className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-2xl text-center">
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2">Mehmon rejimidasiz</p>
                            <span className="text-[11px] text-zinc-600">Yozishmalar muloqotiga kirishish uchun Kirish oynasini oching.</span>
                        </div>
                    )}
                </div>

            </div>

            {/* RIGHT DRAWER: Group Settings & Custom Admin Rights & Scheduled Queue list */}
            {showSettingsPanel && activeRoom && (
                <div className="w-80 border-l border-zinc-900 bg-[#0b0b0d] flex flex-col shrink-0 animate-slide-left z-40 relative">
                    <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/40">
                        <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Shield className="text-orange-500" size={14} />
                            <span>Guruh Boshqaruvi</span>
                        </h3>
                        <button onClick={() => setShowSettingsPanel(false)} className="text-zinc-500 hover:text-white">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-none">
                        
                        {/* Expiry age info */}
                        <div className="bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl">
                            <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1.5">Muddati o'tish qoidasi</h4>
                            <p className="text-[11px] text-zinc-400 leading-normal">
                                Ushbu guruhda xabarlar tarixi unumdorlikni oshirish uchun <span className="text-white font-extrabold">{activeRoom.expiry_days} kunda</span> butunlay o'chib ketadi.
                            </p>
                            
                            {/* Owner can modify days */}
                            {user && (activeRoom.creator_id === user.id || userProfile?.role === 'owner') && (
                                <div className="mt-3.5 pt-3 boundary-t border-zinc-900/80">
                                    <label className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wide">Amal qilish muddati (Kunlar)</label>
                                    <div className="grid grid-cols-5 gap-1.5 mt-2">
                                        {[1, 2, 3, 4, 5].map(day => (
                                            <button 
                                                key={day} 
                                                onClick={() => {
                                                    triggerTone('click');
                                                    const updated = rooms.map(r => r.id === activeRoom.id ? { ...r, expiry_days: day } : r);
                                                    setRooms(updated);
                                                    setActiveRoom({ ...activeRoom, expiry_days: day });
                                                    addNotification({ type: 'success', title: 'O\'zgartirildi', message: `Xabarlar endi ${day} kun saqlanadi.` });
                                                }}
                                                className={`py-1 rounded-lg text-xs font-black border transition-all ${activeRoom.expiry_days === day ? 'bg-orange-600/10 border-orange-500/20 text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-550 hover:text-white'}`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* List of current administrators and right configurations */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1">
                                <ShieldCheck size={12} className="text-green-500" />
                                <span>Guruh Adminlari</span>
                            </h4>
                            {activeAdminList.length === 0 ? (
                                <p className="text-[11px] text-zinc-650 italic leading-snug">Guruhda hali administrator tayinlanmagan.</p>
                            ) : (
                                <div className="space-y-1.5">
                                    {getActiveParticipants().filter(p => activeAdminList.includes(p.id)).map(adm => (
                                        <div key={adm.id} className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-900">
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-white truncate leading-tight">@{adm.username}</p>
                                                <p className="text-[8px] text-zinc-500 font-extrabold uppercase mt-0.5">Admin (Vakolat sozlamalari)</p>
                                            </div>
                                            <div className="flex gap-1.5 shrink-0">
                                                {user && (activeRoom.creator_id === user?.id || userProfile?.role === 'owner') && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleOpenAssignAdmin(adm)}
                                                            className="p-1 text-zinc-400 hover:text-white border border-zinc-800/80 hover:border-zinc-700 bg-zinc-900 rounded-md transition-colors"
                                                            title="Huquqlarni sozlash"
                                                        >
                                                            <Settings size={12} />
                                                        </button>
                                                        <button 
                                                            onClick={() => removeAdmin(adm.id, adm.username)}
                                                            className="p-1 text-red-500 hover:text-red-400 border border-zinc-800/80 bg-zinc-900 rounded-md transition-colors"
                                                            title="Adminlikdan olish"
                                                        >
                                                            <UserMinus size={12} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add Admin Option */}
                        {user && (activeRoom.creator_id === user.id || userProfile?.role === 'owner') && (
                            <div className="space-y-2.5 border-t border-zinc-900/80 pt-4">
                                <h4 className="text-[10px] font-black text-white uppercase tracking-wider">A'zoni administrator qilish</h4>
                                <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-none">
                                    {getActiveParticipants().filter(p => p.id !== user.id && !activeAdminList.includes(p.id)).map(pRef => (
                                        <div 
                                            key={pRef.id}
                                            onClick={() => handleOpenAssignAdmin(pRef)}
                                            className="flex items-center justify-between p-2 bg-zinc-950 hover:bg-zinc-900 rounded-xl cursor-pointer border border-zinc-900 transition-colors"
                                        >
                                            <span className="text-xs font-bold text-zinc-300">@{pRef.username}</span>
                                            <span className="text-[9px] font-black text-orange-500 uppercase tracking-wider">Tayinlash</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Owner Group deletion rule */}
                        {user && (activeRoom.creator_id === user.id || userProfile?.role === 'owner') && activeRoom.id !== 'anilo_room_global' && (
                            <div className="pt-4 border-t border-zinc-900/60">
                                <button 
                                    onClick={() => handleDeleteRoom(activeRoom.id)}
                                    className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-500 py-3 rounded-xl border border-red-500/10 font-black uppercase text-[10px] tracking-wide transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <Trash2 size={13} />
                                    <span>Guruhni Tarqatib yuborish</span>
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* PARTICIPANTS LIST DRAWER PANE */}
            {showParticipantsPanel && activeRoom && (
                <div className="w-80 border-l border-zinc-900 bg-[#0b0b0d] flex flex-col shrink-0 animate-slide-left z-40 relative">
                    <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/40">
                        <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Users className="text-orange-500" size={14} />
                            <span>Guruh A'zolari</span>
                        </h3>
                        <button onClick={() => setShowParticipantsPanel(false)} className="text-zinc-500 hover:text-white">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
                        <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wide">Guruhdagi Ishtirokchilar</p>
                        <div className="space-y-2">
                            {getActiveParticipants().map(prof => {
                                const isMuted = mutedUsers[activeRoom.id]?.includes(prof.id);
                                const isAdmin = activeAdminList.includes(prof.id) || activeRoom.creator_id === prof.id;
                                return (
                                    <div key={prof.id} className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-900">
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-white truncate">@{prof.username}</p>
                                            <span className="text-[8px] mt-0.5 inline-block text-zinc-500 uppercase tracking-wider">
                                                {prof.role || 'user'} {isMuted ? '• Muted' : ''}
                                            </span>
                                        </div>

                                        {/* Actions to Mute / Restrict */}
                                        {user && hasPermission(user.id, 'canMuteUsers') && prof.id !== user.id && prof.id !== activeRoom.creator_id && (
                                            <button 
                                                onClick={() => handleMuteUserToggle(prof.id, prof.username)}
                                                className={`px-2 py-1 rounded-lg text-[8px] font-black border uppercase tracking-wider transition-all ${isMuted ? 'bg-green-600/10 border-green-500/20 text-green-400' : 'bg-red-650/10 border-red-500/20 text-red-400'}`}
                                            >
                                                {isMuted ? 'Ovozini ochish' : 'Mute qilish'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* HIGH-END APPOINTMENT RIGHTS PANEL MODAL (10 Permission points configuration) */}
            {showAdminRightsModal && selectedUserForAdmin && activeRoom && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
                    <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative animate-scale-in">
                        
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">Admin Huquqlari</h3>
                                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-0.5">@{selectedUserForAdmin.username} guruh admini</p>
                            </div>
                            <button 
                                onClick={() => handleButtonClickWithSound(() => setShowAdminRightsModal(false))}
                                className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* List of 10 permissions */}
                        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 scrollbar-none mb-6">
                            
                            {/* Option 1 */}
                            <div className="flex items-center justify-between p-3.5 bg-zinc-900/50 border border-zinc-900 rounded-xl">
                                <div>
                                    <p className="text-xs font-black text-white leading-normal">Xabarlarni O'chirish (Delete message)</p>
                                    <p className="text-[9px] text-zinc-500 leading-snug">Guruhdagi boshqalarning xabarlarini butunlay o'chira olish.</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={editingPermissions.canDeleteMessages}
                                    onChange={e => setEditingPermissions({ ...editingPermissions, canDeleteMessages: e.target.checked })}
                                    className="w-4 h-4 rounded text-orange-600 border-zinc-700 bg-zinc-800 outline-none"
                                />
                            </div>

                            {/* Option 2 */}
                            <div className="flex items-center justify-between p-3.5 bg-zinc-900/50 border border-zinc-900 rounded-xl">
                                <div>
                                    <p className="text-xs font-black text-white leading-normal">Xabarlarni qadash (Pin messages)</p>
                                    <p className="text-[9px] text-zinc-500 leading-snug">Xabarlarni tepadagi e'lonlar markaziga mahkamlash.</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={editingPermissions.canPinMessages}
                                    onChange={e => setEditingPermissions({ ...editingPermissions, canPinMessages: e.target.checked })}
                                    className="w-4 h-4 rounded text-orange-600 border-zinc-700 bg-zinc-800 outline-none"
                                />
                            </div>

                            {/* Option 3 */}
                            <div className="flex items-center justify-between p-3.5 bg-zinc-900/50 border border-zinc-900 rounded-xl">
                                <div>
                                    <p className="text-xs font-black text-white leading-normal">A'zolarni cheklash / mute</p>
                                    <p className="text-[9px] text-zinc-550 leading-snug">Qoida buzganlarni xabar yozishdan cheklab qo'yish.</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={editingPermissions.canMuteUsers}
                                    onChange={e => setEditingPermissions({ ...editingPermissions, canMuteUsers: e.target.checked })}
                                    className="w-4 h-4 rounded text-orange-600 border-zinc-700 bg-zinc-800 outline-none"
                                />
                            </div>

                            {/* Option 4 */}
                            <div className="flex items-center justify-between p-3.5 bg-zinc-900/50 border border-zinc-900 rounded-xl">
                                <div>
                                    <p className="text-xs font-black text-white leading-normal">Taklif qilish huquqi</p>
                                    <p className="text-[9px] text-zinc-500 leading-snug">Yangi anime muxlislarini guruhga taklif eta olish.</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={editingPermissions.canInviteUsers}
                                    onChange={e => setEditingPermissions({ ...editingPermissions, canInviteUsers: e.target.checked })}
                                    className="w-4 h-4 rounded text-orange-600 border-zinc-700 bg-zinc-800 outline-none"
                                />
                            </div>

                            {/* Option 5 */}
                            <div className="flex items-center justify-between p-3.5 bg-zinc-900/50 border border-zinc-900 rounded-xl">
                                <div>
                                    <p className="text-xs font-black text-white leading-normal">Guruh ma'lumotlarini o'zgartirish</p>
                                    <p className="text-[9px] text-zinc-500 leading-snug">Guruh tavsifi va taxalluslarini yuritish.</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={editingPermissions.canEditGroupInfo}
                                    onChange={e => setEditingPermissions({ ...editingPermissions, canEditGroupInfo: e.target.checked })}
                                    className="w-4 h-4 rounded text-orange-600 border-zinc-700 bg-zinc-800 outline-none"
                                />
                            </div>

                            {/* Option 6 */}
                            <div className="flex items-center justify-between p-3.5 bg-zinc-900/50 border border-zinc-900 rounded-xl">
                                <div>
                                    <p className="text-xs font-black text-white leading-normal">Yangi admin qo'shish ruxsati</p>
                                    <p className="text-[9px] text-zinc-500 leading-snug">Boshqa a'zolarni loyihaga administrator qilish.</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={editingPermissions.canAddAdmins}
                                    onChange={e => setEditingPermissions({ ...editingPermissions, canAddAdmins: e.target.checked })}
                                    className="w-4 h-4 rounded text-orange-600 border-zinc-700 bg-zinc-800 outline-none"
                                />
                            </div>

                            {/* Option 7 */}
                            <div className="flex items-center justify-between p-3.5 bg-zinc-900/50 border border-zinc-900 rounded-xl">
                                <div>
                                    <p className="text-xs font-black text-white leading-normal">Video Konferensiya boshlash</p>
                                    <p className="text-[9px] text-zinc-500 leading-snug">Suhbat jamoasiga video-muloqotlarni yaratish huquqi.</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={editingPermissions.canStartVideoChat}
                                    onChange={e => setEditingPermissions({ ...editingPermissions, canStartVideoChat: e.target.checked })}
                                    className="w-4 h-4 rounded text-orange-600 border-zinc-700 bg-zinc-800 outline-none"
                                />
                            </div>

                            {/* Option 8 */}
                            <div className="flex items-center justify-between p-3.5 bg-zinc-900/50 border border-zinc-900 rounded-xl">
                                <div>
                                    <p className="text-xs font-black text-white leading-normal">Ovozli xabar va rasm yuklash</p>
                                    <p className="text-[9px] text-zinc-550 leading-snug">Audio va faza fayllarini uzatish huquqi.</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={editingPermissions.canSendVoiceNotes}
                                    onChange={e => setEditingPermissions({ ...editingPermissions, canSendVoiceNotes: e.target.checked })}
                                    className="w-4 h-4 rounded text-orange-600 border-zinc-700 bg-zinc-800 outline-none"
                                />
                            </div>

                            {/* Option 9 */}
                            <div className="flex items-center justify-between p-3.5 bg-zinc-900/50 border border-zinc-900 rounded-xl">
                                <div>
                                    <p className="text-xs font-black text-white leading-normal">Xabarlarni rejalashtirish (Schedules)</p>
                                    <p className="text-[9px] text-zinc-500 leading-snug">Kelajakdagi vaqtga reja qo'ya olish huquqi.</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={editingPermissions.canScheduleMessages}
                                    onChange={e => setEditingPermissions({ ...editingPermissions, canScheduleMessages: e.target.checked })}
                                    className="w-4 h-4 rounded text-orange-600 border-zinc-700 bg-zinc-800 outline-none"
                                />
                            </div>

                            {/* Option 10 */}
                            <div className="flex items-center justify-between p-3.5 bg-zinc-900/50 border border-zinc-900 rounded-xl">
                                <div>
                                    <p className="text-xs font-black text-white leading-normal">Filtrlar sozlamasini boshqarish</p>
                                    <p className="text-[9px] text-zinc-550 leading-snug">Guruhdagi taqiqlangan terminlar ro'yxatiga kirish.</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={editingPermissions.canManageBlockedWords}
                                    onChange={e => setEditingPermissions({ ...editingPermissions, canManageBlockedWords: e.target.checked })}
                                    className="w-4 h-4 rounded text-orange-600 border-zinc-700 bg-zinc-800 outline-none"
                                />
                            </div>

                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => handleButtonClickWithSound(() => setShowAdminRightsModal(false))}
                                className="flex-1 py-4 bg-zinc-900 text-white font-black text-xs uppercase tracking-wider rounded-2xl border border-zinc-800 text-zinc-400"
                            >
                                Bekor Qilish
                            </button>
                            <button 
                                onClick={saveAdminPermissions}
                                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-wider border border-orange-500 shadow-lg"
                            >
                                Huquqlarni Saqlash
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NEW ROOM MODAL WINDOW DRAW */}
            {showNewRoomModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
                    <form 
                        onSubmit={handleCreateRoom}
                        className="bg-zinc-950 border border-zinc-855 p-7 rounded-[2.5rem] w-full max-w-md shadow-2xl relative animate-scale-in"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Yangi Guruh Ochish</h3>
                            <button 
                                type="button"
                                onClick={() => handleButtonClickWithSound(() => setShowNewRoomModal(false))}
                                className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1.5">Guruh Nomi</label>
                                <input 
                                    type="text" 
                                    value={newRoomName}
                                    onChange={e => setNewRoomName(e.target.value)}
                                    placeholder="Masalan: bepul-suhbat" 
                                    className="w-full bg-[#1e293b]/30 border border-zinc-800 rounded-xl p-3.5 text-xs text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" 
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1.5">Guruhning qisqacha tavsifi</label>
                                <input 
                                    type="text" 
                                    value={newRoomDesc}
                                    onChange={e => setNewRoomDesc(e.target.value)}
                                    placeholder="Guruhimiz qoidalari va yo'riqnomasi..." 
                                    className="w-full bg-[#1e293b]/30 border border-zinc-800 rounded-xl p-3.5 text-xs text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1.5">Guruh belgisi (Emoji)</label>
                                    <select 
                                        value={newRoomEmoji} 
                                        onChange={e => { triggerTone('click'); setNewRoomEmoji(e.target.value); }}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-xs text-white outline-none"
                                    >
                                        {['🔥', '✨', '🗡️', '🍜', '👑', '🌸', '😂', '💀', '🎙️', '🎮', '💡', '🎵'].map(em => (
                                            <option key={em} value={em}>{em} {em === '🔥' ? 'Trend' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="relative">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1.5">Tarix muddati (Maks 5 kun)</label>
                                    <select 
                                        value={newRoomExpiry} 
                                        onChange={e => { triggerTone('click'); setNewRoomExpiry(Number(e.target.value)); }}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-xs text-white outline-none"
                                    >
                                        {[1, 2, 3, 4, 5].map(day => (
                                            <option key={day} value={day}>{day} Kun</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-900">
                                <input 
                                    type="checkbox" 
                                    id="isPrivateCheck"
                                    checked={newRoomPrivate} 
                                    onChange={e => setNewRoomPrivate(e.target.checked)}
                                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                                />
                                <label htmlFor="isPrivateCheck" className="text-xs font-bold text-zinc-300 cursor-pointer select-none">
                                    Faqatgina admin / moderlar uchun (Yopiq)
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                type="button"
                                onClick={() => handleButtonClickWithSound(() => setShowNewRoomModal(false))}
                                className="flex-1 py-4 bg-zinc-900 text-white font-black text-xs uppercase tracking-wider rounded-2xl border border-zinc-800 text-zinc-400"
                            >
                                Bekor qilish
                            </button>
                            <button 
                                type="submit"
                                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-wider border border-orange-500 shadow-xl"
                            >
                                Guruh ochish
                            </button>
                        </div>
                    </form>
                </div>
            )}

        </div>
    );
};
