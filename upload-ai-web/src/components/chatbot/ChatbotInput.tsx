// src/components/chatbot/ChatbotInput.tsx
import React, { forwardRef, useState } from 'react';

interface ChatbotInputProps {
    onSendMessage: (message: string) => void;
}

const ChatbotInput = forwardRef<HTMLInputElement, ChatbotInputProps>(({ onSendMessage }, ref) => {
    const [inputValue, setInputValue] = useState('');

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    const handleSubmit = () => {
        if (inputValue.trim()) {
            onSendMessage(inputValue.trim());
            setInputValue('');
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <div className="chatbot-input-area">
            <input
                ref={ref}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua dúvida..."
            />
            <button onClick={handleSubmit}>Enviar</button>
        </div>
    );
});

ChatbotInput.displayName = 'ChatbotInput';
export default ChatbotInput;