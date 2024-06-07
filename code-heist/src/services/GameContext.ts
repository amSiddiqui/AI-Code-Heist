import { createContext, useContext } from "react"

interface GameContextType {
    levelCompleted: boolean;
    handleLevelComplete: () => void;
    clearChat: boolean;
    handleClearChat: () => void;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGameContext = (): GameContextType => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error("useGameContext must be used within a GameProvider");
    }
    return context;
}

