// src/core/services/chat/validate-chat-message.test.ts - Cubre las reglas de validación de mensajes de chat.
import { describe, expect, it } from "vitest";
import { CHAT_MESSAGE_MAX_LENGTH, validateChatMessageInput } from "@/core/services/chat/validate-chat-message";

describe("validateChatMessageInput", () => {
  it("recorta el contenido y usa 'lobby' y 'TEXT' por defecto", () => {
    const result = validateChatMessageInput({ content: "  hola mundo  " });
    expect(result).toEqual({ room: "lobby", content: "hola mundo", kind: "TEXT" });
  });

  it("rechaza contenido vacío, solo espacios o no-texto", () => {
    expect(() => validateChatMessageInput({ content: "   " })).toThrow("no puede estar vacío");
    expect(() => validateChatMessageInput({ content: "" })).toThrow("no puede estar vacío");
    expect(() => validateChatMessageInput({ content: undefined })).toThrow("obligatorio");
  });

  it("rechaza contenido demasiado largo", () => {
    expect(() => validateChatMessageInput({ content: "a".repeat(CHAT_MESSAGE_MAX_LENGTH + 1) })).toThrow("no puede superar");
  });

  it("conserva los saltos de línea internos (solo recorta los extremos)", () => {
    expect(validateChatMessageInput({ content: "\n\nlínea 1\nlínea 2\n\n" }).content).toBe("línea 1\nlínea 2");
  });

  it("acepta kinds válidos y degrada los desconocidos a TEXT", () => {
    expect(validateChatMessageInput({ content: "x", kind: "CARD_SHARE" }).kind).toBe("CARD_SHARE");
    expect(validateChatMessageInput({ content: "x", kind: "HACK" }).kind).toBe("TEXT");
  });
});
