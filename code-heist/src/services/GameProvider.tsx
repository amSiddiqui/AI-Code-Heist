import { useState, ReactNode, FC } from 'react'; 
import { GameContext } from './GameContext';

interface GameProviderProps {
    children: ReactNode;
}

export const GameProvider: FC<GameProviderProps> = ({ children }) => {
    const [levelCompleted, setLevelCompleted] = useState(false);

    const handleLevelComplete = () => {
        setLevelCompleted((prev) => !prev);
    };

    return (
        <GameContext.Provider value={{ levelCompleted, handleLevelComplete }}>
            {children}
        </GameContext.Provider>
    );
};
