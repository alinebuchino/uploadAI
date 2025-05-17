// src/components/chatbot/ChatMessage.tsx
import { BotIcon, User } from 'lucide-react';
import React from 'react';

interface ChatMessageProps {
    text: string;
    sender: 'user' | 'bot';
}

const ChatMessage: React.FC<ChatMessageProps> = ({ text, sender }) => {
    const isUser = sender === 'user';
    return (
        <div className={`message-container ${isUser ? 'user-container' : 'bot-container'}`}>
            {!isUser && (
                <div className="avatar bot-avatar">
                    <BotIcon size={24} />
                </div>
            )}
            <div className={`message ${isUser ? 'user-message' : 'bot-message'}`}>
                {text}
            </div>
            {isUser && (
                <div className="avatar user-avatar">
                    <User size={24} />
                </div>
            )}
        </div>
    );
};

export default ChatMessage;