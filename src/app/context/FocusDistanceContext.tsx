import {createContext, Dispatch, SetStateAction, useState, ReactNode} from 'react';

interface FocusDistanceContextType {
    focusDistance: number | null;
    setFocusDistance: Dispatch<SetStateAction<number | null>>;
}

export const FocusDistanceContext =
    createContext<FocusDistanceContextType | undefined>(undefined);

export const FocusPointProvider = ({ children } : { children: ReactNode }) => {
    const [focusDistance, setFocusDistance] = useState<number | null>(null);

    return (
        <FocusDistanceContext.Provider value={{ focusDistance, setFocusDistance }}>
            {children}
        </FocusDistanceContext.Provider>
    );
};
