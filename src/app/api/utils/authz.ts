import { NextRequest , NextResponse} from "next/server";
import {adminAuth} from "@/app/api/utils/firebase-admin";

const ALLOWED_ROLES = new Set(["admin", "editor"]);

export async function requireRole(req: NextRequest, allowed = ALLOWED_ROLES) {
    const authHeader = req.headers.get("authorization") || "";
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) throw new Error("UNAUTHORIZED");

    const decoded = await adminAuth.verifyIdToken(match[1]);
    const role = decoded.role as string | undefined;

    if (!role || !allowed.has(role)) throw new Error("FORBIDDEN");

    return decoded; // uid, email, role...
}

export function authErrorToResponse(err: unknown) {
    const msg = (err as Error)?.message;
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return null;
}

