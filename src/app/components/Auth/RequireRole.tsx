"use client";

import React from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";

const ALLOWED = ["admin", "editor"];

export function RequireRole({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<User | null>(null);
    const [allowed, setAllowed] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        const auth = getAuth();

        return onAuthStateChanged(auth, async (u) => {
            setUser(u);

            if (!u) {
                setAllowed(false);
                return;
            }

            const token = await u.getIdTokenResult();
            const role = token.claims.role as string | undefined;

            setAllowed(!!role && ALLOWED.includes(role));
        });
    }, []);

    if (allowed === null) return null;

    if (!user) return <div>Please login</div>;

    if (!allowed) return <div>Access denied</div>;

    return <>{children}</>;
}