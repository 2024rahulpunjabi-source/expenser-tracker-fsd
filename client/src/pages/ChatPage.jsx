import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Radio, Users, ShieldCheck, Sparkles } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { chatApi } from '../services/api';

export default function ChatPage() {
  const { user } = useAuth();
  const { isConnected, onlineCount, chatMessages, setChatMessages, sendChatMessage } = useSocket();
  const [inputMessage, setInputMessage] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);

  // Load chat history from REST API on initial mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await chatApi.getMessages('general');
        if (res.data.success) {
          setChatMessages(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [setChatMessages]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    sendChatMessage(inputMessage.trim(), 'general');
    setInputMessage('');
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-300">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-sm">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Community & Support Discussion
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Socket.IO
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Instant real-time communication between users and administrators
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          ></span>
          <span className="text-slate-600 dark:text-slate-300">
            {onlineCount} {onlineCount === 1 ? 'user' : 'users'} active
          </span>
        </div>
      </div>

      {/* Messages Viewport */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loadingHistory ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            Loading real-time discussion thread...
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <Sparkles className="w-10 h-10 text-indigo-400 mb-2" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              No messages yet in this room
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Type a message below to test real-time WebSocket delivery!
            </p>
          </div>
        ) : (
          chatMessages.map((msg, index) => {
            const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
            const isAdminMsg = msg.senderRole === 'admin' || msg.sender?.role === 'admin';

            return (
              <div
                key={msg._id || index}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {isMe ? 'You' : msg.senderName || msg.sender?.name || 'User'}
                  </span>
                  {isAdminMsg && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                      <ShieldCheck className="w-2.5 h-2.5" /> Admin
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">
                    {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div
                  className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSend}
        className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3"
      >
        <input
          type="text"
          placeholder={
            isConnected
              ? 'Type a message to broadcast live...'
              : 'Connecting to WebSocket...'
          }
          value={inputMessage}
          disabled={!isConnected}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!isConnected || !inputMessage.trim()}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-40 transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
