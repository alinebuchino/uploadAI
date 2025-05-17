// src/components/chatbot/ChatbotWidget.tsx
import React, { useEffect, useRef, useState } from 'react';
import './Chatbot.css';
import ChatbotWindow, { Message } from './ChatbotWindow';

const ChatbotWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: `bot-initial-${Date.now()}`,
            text: 'Olá! Meu nome é Nina! 👋🏻 Como posso te ajudar hoje?',
            sender: 'bot'
        },
    ]);
    const inputRef = useRef<HTMLInputElement>(null);

    const toggleChatbot = () => {
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSendMessage = (userText: string) => {
        const newUserMessage: Message = { id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, text: userText, sender: 'user' };
        setMessages(prevMessages => [...prevMessages, newUserMessage]);
        getBotResponse(userText);
    };

    const getBotResponse = (userText: string) => {
        const text = userText.toLowerCase().trim();
        let botText = "Desculpe, não entendi. Poderia reformular?";

        if (text.includes("olá") || text.includes("oi") || text.includes("bom dia") || text.includes("boa tarde")) {
            botText = "Olá! Tudo bem? Em que posso ser útil?";
        } else if (text.includes("ajuda") || text.includes("suporte")) {
            botText = "Claro! Qual sua dúvida ou problema?";
        } else if (text.includes("preço") || text.includes("valor") || text.includes("custo")) {
            botText = "Para informações sobre preços, por favor visite nossa página de produtos ou entre em contato com o comercial.";
        } else if (text.includes("obrigado") || text.includes("obrigada")) {
            botText = "De nada! Se precisar de mais alguma coisa, é só chamar. 😊";
        } else if (text.includes("tchau") || text.includes("até mais") || text.includes("adeus")) {
            botText = "Até logo! Tenha um ótimo dia!";
        } else if (text.includes("como você está")) {
            botText = "Estou funcionando perfeitamente, obrigado por perguntar! E você?";
        }

        setTimeout(() => {
            const newBotMessage: Message = { id: `bot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, text: botText, sender: 'bot' };
            setMessages(prevMessages => [...prevMessages, newBotMessage]);
        }, 700);
    };

    return (
        <div className="chatbot-widget-container">
            {!isOpen && (
                <button className="chatbot-toggle-button" onClick={toggleChatbot}>
                    💬
                </button>
            )}
            {isOpen && (
                <ChatbotWindow
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onClose={toggleChatbot}
                    inputRef={inputRef}
                />
            )}
        </div>
    );
};

export default ChatbotWidget;