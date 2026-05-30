import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, Loader2, Sparkles, MessageSquare, User } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hi! I'm your ReadySet AI assistant. I can help you manage your stock, routines, and meal plans. How can I assist you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const getAppContext = async () => {
    try {
      const [dash, inv, rec, meal] = await Promise.all([
        fetch('/api/v1/dashboard').then(r => r.json()),
        fetch('/api/v1/inventory').then(r => r.json()),
        fetch('/api/v1/recipes').then(r => r.json()),
        fetch('/api/v1/meal-plans').then(r => r.json())
      ]);
      return JSON.stringify({ dash, inv, rec, meal });
    } catch (e) {
      return "Error fetching context";
    }
  };

  const manageInventory = async (args: any) => {
    await fetch('/api/v1/inventory/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    });
    return "Inventory updated successfully";
  };

  const manageRoutine = async (args: any) => {
    await fetch('/api/v1/routines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    });
    return "Routine updated successfully";
  };

  const manageRecipe = async (args: any) => {
    await fetch('/api/v1/recipes/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    });
    return "Recipe saved successfully";
  };

  const planMeal = async (args: any) => {
    await fetch('/api/v1/meal-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    });
    return "Meal planned successfully";
  };

  const tools = [
    {
      functionDeclarations: [
        {
          name: "getAppContext",
          description: "Get current system state including dashboard, inventory, recipes and plans.",
          parameters: { type: Type.OBJECT, properties: {} }
        },
        {
          name: "manageInventory",
          description: "Add or update items in the inventory stock. Provide name, qty, rate, unit, etc.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              item_name: { type: Type.STRING },
              current_quantity: { type: Type.NUMBER },
              consumption_rate: { type: Type.NUMBER },
              unit: { type: Type.STRING },
              category: { type: Type.STRING },
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              fiber: { type: Type.NUMBER }
            },
            required: ["item_name", "current_quantity", "consumption_rate"]
          }
        },
        {
          name: "manageRoutine",
          description: "Updates routine parameters like departure_time (HH:mm), prep_duration (minutes), or breakfast_duration (minutes).",
          parameters: {
            type: Type.OBJECT,
            properties: {
              departure_time: { type: Type.STRING },
              prep_duration: { type: Type.NUMBER },
              breakfast_duration: { type: Type.NUMBER }
            }
          }
        },
        {
          name: "manageRecipe",
          description: "Creates or updates a recipe. Provide name, duration, calories, steps (array of strings).",
          parameters: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              duration: { type: Type.NUMBER },
              calories: { type: Type.NUMBER },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["name", "duration", "calories", "steps"]
          }
        },
        {
          name: "planMeal",
          description: "Plans a meal for a specific date or day. Provide date string and recipe_id.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              recipe_id: { type: Type.STRING }
            },
            required: ["date", "recipe_id"]
          }
        }
      ]
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: messages.concat(userMessage).map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        })),
        config: {
          systemInstruction: "You are the ReadySet System AI. You help users manage their morning routines, food stock, and nutrition using the provided tools. Be concise, athletic, and encouraging. When users ask to 'make' or 'automate' something, use the tools. You can also answer nutritional or health questions.",
          tools
        }
      });

      let finalResponse = response.text || "";
      const modelContent = response.candidates?.[0]?.content;
      const calls = response.functionCalls;

      if (calls && modelContent) {
        const functionResponses = [];
        for (const call of calls) {
          let result;
          if (call.name === "getAppContext") result = await getAppContext();
          else if (call.name === "manageInventory") result = await manageInventory(call.args);
          else if (call.name === "manageRoutine") result = await manageRoutine(call.args);
          else if (call.name === "manageRecipe") result = await manageRecipe(call.args);
          else if (call.name === "planMeal") result = await planMeal(call.args);
          
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { result }
            }
          });
        }

        const secondResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            ...messages.concat(userMessage).map(m => ({ role: m.role, parts: [{ text: m.content }] })),
            modelContent,
            { role: 'user', parts: functionResponses }
          ],
          config: { tools }
        });
        finalResponse = secondResponse.text || "Action completed!";
      }

      setMessages(prev => [...prev, { role: 'model', content: finalResponse }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I hit an obstacle. Let me try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-slate-200 select-none"
          >
            {/* Header */}
            <div className="p-6 bg-accent-teal text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-white">ReadySet AI</div>
                  <div className="text-[10px] text-white/90 font-bold">System Assistant</div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-white">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    m.role === 'user' 
                      ? "bg-emerald-50 text-slate-900 rounded-tr-none border border-emerald-100 shadow-sm font-semibold" 
                      : "bg-slate-50 rounded-tl-none border border-slate-100 text-slate-900 shadow-sm font-medium"
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 border border-slate-100">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">AI is thinking</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-150">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask'em anything..."
                  className="w-full bg-white rounded-2xl pl-5 pr-12 py-3 outline-none focus:ring-2 focus:ring-accent-teal font-semibold text-sm text-slate-900 placeholder-slate-400 border border-slate-200 transition-all shadow-sm"
                />
                <button 
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-accent-teal text-white rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all border cursor-pointer",
          isOpen ? "bg-white text-accent-teal border-slate-200 rotate-90" : "bg-accent-teal text-white border-transparent"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 text-white" />}
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full border-2 border-white dark:border-zinc-900"
          />
        )}
      </motion.button>
    </div>
  );
}
