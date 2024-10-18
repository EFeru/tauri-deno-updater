const REPO_OWNER = "my-account";
const REPO_NAME = "my-repo-name";
const GITHUB_TOKEN = Deno.env.get("MY_GITHUB_TOKEN");

// Function to get the latest release data
async function getLatestRelease() {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`, {
        headers: {
            "Authorization": `Bearer ${GITHUB_TOKEN}`,
            "Accept": "application/json"
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch latest release: ${response.statusText}`);
    }
    return response.json();
}

// Function to get the the asset data
async function getAsset(id, isJson = true) {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/assets/${id}`, {
        headers: {
            "Authorization": `Bearer ${GITHUB_TOKEN}`,
            "Accept": "application/octet-stream",
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch latest release: ${response.statusText}`);
    }
    // Return the response as JSON or as a Blob (for binary data)
    return isJson ? await response.json() : await response.blob();
}

// Start the Deno server
Deno.serve(async (req: Request) => {
    const headers = new Headers({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
    });

    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, { headers });
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split("/").filter(Boolean);

    // Handle asset download
    if (pathParts[0] === "download" && pathParts.length === 3) {
        const assetId = pathParts[1];
        const assetName = pathParts[2];
        try {
            // Fetch the binary asset using the provided asset ID
            const assetData = await getAsset(assetId, false); // false to get binary data

            // Set headers for binary data response
            const responseHeaders = new Headers({
                ...headers,
                "Content-Type": "application/octet-stream",
                "Content-Disposition": `attachment; filename="${assetName}"`
            });

            return new Response(assetData, {
                headers: responseHeaders,
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers,
            });
        }
    }

    // Handle latest release information
    let [target, arch, current_version] = pathParts;
    current_version = current_version.replace(/^v/, '');

    if (!target || !arch || !current_version) {
        return new Response("Invalid request format", { status: 400, headers });
    }

    try {
        const latestRelease = await getLatestRelease();
        const latestVersion = latestRelease.tag_name.replace(/^v/, '');

        // Check if the current version is up-to-date
        if (current_version >= latestVersion) {
            console.log("No update available");
            return new Response(null, { status: 204, headers }); // No update available
        }

        // Get signature
        const assetLatestJson = latestRelease.assets.find(a => a.name === 'latest.json');
        const assetData = await getAsset(assetLatestJson.id, true);
        const platformKey = `${target}-${arch}`;
        const platformSignature = assetData.platforms[platformKey].signature;
        const platformName = assetData.platforms[platformKey].url.split('/').pop(); // Gets the last part of the URL

        // Get the download asset
        const assetDownload = latestRelease.assets.find(a => a.name === platformName);
        if (!assetDownload) {
            return new Response(`No suitable asset found for ${target}/${arch}`, { status: 404, headers });
        }

        // Construct the response for Tauri's updater
        const updateResponse = {
            version: latestVersion,
            pub_date: latestRelease.published_at,
            url: `${url.origin}/download/${assetDownload.id}/${platformName}`,
            signature: platformSignature,
            notes: latestRelease.body,
        };
        console.log(updateResponse)
        return new Response(JSON.stringify(updateResponse), {
            headers: {
                ...headers,
                "Content-Type": "application/json",
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
        });
    }
});
