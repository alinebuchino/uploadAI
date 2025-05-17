// src/components/chatbot/ChatbotWindow.tsx
import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatbotInput from './ChatbotInput';

export interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
}

interface ChatbotWindowProps {
    messages: Message[];
    onSendMessage: (messageText: string) => void;
    onClose: () => void;
    inputRef: React.RefObject<HTMLInputElement>;
}

const ChatbotWindow: React.FC<ChatbotWindowProps> = ({ messages, onSendMessage, onClose, inputRef }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    return (
        <div className="chatbot-window">
            <div className="chatbot-header">
                <span>Assistente do UploadAI</span>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>
            <div className="chatbot-messages">
                {messages.map((msg) => (
                    <ChatMessage key={msg.id} text={msg.text} sender={msg.sender} />
                ))}
                <div ref={messagesEndRef} />
            </div>
            <ChatbotInput ref={inputRef} onSendMessage={onSendMessage} />
        </div>
    );
};

export default ChatbotWindow;