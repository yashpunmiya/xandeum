'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Bot, User, Loader2, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Plugin for tables, lists, etc.
import { cn } from '@/lib/utils';

type Message = {
    role: 'user' | 'model';
    text: string;
};

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: "Hello! I'm **XandAI**, your intelligent network assistant.  \nAsk me about node stats, network storage, or how Xandeum works!" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setIsLoading(true);

        try {
            // Prepare history for API (excluding the first greeting if needed, but Gemini handles it well)
            // We map our 'model' role to Gemini's 'model' and 'user' to 'user'
            const history = messages.slice(1).map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, history: history })
            });

            const data = await res.json();

            if (data.response) {
                setMessages(prev => [...prev, { role: 'model', text: data.response }]);
            } else {
                setMessages(prev => [...prev, { role: 'model', text: "I didn't receive a response. Please check your connection." }]);
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting to the network right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const suggestedQuestions = [
        "How many nodes are active?",
        "What is the total storage?",
        "Explain Proof of Storage"
    ];

    return (
        <>
            {/* Floating Toggle Button - Pulsing Tech Orb */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-8 right-8 z-[100] group"
                    >
                        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-black/80 backdrop-blur-xl border border-primary/30 shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(34,197,94,0.6)] group-hover:border-primary/60">
                            {/* Rotating Ring */}
                            <div className="absolute inset-0 rounded-full border-t border-r border-primary/40 w-full h-full animate-spin [animation-duration:3s]" />
                            <div className="absolute inset-1 rounded-full border-b border-l border-white/10 w-full h-full animate-spin [animation-duration:5s] direction-reverse" />

                            <MessageCircle size={24} className="text-primary relative z-10 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]" />

                            {/* Notification Dot */}
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-black shadow-[0_0_10px_rgba(234,179,8,0.8)] z-20">1</span>
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window - Holographic Command Interface */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.95, clipPath: "circle(0% at 100% 100%)" }}
                        animate={{ opacity: 1, y: 0, scale: 1, clipPath: "circle(150% at 100% 100%)" }}
                        exit={{ opacity: 0, y: 100, scale: 0.95, clipPath: "circle(0% at 100% 100%)" }}
                        transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                        className="fixed bottom-8 right-8 z-[100] flex h-[650px] w-[90vw] sm:w-[420px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#030303]/90 backdrop-blur-3xl shadow-[-20px_-20px_50px_rgba(0,0,0,0.8)]"
                    >
                        {/* Scanline Effect */}
                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-0 bg-[length:100%_4px,3px_100%] opacity-20" />

                        {/* Decoration: Top Glow */}
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent z-20" />

                        {/* Header */}
                        <div className="relative z-10 flex items-center justify-between border-b border-white/5 bg-white/5 p-4 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 shadow-inner">
                                        <Bot size={20} className="text-primary drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                    </div>
                                    <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-[#0a0a0a] animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm tracking-wide flex items-center gap-2">
                                        XAND<span className="text-primary">AI</span>
                                        <span className="px-1.5 py-0.5 rounded-[4px] bg-primary/10 text-[9px] font-mono text-primary border border-primary/20">BETA</span>
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                                        Neural Network Active
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setMessages([messages[0]])}
                                    className="p-2 text-muted-foreground/50 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                    title="Purge Memory"
                                >
                                    <Sparkles size={16} />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                >
                                    <ChevronDown size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area - Styled like a feed */}
                        <div className="relative z-10 flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {messages.map((msg, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    key={i}
                                    className={cn(
                                        "flex w-full gap-3",
                                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    {/* Avatar */}
                                    <div className={cn(
                                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ring-2 ring-offset-2 ring-offset-black/50 shadow-lg",
                                        msg.role === 'user'
                                            ? "bg-gradient-to-br from-white to-gray-400 border-transparent ring-white/10 text-black"
                                            : "bg-[#0f0f0f] border-primary/30 ring-primary/20 text-primary"
                                    )}>
                                        {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                                    </div>

                                    {/* Bubble */}
                                    <div className={cn(
                                        "max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-lg backdrop-blur-sm border",
                                        msg.role === 'user'
                                            ? "bg-white text-black border-transparent rounded-tr-sm shadow-[0_4px_20px_rgba(255,255,255,0.1)]"
                                            : "bg-[#111]/80 text-gray-200 border-white/5 rounded-tl-sm shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                                    )}>
                                        {msg.role === 'model' && (
                                            <div className="mb-2 flex items-center gap-2 border-b border-white/5 pb-2 opacity-50">
                                                <span className="text-[9px] font-mono uppercase tracking-widest text-primary">System Response</span>
                                            </div>
                                        )}

                                        <div className={cn("prose prose-sm max-w-none break-words", msg.role === 'user' ? "prose-p:text-black" : "prose-invert")}>
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    a: ({ node, ...props }) => <a {...props} className="text-primary hover:underline underline-offset-2 font-bold" target="_blank" rel="noopener noreferrer" />,
                                                    code: ({ node, ...props }) => <code {...props} className="bg-black/30 px-1.5 py-0.5 rounded text-xs font-mono text-yellow-500 border border-white/5" />,
                                                    ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-4 space-y-1 my-2" />,
                                                    li: ({ node, ...props }) => <li {...props} className="marker:text-primary" />
                                                }}
                                            >
                                                {msg.text}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing Indicator */}
                            {isLoading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f0f0f] border border-primary/30 ring-2 ring-primary/20 ring-offset-2 ring-offset-black/50 text-primary">
                                        <Loader2 size={14} className="animate-spin" />
                                    </div>
                                    <div className="bg-[#111]/80 border border-white/5 rounded-2xl rounded-tl-sm p-4 flex items-center gap-1.5 shadow-lg">
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-[bounce_1s_infinite_-0.3s]"></span>
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-[bounce_1s_infinite_-0.15s]"></span>
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-[bounce_1s_infinite]"></span>
                                        <span className="ml-2 text-xs text-muted-foreground font-mono animate-pulse">Computing...</span>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Suggestions */}
                        {messages.length < 3 && !isLoading && (
                            <div className="relative z-10 px-6 pb-2">
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mask-linear-fade">
                                    {suggestedQuestions.map(q => (
                                        <button
                                            key={q}
                                            onClick={() => { setInput(q); }}
                                            className="shrink-0 text-[11px] bg-white/5 hover:bg-primary/20 hover:text-primary hover:border-primary/50 border border-white/10 rounded-lg px-3 py-2 text-gray-400 transition-all font-medium"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="relative z-10 p-4 bg-[#050505] border-t border-white/5">
                            <form onSubmit={handleSubmit} className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition duration-500 blur-sm" />
                                <div className="relative flex items-center gap-2 rounded-xl bg-[#0a0a0a] border border-white/10 p-2 focus-within:border-primary/50 transition-colors">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Enter command or query..."
                                        className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none font-medium"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || isLoading}
                                        className={cn(
                                            "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300",
                                            input.trim() && !isLoading
                                                ? "bg-primary text-black shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:shadow-[0_0_20px_rgba(34,197,94,0.6)] hover:scale-105"
                                                : "bg-white/5 text-muted-foreground cursor-not-allowed"
                                        )}
                                    >
                                        <Send size={16} className={cn(input.trim() && !isLoading ? "-ml-0.5" : "")} />
                                    </button>
                                </div>
                            </form>
                            <div className="mt-2.5 flex justify-between items-center px-1">
                                <div className="flex items-center gap-1.5 opacity-50">
                                    <div className="h-1 w-1 rounded-full bg-green-500" />
                                    <p className="text-[9px] font-mono text-muted-foreground">SYSTEM_READY</p>
                                </div>
                                <p className="text-[9px] text-muted-foreground/40 font-mono tracking-wider">v2.5.0</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
