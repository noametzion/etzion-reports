import { getAuth } from "firebase/auth";

export async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
    const token = await getAuth().currentUser?.getIdToken();

    return fetch(input, {
        ...init,
        headers: {
            ...(init.headers || {}),
            Authorization: token ? `Bearer ${token}` : "",
        },
    });
}
