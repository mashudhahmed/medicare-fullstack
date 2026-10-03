import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import messagesApi from '../api/messages';
import doctorsApi from '../api/doctors';
import patientsApi from '../api/patients';
import type { ChatMessage, ConversationSummary, Doctor, Patient } from '../types';
import {
  FaComments,
  FaPaperPlane,
  FaSearch,
  FaCheck,
  FaCheckDouble,
  FaPlus,
  FaTimes,
  FaArrowLeft,
  FaSyncAlt,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialUserId = searchParams.get('user');

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(initialUserId || null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile layout state
  const [showMobileChat, setShowMobileChat] = useState(false);

  // New Conversation Modal
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableContacts, setAvailableContacts] = useState<
    { id: string; name: string; role: string; subLabel: string; avatar?: string }[]
  >([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef<number>(0);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Derive active partner details with useMemo to avoid cascading re-renders
  const activePartner = useMemo(() => {
    if (!activePartnerId) return null;
    const foundConv = conversations.find((c) => c.user_id === activePartnerId);
    if (foundConv) {
      return {
        id: foundConv.user_id,
        name: foundConv.full_name,
        role: foundConv.role,
        avatar: foundConv.profile_picture,
      };
    }
    const foundContact = availableContacts.find((c) => c.id === activePartnerId);
    if (foundContact) {
      return {
        id: foundContact.id,
        name: foundContact.name,
        role: foundContact.role,
        avatar: foundContact.avatar,
      };
    }
    return null;
  }, [activePartnerId, conversations, availableContacts]);

  // Fetch all conversations with reference preservation to prevent list flickering
  const fetchConversations = useCallback(async () => {
    try {
      const data = await messagesApi.getConversations();
      setConversations((prev) => {
        if (
          prev.length === data.length &&
          prev.every(
            (c, i) =>
              c.user_id === data[i].user_id &&
              c.unread_count === data[i].unread_count &&
              c.last_message === data[i].last_message &&
              c.last_message_at === data[i].last_message_at
          )
        ) {
          return prev;
        }
        return data;
      });
    } catch {
      console.error('Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  // Fetch thread messages for active partner with equality guard to prevent DOM reconstruction
  const fetchThread = useCallback(async (partnerId: string, isSilent = false) => {
    if (!isSilent) setLoadingMessages(true);
    try {
      const data = await messagesApi.getThread(partnerId);
      setMessages((prev) => {
        if (
          prev.length === data.length &&
          prev.every(
            (m, i) =>
              m.id === data[i].id &&
              m.is_read === data[i].is_read &&
              m.content === data[i].content
          )
        ) {
          return prev;
        }
        return data;
      });
    } catch {
      if (!isSilent) toast.error('Failed to load messages');
    } finally {
      if (!isSilent) setLoadingMessages(false);
    }
  }, []);

  // Initial load of conversations
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load contacts for "New Conversation" modal
  useEffect(() => {
    const loadContacts = async () => {
      try {
        if (user?.role === 'patient') {
          // Patients can contact doctors
          const docs = await doctorsApi.getAll();
          const docList = Array.isArray(docs) ? docs : docs.results || [];
          setAvailableContacts(
            docList.map((d: Doctor) => ({
              id: d.user_id || d.user?.id || d.id,
              name: `Dr. ${d.user?.full_name || 'Physician'}`,
              role: 'Doctor',
              subLabel: `${d.specialty} (${d.qualification})`,
              avatar: d.user?.profile_picture,
            }))
          );
        } else {
          // Doctors/admins can contact patients
          const pts = await patientsApi.getAll();
          const ptList = Array.isArray(pts) ? pts : [];
          setAvailableContacts(
            ptList.map((p: Patient) => ({
              id: p.user_id || p.user?.id || p.id,
              name: p.user?.full_name || 'Patient',
              role: 'Patient',
              subLabel: `${p.user?.email || ''} ${p.blood_group ? `| Blood: ${p.blood_group}` : ''}`,
              avatar: p.user?.profile_picture,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load contacts for new chat', err);
      }
    };

    loadContacts();
  }, [user?.role]);

  // When active partner changes: trigger fetchThread only on partner ID switch
  useEffect(() => {
    if (activePartnerId) {
      prevMessagesLengthRef.current = 0;
      fetchThread(activePartnerId, false);
      setShowMobileChat(true);
    } else {
      setMessages([]);
    }
  }, [activePartnerId, fetchThread]);

  // Auto-scroll only when new messages are added
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      scrollToBottom(prevMessagesLengthRef.current === 0 ? 'auto' : 'smooth');
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages.length]);

  // Background polling without setting loading states or resetting references
  useEffect(() => {
    const interval = setInterval(() => {
      if (activePartnerId) {
        fetchThread(activePartnerId, true);
      }
      fetchConversations();
    }, 4000);

    return () => clearInterval(interval);
  }, [activePartnerId, fetchThread, fetchConversations]);

  // Handle Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activePartnerId || sending) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const newMsg = await messagesApi.sendMessage({
        recipient: activePartnerId,
        content: text,
      });

      setMessages((prev) => [...prev, newMsg]);
      fetchConversations();
    } catch {
      toast.error('Failed to send message');
      setInputText(text); // restore
    } finally {
      setSending(false);
    }
  };

  // Filtered conversations
  const filteredConversations = conversations.filter(
    (c) =>
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto h-[calc(100vh-5rem)] flex flex-col space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-lg">
            <FaComments />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Consultation Chat & Follow-Ups</h1>
            <p className="text-xs text-slate-500">Secure real-time telemedicine follow-up communication</p>
          </div>
        </div>

        <button
          onClick={() => setShowNewChatModal(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <FaPlus />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Main 2-Column Chat Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex overflow-hidden">
        {/* Left Column: Conversations List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col shrink-0 ${
            showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search bar */}
          <div className="p-3.5 border-b border-slate-100">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingConversations ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading conversations...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-3">
                <FaComments className="text-3xl mx-auto text-slate-300" />
                <p className="text-xs">No active conversations found.</p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="text-xs text-teal-600 font-semibold hover:underline"
                >
                  Start a new conversation
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = activePartnerId === conv.user_id;
                return (
                  <button
                    key={conv.user_id}
                    onClick={() => {
                      setActivePartnerId(conv.user_id);
                      setShowMobileChat(true);
                    }}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition hover:bg-slate-50 ${
                      isActive ? 'bg-teal-50/70 border-l-4 border-teal-600' : ''
                    }`}
                  >
                    <div className="relative shrink-0">
                      {conv.profile_picture ? (
                        <img
                          src={conv.profile_picture}
                          alt={conv.full_name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm">
                          {conv.full_name.charAt(0)}
                        </div>
                      )}
                      {conv.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span
                          className={`text-xs font-semibold truncate ${
                            isActive ? 'text-teal-900' : 'text-slate-800'
                          }`}
                        >
                          {conv.full_name}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(conv.last_message_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <span className="text-[10px] text-teal-700 font-medium capitalize block mb-0.5">
                        {conv.role}
                      </span>
                      <p
                        className={`text-xs truncate ${
                          conv.unread_count > 0
                            ? 'font-bold text-slate-800'
                            : 'text-slate-500'
                        }`}
                      >
                        {conv.last_message}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Window */}
        <div
          className={`flex-1 flex flex-col ${
            showMobileChat ? 'flex' : 'hidden md:flex'
          }`}
        >
          {activePartnerId ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowMobileChat(false)}
                    className="md:hidden text-slate-500 hover:text-slate-800 p-1"
                  >
                    <FaArrowLeft />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm shrink-0">
                    {activePartner?.avatar ? (
                      <img
                        src={activePartner.avatar}
                        alt={activePartner.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      activePartner?.name.charAt(0) || 'U'
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 leading-tight">
                      {activePartner?.name}
                    </h3>
                    <span className="text-[10px] text-teal-600 font-medium capitalize">
                      {activePartner?.role} • Active Consultation
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchThread(activePartnerId)}
                    className="p-2 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 transition"
                    title="Refresh Messages"
                  >
                    <FaSyncAlt className="text-xs" />
                  </button>
                </div>
              </div>

              {/* Message List Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Loading conversation thread...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <FaComments className="text-3xl text-slate-300" />
                    <p className="text-xs">
                      No messages yet with {activePartner?.name}. Send the first message below.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md lg:max-w-lg rounded-2xl px-4 py-2.5 text-xs shadow-xs space-y-1 ${
                            isMine
                              ? 'bg-teal-600 text-white rounded-br-xs'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          {msg.attachment_url && (
                            <div className="pt-1">
                              <img
                                src={msg.attachment_url}
                                alt="Attachment"
                                className="rounded-lg max-h-48 object-cover border border-white/20"
                              />
                            </div>
                          )}
                          <div
                            className={`flex items-center justify-end gap-1 text-[10px] ${
                              isMine ? 'text-teal-100' : 'text-slate-400'
                            }`}
                          >
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMine && (
                              <span>
                                {msg.is_read ? (
                                  <FaCheckDouble className="text-cyan-200" title="Read" />
                                ) : (
                                  <FaCheck className="text-teal-200" title="Sent" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type your message here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                >
                  <FaPaperPlane />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-2xl">
                <FaComments />
              </div>
              <h3 className="text-base font-bold text-slate-700">Select a Conversation</h3>
              <p className="text-xs max-w-sm">
                Choose an ongoing consultation thread from the left or start a new message with your doctor or patient.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in duration-200">
            <button
              onClick={() => setShowNewChatModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <FaTimes />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-lg">
                <FaPlus />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">New Conversation</h3>
                <p className="text-xs text-slate-500">
                  Select a contact to begin consultation messaging
                </p>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {availableContacts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No contacts available to message.
                </div>
              ) : (
                availableContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => {
                      setActivePartnerId(contact.id);
                      setShowNewChatModal(false);
                      setShowMobileChat(true);
                    }}
                    className="w-full text-left p-3 hover:bg-slate-50 flex items-center gap-3 transition rounded-xl"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                      {contact.avatar ? (
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        contact.name.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {contact.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {contact.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{contact.subLabel}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
