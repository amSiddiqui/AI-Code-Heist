import { useState, ReactNode, FC } from 'react'; 
import { GameContext } from './GameContext';

interface GameProviderProps {
    children: ReactNode;
}

export const GameProvider: FC<GameProviderProps> = ({ children }) => {
    const [levelCompleted, setLevelCompleted] = useState(false);
    const [clearChat, setClearChat] = useState(false);

    const handleLevelComplete = () => {
        setLevelCompleted((prev) => !prev);
    };

    const handleClearChat = () => {
        setClearChat((prev) => !prev)
    };

    return (
        <GameContext.Provider value={{ levelCompleted, handleLevelComplete, clearChat, handleClearChat }}>
            {children}
        </GameContext.Provider>
    );
};
