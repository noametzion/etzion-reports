"use client";

import {useContext} from 'react';
import {FocusDistanceContext} from "@/app/context/FocusDistanceContext";

const defaultContext = {focusDistance: null, setFocusDistance: () => {}};

export const useFocusDistance = (shouldUpdate: boolean) => {
    const context = useContext(FocusDistanceContext);

    if (context === undefined) {
        throw new Error('useFocusDistance must be used within a FocusDistanceProvider');
    }

    return shouldUpdate ? context : defaultContext;
};
