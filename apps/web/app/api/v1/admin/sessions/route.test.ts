import { describe, expect, test } from "bun:test";
import { POST } from "./route";

describe("POST /api/v1/admin/sessions", () => {
  test("without the admin token is 401", async () => {
    process.env.HACK0_ADMIN_TOKEN = "t".repeat(16);
    const res = await POST(new Request("http://x", { method: "POST", body: "{}" }));
    expect(res.status).toBe(401);
  });
  test("with the token but non-gzip data is 400", async () => {
    process.env.HACK0_ADMIN_TOKEN = "t".repeat(16);
    const res = await POST(
      new Request("http://x", {
        method: "POST",
        headers: { "x-hack0-admin": "t".repeat(16) },
        body: JSON.stringify({ workshop: "w", slug: "s", title: "t", duration: 1, castGzBase64: Buffer.from("plain").toString("base64") }),
      }),
    );
    expect(res.status).toBe(400);
  });
});
