(() => {
    const config = window.TEAM_RUBY_SUPABASE_CONFIG || {};
    const listeners = new Set();
    const walletKey = "teamruby:box-art-frenzy:wallet";
    const inventoryKey = "teamruby:box-art-frenzy:inventory";
    let client = null;
    let currentUser = null;
    let initialization = null;

    function isConfigured() {
        return typeof config.url === "string"
            && config.url.startsWith("https://")
            && typeof config.anonKey === "string"
            && config.anonKey.length > 0;
    }

    function notify() {
        const state = { configured: isConfigured(), user: currentUser };
        listeners.forEach((listener) => listener(state));
    }

    function loadClientLibrary() {
        if (window.supabase?.createClient) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
            script.onload = resolve;
            script.onerror = () => reject(new Error("Could not load Supabase. Check your internet connection."));
            document.head.appendChild(script);
        });
    }

    function readLocalInventory() {
        let inventory = {};
        try {
            inventory = JSON.parse(localStorage.getItem(inventoryKey) || "{}");
        } catch {
            inventory = {};
        }
        return {
            box_bucks: Math.max(0, Number.parseInt(localStorage.getItem(walletKey) || "0", 10) || 0),
            slow_potions: Math.max(0, Number.parseInt(inventory.slowPotions, 10) || 0),
            revives: Math.max(0, Number.parseInt(inventory.revives, 10) || 0)
        };
    }

    function writeLocalInventory(data) {
        try {
            localStorage.setItem(walletKey, String(data.box_bucks));
            localStorage.setItem(inventoryKey, JSON.stringify({
                slowPotions: data.slow_potions,
                revives: data.revives
            }));
            window.dispatchEvent(new CustomEvent("team-ruby-inventory-updated"));
        } catch {
            return false;
        }
        return true;
    }

    async function initialize() {
        if (initialization) return initialization;
        initialization = (async () => {
            if (!isConfigured()) {
                notify();
                return { configured: false, user: null };
            }

            await loadClientLibrary();
            client = window.supabase.createClient(config.url, config.anonKey, {
                auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
            });
            client.auth.onAuthStateChange((_event, session) => {
                currentUser = session?.user || null;
                notify();
                if (currentUser) window.setTimeout(() => loadPlayerInventory().catch(() => {}), 0);
            });

            const { data, error } = await client.auth.getSession();
            if (error) throw error;
            currentUser = data.session?.user || null;
            if (currentUser) await loadPlayerInventory();
            notify();
            return { configured: true, user: currentUser };
        })();
        return initialization;
    }

    async function loadPlayerInventory() {
        if (!client || !currentUser) return null;
        const { data, error } = await client
            .from("player_inventory")
            .select("box_bucks, slow_potions, revives")
            .eq("user_id", currentUser.id)
            .maybeSingle();
        if (error) throw error;

        let inventory = data;
        if (!inventory) {
            const localInventory = readLocalInventory();
            const result = await client
                .from("player_inventory")
                .upsert({ user_id: currentUser.id, ...localInventory }, { onConflict: "user_id" })
                .select("box_bucks, slow_potions, revives")
                .single();
            if (result.error) throw result.error;
            inventory = result.data;
        }

        writeLocalInventory(inventory);
        return inventory;
    }

    async function savePlayerInventory(boxBucks, inventory) {
        await initialize();
        if (!client || !currentUser) return false;
        const { data: sessionData, error: sessionError } = await client.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) {
            currentUser = null;
            notify();
            return false;
        }
        const { data, error } = await client
            .from("player_inventory")
            .upsert({
                user_id: currentUser.id,
                box_bucks: Math.max(0, Math.floor(boxBucks)),
                slow_potions: Math.max(0, Math.floor(inventory.slowPotions)),
                revives: Math.max(0, Math.floor(inventory.revives)),
                updated_at: new Date().toISOString()
            }, { onConflict: "user_id" })
            .select("box_bucks, slow_potions, revives")
            .single();
        if (error) throw error;
        writeLocalInventory(data);
        return true;
    }

    async function signUp(email, username, password) {
        await initialize();
        if (!client) throw new Error("Account sync is not configured yet.");
        const { data, error } = await client.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: { data: { username: username.trim().toLowerCase() } }
        });
        if (error) throw error;
        currentUser = data.session?.user || null;
        if (data.session) await loadPlayerInventory();
        notify();
        return data;
    }

    async function signIn(email, password) {
        await initialize();
        if (!client) throw new Error("Account sync is not configured yet.");
        const { data, error } = await client.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password
        });
        if (error) throw error;
        currentUser = data.user;
        await loadPlayerInventory();
        notify();
        return data;
    }

    async function signOut() {
        if (!client) return;
        const { error } = await client.auth.signOut();
        if (error) throw error;
        currentUser = null;
        notify();
    }

    function getUsername(user = currentUser) {
        return user?.user_metadata?.username || user?.email || "Player";
    }

    window.TeamRubyAccounts = {
        isConfigured,
        isSignedIn: () => Boolean(currentUser),
        getUsername,
        initialize,
        loadPlayerInventory,
        savePlayerInventory,
        signUp,
        signIn,
        signOut,
        onChange(listener) {
            listeners.add(listener);
            listener({ configured: isConfigured(), user: currentUser });
            return () => listeners.delete(listener);
        }
    };
})();
