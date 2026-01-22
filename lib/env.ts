export const env = {
    appUrl: process.env.NEXT_PUBLIC_APP_URL!,
    firebase: {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
    },
    supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
    expressBaseUrl: process.env.NEXT_PUBLIC_EXPRESS_BASE_URL || "http://localhost:3444",
    clientApiKey: process.env.NEXT_PUBLIC_CLIENT_API_KEY || "x342",
}

export const assertEnv = () => {
    const required = [
        env.appUrl,
        env.firebase.apiKey,
        env.firebase.projectId,
        env.firebase.databaseURL,
        env.supabase.url,
        env.supabase.anonKey,
        env.expressBaseUrl,
        env.clientApiKey,
    ]
    for (const v of required) {
        if (!v) throw new Error("Missing required env var(s). Check .env.local.")
    }
}
