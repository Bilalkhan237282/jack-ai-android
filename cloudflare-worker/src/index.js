
export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json(
        { status: "JACK AI Image Worker is running" },
        { headers: cors }
      );
    }

    if (url.pathname !== "/generate" || request.method !== "POST") {
      return Response.json(
        { error: "Not found" },
        { status: 404, headers: cors }
      );
    }

    if (
      !env.JACK_WORKER_SECRET ||
      request.headers.get("Authorization") !==
        `Bearer ${env.JACK_WORKER_SECRET}`
    ) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401, headers: cors }
      );
    }

    try {
      const body = await request.json();
      const prompt = String(body.prompt || "").trim();

      if (!prompt || prompt.length > 1000) {
        return Response.json(
          { error: "Prompt must be 1–1000 characters" },
          { status: 400, headers: cors }
        );
      }

      const result = await env.AI.run(
        "@cf/black-forest-labs/flux-1-schnell",
        { prompt, steps: 4 }
      );

      return new Response(result, {
        headers: {
          ...cors,
          "Content-Type": "image/jpeg",
        },
      });
    } catch (error) {
      return Response.json(
        { error: "Image generation failed" },
        { status: 500, headers: cors }
      );
    }
  },
};
