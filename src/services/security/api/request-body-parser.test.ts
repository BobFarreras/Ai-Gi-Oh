// src/services/security/api/request-body-parser.test.ts - Pruebas unitarias del parser común de body JSON para endpoints API.
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  readJsonObjectBody,
  readRequiredArrayField,
  readRequiredIntegerField,
  readRequiredStringField,
} from "@/services/security/api/request-body-parser";

function createJsonRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/test", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("request-body-parser", () => {
  it("valida raíz object y extrae campos string/int/array", async () => {
    const payload = await readJsonObjectBody(createJsonRequest({ cardId: " abc ", slotIndex: 2, events: [1, 2] }), "invalid");
    expect(readRequiredStringField(payload, "cardId", "missing")).toBe("abc");
    expect(readRequiredIntegerField(payload, "slotIndex", "missing")).toBe(2);
    expect(readRequiredArrayField<number>(payload, "events", "missing")).toEqual([1, 2]);
  });

  it("rechaza payload no objeto", async () => {
    await expect(readJsonObjectBody(createJsonRequest(["bad"]), "invalid payload")).rejects.toThrow("invalid payload");
  });
});
