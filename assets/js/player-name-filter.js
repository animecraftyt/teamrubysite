(() => {
    const blockedWords = new Set([
        "arse", "ass", "asshole", "bastard", "bitch", "bollocks", "bullshit",
        "cock", "crap", "cunt", "damn", "dick", "douche", "fuck", "fucker",
        "fucking", "fucks", "fucked", "motherfucker", "piss", "prick", "pussy",
        "shit", "shitty", "slut", "twat", "whore"
    ]);
    const characterMap = {
        "0": "o",
        "1": "i",
        "3": "e",
        "4": "a",
        "5": "s",
        "7": "t",
        "@": "a",
        "$": "s",
        "!": "i"
    };

    window.isAllowedPlayerName = (name) => {
        const normalized = String(name)
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[013457@$!]/g, (character) => characterMap[character])
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        const tokens = normalized.split(" ").filter(Boolean);

        if (tokens.some((token) => blockedWords.has(token))) return false;

        let letterRun = "";
        for (const token of tokens) {
            if (token.length === 1) {
                letterRun += token;
            } else {
                if (blockedWords.has(letterRun)) return false;
                letterRun = "";
            }
        }

        return !blockedWords.has(letterRun);
    };
})();
