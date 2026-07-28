const GITHUB_OWNER = "skylonely";
const GITHUB_REPOSITORY = "sgao-images";
const GITHUB_BRANCH = "main";

export async function getFileFromGitHub(path: string): Promise<Response> {
  const normalizedPath = path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  if (!normalizedPath) {
    return new Response("File path is required", {
      status: 400,
    });
  }

  const rawUrl =
    `https://raw.githubusercontent.com/` +
    `${GITHUB_OWNER}/${GITHUB_REPOSITORY}/${GITHUB_BRANCH}/${normalizedPath}`;

  try {
    const upstreamResponse = await fetch(rawUrl, {
      headers: {
        "User-Agent": "sgao-image-center",
      },
    });

    if (upstreamResponse.status === 404) {
      return new Response("Image not found", {
        status: 404,
      });
    }

    if (!upstreamResponse.ok) {
      return new Response("Image storage request failed", {
        status: 502,
      });
    }

    const headers = new Headers(upstreamResponse.headers);

    headers.set("Cache-Control", "public, max-age=300");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.delete("set-cookie");

    return new Response(upstreamResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("GitHub request failed:", error);

    return new Response("Unable to connect to image storage", {
      status: 502,
    });
  }
}