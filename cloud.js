"use strict";

function createCloudArchive({ url, publishableKey }) {
    const client = window.supabase.createClient(url, publishableKey, {
        auth: { storageKey: 'deepspace-archive-auth-' + new URL(url).hostname },
    });

    async function result(request) {
        const { data, error } = await request;
        if (error) throw new Error(error.message);
        return data;
    }

    return {
        async session() {
            return (await result(client.auth.getSession())).session;
        },
        async signIn(email, password) {
            await result(client.auth.signInWithPassword({ email, password }));
        },
        async signOut() {
            await result(client.auth.signOut({ scope: 'local' }));
        },
        async read() {
            return await result(client.from('deepspace_archives')
                .select('document,revision').maybeSingle());
        },
        async write(document, revision) {
            const row = await result(client.from('deepspace_archives')
                .update({ document, revision: revision + 1 })
                .eq('revision', revision).select('revision').maybeSingle());
            if (!row) throw new Error('云端档案已在别处更新，请刷新后重试');
            return row.revision;
        },
    };
}
