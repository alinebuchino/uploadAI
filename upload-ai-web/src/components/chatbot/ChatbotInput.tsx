import React, { forwardRef, useState } from 'react';

interface ChatbotInputProps {
    onSendMessage: (message: string) => void;
    isSending?: boolean;
}

const ChatbotInput = forwardRef<HTMLInputElement, ChatbotInputProps>(({ onSendMessage, isSending }, ref) => {
    const [inputValue, setInputValue] = useState('');

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    const handleSubmit = () => {
        if (isSending || !inputValue.trim()) {
            return;
        }
        onSendMessage(inputValue.trim());
        setInputValue('');
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !isSending) {
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
                disabled={isSending}
            />
            <button
                onClick={handleSubmit}
                disabled={isSending}
            >
                {isSending ? 'Enviando...' : 'Enviar'}
            </button>
        </div>
    );
});

ChatbotInput.displayName = 'ChatbotInput';
export default ChatbotInput;