import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = ({ clientAddress }) =>
    Response.json({ clientAddress });
