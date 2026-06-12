import { upsertPresenca } from "@/lib/team-api";
import type { Presenca } from "@/types/domain";

const QUEUE_KEY = "marolo_offline_presence_queue_v1";

export type PresenceQueueItem = {
  id: string;
  createdAt: string;
  payload: Pick<
    Presenca,
    "jogo_id" | "jogador_id" | "presente" | "gols" | "assistencias" | "cartoes" | "notas" | "avaliacao"
  >;
};

function readQueue() {
  const raw = localStorage.getItem(QUEUE_KEY);
  if (!raw) return [] as PresenceQueueItem[];
  try {
    const parsed = JSON.parse(raw) as PresenceQueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: PresenceQueueItem[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export function listPresenceQueue() {
  return readQueue();
}

export function enqueuePresenceUpdates(
  payloads: Pick<
    Presenca,
    "jogo_id" | "jogador_id" | "presente" | "gols" | "assistencias" | "cartoes" | "notas" | "avaliacao"
  >[],
) {
  const current = readQueue();
  const next = [
    ...current,
    ...payloads.map((payload, index) => ({
      id: `${Date.now()}_${index}_${payload.jogo_id}_${payload.jogador_id}`,
      createdAt: new Date().toISOString(),
      payload,
    })),
  ];
  writeQueue(next);
  return next.length;
}

export async function flushPresenceQueue() {
  const queue = readQueue();
  if (!queue.length) return { sent: 0, failed: 0 };

  const failed: PresenceQueueItem[] = [];
  let sent = 0;

  for (const item of queue) {
    try {
      await upsertPresenca(item.payload);
      sent += 1;
    } catch {
      failed.push(item);
    }
  }

  writeQueue(failed);
  return { sent, failed: failed.length };
}
