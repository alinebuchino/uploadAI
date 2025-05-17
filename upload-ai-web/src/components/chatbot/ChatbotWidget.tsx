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
    const [isLoadingBot, setIsLoadingBot] = useState(false);
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
        if (isLoadingBot) return;
        const newUserMessage: Message = { id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, text: userText, sender: 'user' };
        setMessages(prevMessages => [...prevMessages, newUserMessage]);
        getBotResponse(userText);
    };

    const getBotResponse = async (userText: string) => {
        setIsLoadingBot(true);
        let botMessageText = "Desculpe, não consegui processar sua mensagem no momento. Tente novamente mais tarde.";

        try {
            const response = await fetch('http://localhost:3333/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userText }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                if (errorData && errorData.error) {
                    botMessageText = `Erro: ${errorData.error}`;
                } else {
                    botMessageText = `Erro do servidor: ${response.statusText || 'Não foi possível obter resposta.'}`;
                }
                console.error('Erro ao obter resposta do bot:', response.status, errorData || response.statusText);
            } else {
                const data = await response.json();
                botMessageText = data.reply;
            }
        } catch (error) {
            console.error('Falha na comunicação com o backend:', error);
        } finally {
            setIsLoadingBot(false);
            const newBotMessage: Message = {
                id: `bot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                text: botMessageText,
                sender: 'bot'
            };
            setMessages(prevMessages => [...prevMessages, newBotMessage]);
        }
    };

    return (
        <div className="chatbot-widget-container">
            {!isOpen && (
                <button className="chatbot-toggle-button" onClick={toggleChatbot} aria-label="Abrir chat com Nina">
                    <img
                        src="src/img/nina.png"
                        alt="Assistente Nina"
                        className="chatbot-toggle-icon"
                    />
                </button>
            )}
            {isOpen && (
                <ChatbotWindow
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onClose={toggleChatbot}
                    inputRef={inputRef}
                    isSending={isLoadingBot}
                />
            )}
        </div>
    );
};

export default ChatbotWidget;