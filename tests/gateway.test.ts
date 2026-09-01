// Copyright 2026 Absolute Global Resources PLT
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import {
  createSyntheticPikaTools,
  RESET_CONFIRMATION,
  STORAGE_KEY,
  SYNTHETIC_PIKA_ID,
  type StorageLike,
} from "../src/gateway";

function memoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
  };
}

function getTool(storage: StorageLike, name: string) {
  const tool = createSyntheticPikaTools(storage).find((candidate) => candidate.name === name);
  if (!tool) throw new Error(`Missing tool: ${name}`);
  return tool;
}

describe("CAIOS WebMCP Agent Gateway", () => {
  it("exposes exactly five unique, synthetic-only tools", () => {
    const tools = createSyntheticPikaTools(memoryStorage());

    expect(tools).toHaveLength(5);
    expect(new Set(tools.map((tool) => tool.name)).size).toBe(5);
    expect(tools.every((tool) => tool.description.toLowerCase().includes("synthetic"))).toBe(true);
  });

  it("returns only the synthetic Pika identity", async () => {
    const profile = await getTool(
      memoryStorage(),
      "get_synthetic_pika_profile",
    ).execute({});

    expect(profile.dataBoundary).toBe("synthetic_hackathon_only");
    expect((profile.pet as { id: string }).id).toBe(SYNTHETIC_PIKA_ID);
  });

  it("rejects an unpreviewed write", async () => {
    const commit = getTool(memoryStorage(), "commit_synthetic_pika_check_in");

    await expect(
      commit.execute({ appetite: "reduced", stoolScore: 5, energy: "normal" }),
    ).rejects.toThrow("Commit denied");
  });

  it("invalidates confirmation when the payload changes", async () => {
    const storage = memoryStorage();
    const preview = getTool(storage, "preview_synthetic_pika_check_in");
    const commit = getTool(storage, "commit_synthetic_pika_check_in");
    const payload = { appetite: "reduced", stoolScore: 5, energy: "normal" };
    const reviewed = await preview.execute(payload);

    await expect(
      commit.execute({
        ...payload,
        stoolScore: 6,
        confirmationToken: reviewed.confirmationToken,
      }),
    ).rejects.toThrow("Commit denied");
  });

  it("commits and verifies the exact confirmed payload", async () => {
    const storage = memoryStorage();
    const tools = createSyntheticPikaTools(
      storage,
      () => new Date("2026-09-01T12:00:00.000Z"),
    );
    const preview = tools.find((tool) => tool.name === "preview_synthetic_pika_check_in")!;
    const commit = tools.find((tool) => tool.name === "commit_synthetic_pika_check_in")!;
    const today = tools.find((tool) => tool.name === "get_synthetic_pika_today")!;
    const events = tools.find((tool) => tool.name === "list_synthetic_pika_events")!;
    const payload = {
      appetite: "reduced",
      stoolScore: 5,
      energy: "normal",
      note: "Judge workflow",
    };

    const reviewed = await preview.execute(payload);
    const written = await commit.execute({
      ...payload,
      confirmationToken: reviewed.confirmationToken,
    });
    const current = await today.execute({});
    const timeline = await events.execute({ limit: 10 });

    expect(written.committed).toBe(true);
    expect(JSON.stringify(current)).toContain("Judge workflow");
    expect(JSON.stringify(timeline)).toContain("Judge workflow");
  });

  it("rejects invalid or overlong health input", async () => {
    const preview = getTool(memoryStorage(), "preview_synthetic_pika_check_in");

    await expect(
      preview.execute({ appetite: "normal", stoolScore: 99, energy: "normal" }),
    ).rejects.toThrow("stoolScore");
    await expect(
      preview.execute({
        appetite: "normal",
        stoolScore: 3,
        energy: "normal",
        note: "x".repeat(241),
      }),
    ).rejects.toThrow("240");
  });

  it("requires the exact reset phrase and touches only namespaced demo state", async () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({ checkIns: [] }));
    const commit = getTool(storage, "commit_synthetic_pika_check_in");

    await expect(commit.execute({ resetConfirmation: "reset" })).rejects.toThrow(
      "Reset denied",
    );
    await expect(
      commit.execute({ resetConfirmation: RESET_CONFIRMATION }),
    ).resolves.toMatchObject({
      reset: true,
      dataBoundary: "synthetic_hackathon_only",
    });
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });
});
