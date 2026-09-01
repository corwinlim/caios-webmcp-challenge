// Copyright 2026 Absolute Global Resources PLT
// SPDX-License-Identifier: Apache-2.0

export const SYNTHETIC_PIKA_ID = "synthetic-pika-hackathon";
export const RESET_CONFIRMATION = "RESET_SYNTHETIC_PIKA_DEMO";
export const STORAGE_KEY = "caios:webmcp-challenge:synthetic-pika:v1";
export const STATE_CHANGED_EVENT = "caios-synthetic-state-changed";

export type CheckInPayload = {
  appetite: "normal" | "reduced" | "increased";
  stoolScore: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  energy: "low" | "normal" | "high";
  note?: string;
};

export type SyntheticCheckIn = CheckInPayload & {
  id: string;
  recordedAt: string;
};

type DemoState = { checkIns: SyntheticCheckIn[] };

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type SiteTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: {
    readOnlyHint: boolean;
    destructiveHint?: boolean;
    idempotentHint: boolean;
  };
  execute(input: Record<string, unknown>): Promise<Record<string, unknown>>;
};

const baselineEvents = [
  {
    id: "synthetic-event-001",
    occurredAt: "2026-08-29T08:30:00.000Z",
    type: "diet_transition",
    summary: "Synthetic Pika started food transition day 2.",
  },
  {
    id: "synthetic-event-002",
    occurredAt: "2026-08-30T07:45:00.000Z",
    type: "stool_observation",
    summary: "Synthetic stool score changed from 3 to 5.",
  },
] as const;

const emptySchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
};

const checkInProperties = {
  appetite: { type: "string", enum: ["normal", "reduced", "increased"] },
  stoolScore: { type: "integer", minimum: 1, maximum: 7 },
  energy: { type: "string", enum: ["low", "normal", "high"] },
  note: { type: "string", maxLength: 240 },
};

function readState(storage: StorageLike): DemoState {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return { checkIns: [] };

  try {
    const parsed = JSON.parse(raw) as Partial<DemoState>;
    return { checkIns: Array.isArray(parsed.checkIns) ? parsed.checkIns : [] };
  } catch {
    return { checkIns: [] };
  }
}

export function readSyntheticCheckIns(storage: StorageLike): SyntheticCheckIn[] {
  return readState(storage).checkIns;
}

function parsePayload(input: Record<string, unknown>): CheckInPayload {
  const appetite = String(input.appetite);
  const stoolScore = Number(input.stoolScore);
  const energy = String(input.energy);
  const rawNote = input.note;

  if (!["normal", "reduced", "increased"].includes(appetite)) {
    throw new Error("appetite must be normal, reduced, or increased");
  }
  if (!Number.isInteger(stoolScore) || stoolScore < 1 || stoolScore > 7) {
    throw new Error("stoolScore must be an integer from 1 to 7");
  }
  if (!["low", "normal", "high"].includes(energy)) {
    throw new Error("energy must be low, normal, or high");
  }
  if (rawNote !== undefined && typeof rawNote !== "string") {
    throw new Error("note must be a string");
  }
  if (typeof rawNote === "string" && rawNote.length > 240) {
    throw new Error("note must contain 240 characters or fewer");
  }

  const note = typeof rawNote === "string" ? rawNote.trim() : "";
  return {
    appetite: appetite as CheckInPayload["appetite"],
    stoolScore: stoolScore as CheckInPayload["stoolScore"],
    energy: energy as CheckInPayload["energy"],
    ...(note ? { note } : {}),
  };
}

function confirmationToken(payload: CheckInPayload): string {
  const canonical = [
    SYNTHETIC_PIKA_ID,
    payload.appetite,
    payload.stoolScore,
    payload.energy,
    payload.note ?? "",
  ].join("|");

  let hash = 2166136261;
  for (const character of canonical) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return `CONFIRM_SYNTHETIC_PIKA_${(hash >>> 0).toString(16).toUpperCase()}`;
}

function notifyStateChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(STATE_CHANGED_EVENT));
  }
}

export function createSyntheticPikaTools(
  storage: StorageLike,
  now: () => Date = () => new Date(),
): SiteTool[] {
  return [
    {
      name: "get_synthetic_pika_profile",
      description:
        "Read the isolated hackathon profile for synthetic Pika. Never accesses a real pet, signed-in account, or production CAIOS data.",
      inputSchema: emptySchema,
      annotations: { readOnlyHint: true, idempotentHint: true },
      execute: async () => ({
        dataBoundary: "synthetic_hackathon_only",
        pet: {
          id: SYNTHETIC_PIKA_ID,
          name: "Pika (Synthetic)",
          species: "dog",
          breed: "Pomeranian",
          ageYears: 6,
          weightKg: 4.2,
          diet: "synthetic chicken transition plan",
        },
      }),
    },
    {
      name: "list_synthetic_pika_events",
      description:
        "List synthetic Pika's fictional baseline and browser-only check-ins. Never queries a server or production database.",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "integer", minimum: 1, maximum: 20, default: 10 },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
      execute: async (input) => {
        const limit = input.limit === undefined ? 10 : Number(input.limit);
        if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
          throw new Error("limit must be an integer from 1 to 20");
        }

        const committed = readState(storage).checkIns.map((item) => ({
          id: item.id,
          occurredAt: item.recordedAt,
          type: "daily_check_in",
          summary: `Synthetic check-in: appetite ${item.appetite}, stool ${item.stoolScore}, energy ${item.energy}.${item.note ? ` Note: ${item.note}` : ""}`,
        }));

        return {
          dataBoundary: "synthetic_hackathon_only",
          events: [...baselineEvents, ...committed]
            .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
            .slice(0, limit),
        };
      },
    },
    {
      name: "get_synthetic_pika_today",
      description:
        "Read synthetic Pika's current demo focus, latest browser-only check-in, and veterinary safety boundary.",
      inputSchema: emptySchema,
      annotations: { readOnlyHint: true, idempotentHint: true },
      execute: async () => {
        const latestCheckIn = readState(storage).checkIns.at(-1) ?? null;
        return {
          dataBoundary: "synthetic_hackathon_only",
          focus: latestCheckIn
            ? "Review the latest synthetic check-in together."
            : "Complete a synthetic daily check-in together.",
          latestCheckIn,
          safety:
            "Hackathon decision-support demo only. It does not diagnose, prescribe, or replace veterinary or emergency care.",
        };
      },
    },
    {
      name: "preview_synthetic_pika_check_in",
      description:
        "Validate and preview an exact synthetic Pika check-in without writing. Returns the confirmation token required to commit that unchanged payload.",
      inputSchema: {
        type: "object",
        properties: checkInProperties,
        required: ["appetite", "stoolScore", "energy"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
      execute: async (input) => {
        const preview = parsePayload(input);
        return {
          dataBoundary: "synthetic_hackathon_only",
          preview,
          confirmationRequired: true,
          confirmationToken: confirmationToken(preview),
          nextTool: "commit_synthetic_pika_check_in",
        };
      },
    },
    {
      name: "commit_synthetic_pika_check_in",
      description:
        "Commit an exactly previewed check-in to isolated browser-only synthetic Pika storage. A mismatched token fails closed. Reset requires its own explicit phrase.",
      inputSchema: {
        type: "object",
        properties: {
          ...checkInProperties,
          confirmationToken: { type: "string" },
          resetConfirmation: {
            type: "string",
            description: `Use exactly ${RESET_CONFIRMATION} only when the person explicitly asks to reset the synthetic demo.`,
          },
        },
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
      execute: async (input) => {
        if (input.resetConfirmation !== undefined) {
          if (input.resetConfirmation !== RESET_CONFIRMATION) {
            throw new Error("Reset denied: explicit reset confirmation did not match.");
          }
          storage.removeItem(STORAGE_KEY);
          notifyStateChanged();
          return {
            dataBoundary: "synthetic_hackathon_only",
            reset: true,
            message: "Synthetic browser state reset. No production data was touched.",
          };
        }

        const payload = parsePayload(input);
        if (input.confirmationToken !== confirmationToken(payload)) {
          throw new Error(
            "Commit denied: preview this exact payload and provide its confirmation token.",
          );
        }

        const state = readState(storage);
        const recordedAt = now().toISOString();
        const checkIn: SyntheticCheckIn = {
          id: `synthetic-check-in-${recordedAt}`,
          recordedAt,
          ...payload,
        };
        storage.setItem(
          STORAGE_KEY,
          JSON.stringify({ checkIns: [...state.checkIns, checkIn] }),
        );
        notifyStateChanged();

        return {
          dataBoundary: "synthetic_hackathon_only",
          committed: true,
          checkIn,
          verification:
            "Use get_synthetic_pika_today or list_synthetic_pika_events and inspect the visible page.",
        };
      },
    },
  ];
}

export async function registerSyntheticPikaTools(
  modelContext: NonNullable<Document["modelContext"]>,
  tools: SiteTool[],
): Promise<void> {
  await Promise.all(tools.map((tool) => modelContext.registerTool(tool)));
}
