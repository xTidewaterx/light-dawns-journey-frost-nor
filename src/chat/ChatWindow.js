'use client';

import { useChat } from '../hooks/useChat';
import { useState } from 'react';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ chatId, currentUserId }) {
  const [text, setText] = useState('');

  const { messages, sendMessage } = useChat(chatId, currentUserId);

  const handleSend = () => {
    const trimmed = text.trim();
    if (trimmed) {
      sendMessage(trimmed);
      setText('');
    }
  };

  if (!chatId || !currentUserId) {
    return (
      <div className="p-4 text-blue-500 italic animate-pulse">
        🔄 Initializing chat...
      </div>
    );
  }

  return (
    <div className="chat-window bg-white rounded-xl shadow-lg p-4 max-w-xl mx-auto space-y-4">
      {/* 📨 Messages area */}
      <div className="messages space-y-2 max-h-80 overflow-y-auto border border-gray-800 rounded-lg p-3 text-white">
        {messages.length > 0 ? (
          messages.map((msg) => (
<MessageBubble
  key={msg.id}
  message={msg}
  currentUserId={currentUserId}
  className={msg.senderId === currentUserId ? 'text-white' : ''}
/>
          ))
        ) : (
          <div className="text-gray-800 italic">
            ✨ No messages yet. Say hi to start the chat!
          </div>
        )}
      </div>

      {/* 🖊️ Input row */}
      <div className="input-row flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow px-4 py-2 rounded-lg border border-gray-800 bg-white text-black focus:ring-2 focus:ring-blue-300 outline-none"
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}