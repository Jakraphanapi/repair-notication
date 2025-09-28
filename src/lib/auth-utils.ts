/**
 * Authentication utilities for handling LINE UID in various login flows
 */

/**
 * Extract LINE UID from URL parameters
 */
export function extractLineUidFromUrl(url: string): string | null {
    try {
        const urlObj = new URL(url);
        return urlObj.searchParams.get('lineUid');
    } catch (error) {
        console.error('Error extracting LINE UID from URL:', error);
        return null;
    }
}

/**
 * Extract LINE UID from request headers or cookies
 */
export function extractLineUidFromRequest(request: Request): string | null {
    try {
        // Check for LINE UID in custom header
        const lineUidHeader = request.headers.get('x-line-uid');
        if (lineUidHeader) {
            return lineUidHeader;
        }

        // Check for LINE UID in referer URL
        const referer = request.headers.get('referer');
        if (referer) {
            const lineUid = extractLineUidFromUrl(referer);
            if (lineUid) {
                return lineUid;
            }
        }

        return null;
    } catch (error) {
        console.error('Error extracting LINE UID from request:', error);
        return null;
    }
}

/**
 * Create Google OAuth URL with LINE UID parameter
 */
export function createGoogleOAuthUrlWithLineUid(lineUid: string, baseUrl: string): string {
    try {
        const url = new URL('/api/auth/signin/google', baseUrl);
        url.searchParams.set('lineUid', lineUid);
        return url.toString();
    } catch (error) {
        console.error('Error creating Google OAuth URL with LINE UID:', error);
        return `${baseUrl}/api/auth/signin/google`;
    }
}

/**
 * Validate LINE UID format
 */
export function isValidLineUid(lineUid: string): boolean {
    // LINE User ID typically starts with 'U' followed by 32 characters
    const lineUidRegex = /^U[0-9a-f]{32}$/i;
    return lineUidRegex.test(lineUid);
}

/**
 * Store LINE UID in session storage for later use
 */
export function storeLineUidInSession(lineUid: string): void {
    if (typeof window !== 'undefined') {
        try {
            sessionStorage.setItem('pendingLineUid', lineUid);
            console.log('LINE UID stored in session:', lineUid);
        } catch (error) {
            console.error('Error storing LINE UID in session:', error);
        }
    }
}

/**
 * Retrieve and clear LINE UID from session storage
 */
export function retrieveLineUidFromSession(): string | null {
    if (typeof window !== 'undefined') {
        try {
            const lineUid = sessionStorage.getItem('pendingLineUid');
            if (lineUid) {
                sessionStorage.removeItem('pendingLineUid');
                console.log('LINE UID retrieved from session:', lineUid);
                return lineUid;
            }
        } catch (error) {
            console.error('Error retrieving LINE UID from session:', error);
        }
    }
    return null;
}

/**
 * Store LINE UID in localStorage for persistent storage
 */
export function storeLineUidInLocalStorage(lineUid: string): void {
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem('lineUid', lineUid);
            console.log('LINE UID stored in localStorage:', lineUid);
        } catch (error) {
            console.error('Error storing LINE UID in localStorage:', error);
        }
    }
}

/**
 * Retrieve LINE UID from localStorage
 */
export function retrieveLineUidFromLocalStorage(): string | null {
    if (typeof window !== 'undefined') {
        try {
            const lineUid = localStorage.getItem('lineUid');
            if (lineUid) {
                console.log('LINE UID retrieved from localStorage:', lineUid);
                return lineUid;
            }
        } catch (error) {
            console.error('Error retrieving LINE UID from localStorage:', error);
        }
    }
    return null;
}

/**
 * Clear LINE UID from localStorage
 */
export function clearLineUidFromLocalStorage(): void {
    if (typeof window !== 'undefined') {
        try {
            localStorage.removeItem('lineUid');
            console.log('LINE UID cleared from localStorage');
        } catch (error) {
            console.error('Error clearing LINE UID from localStorage:', error);
        }
    }
}
