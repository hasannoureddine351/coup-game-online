import type { Block, Challenge, GameAction, GamePlayer } from "../api/types";

function getTargetPlayer(action: GameAction): GamePlayer | undefined {
  return (
    action.targetPlayer ??
    (action as unknown as Record<string, unknown>).target_player ??
    undefined
  ) as GamePlayer | undefined;
}

function getChallenge(action: GameAction): Challenge | undefined {
  return (
    action.challenge ??
    (action as unknown as Record<string, unknown>).challenge ??
    undefined
  ) as Challenge | undefined;
}

function getBlock(action: GameAction): Block | undefined {
  return (
    action.block ?? (action as unknown as Record<string, unknown>).block ?? undefined
  ) as Block | undefined;
}

function challengedPlayer(ch: Challenge): GamePlayer | undefined {
  return (
    ch.challengedPlayer ??
    (ch as unknown as Record<string, unknown>).challenged_player ??
    undefined
  ) as GamePlayer | undefined;
}

function challengerPlayer(ch: Challenge): GamePlayer | undefined {
  return (
    ch.challenger ??
    (ch as unknown as Record<string, unknown>).challenger ??
    undefined
  ) as GamePlayer | undefined;
}

export function playerDisplayName(p?: GamePlayer | null): string {
  if (!p) return "Unknown";
  return p.user?.username ?? `Player #${p.id}`;
}

function formatActionVerb(action: GameAction): string {
  const t = action.action_type;
  switch (t) {
    case "Income":
      return "takes Income";
    case "Foreign_Aid":
      return "takes Foreign Aid";
    case "Coup":
      return "launches a Coup";
    case "Tax":
      return "collects Tax";
    case "Assassinate":
      return "attempts Assassination";
    case "Steal":
      return "attempts to Steal";
    case "Exchange":
      return "uses Exchange";
    default:
      return t;
  }
}

export type ActionLogParts = {
  id: number;
  actorName: string;
  verb: string;
  claim?: string | null;
  targetName?: string | null;
  challengeSummary?: string | null;
  blockSummary?: string | null;
  status: GameAction["status"];
};

export function buildActionLogParts(action: GameAction): ActionLogParts {
  const actor = action.player;
  const actorName = playerDisplayName(actor);
  const verb = formatActionVerb(action);
  const claim = action.claimed_character ?? null;
  const target = getTargetPlayer(action);
  const targetName =
    target && ["Assassinate", "Steal", "Coup"].includes(action.action_type)
      ? playerDisplayName(target)
      : null;

  const ch = getChallenge(action);
  let challengeSummary: string | null = null;
  if (ch) {
    const cn = playerDisplayName(challengerPlayer(ch));
    const challenged = playerDisplayName(challengedPlayer(ch));
    const card = ch.revealed_card_type ? ` — revealed ${ch.revealed_card_type}` : "";
    if (ch.outcome === "challenger_wins") {
      challengeSummary = `Challenged by ${cn} → ${challenged} lost influence${card}`;
    } else if (ch.outcome === "challenged_wins") {
      challengeSummary = `Challenged by ${cn} → ${cn} lost influence${card}`;
    } else if (ch.outcome == null) {
      challengeSummary = `Challenged by ${cn} → ${challenged} must reveal a card`;
    } else {
      challengeSummary = `Challenged by ${cn}`;
    }
  }

  const bl = getBlock(action);
  let blockSummary: string | null = null;
  if (bl) {
    const bn = playerDisplayName(bl.blocker);
    const char = bl.claimed_character;
    if (bl.outcome === "successful") {
      blockSummary = `Blocked by ${bn} (${char}) — block held`;
    } else if (bl.outcome === "failed") {
      blockSummary = `Blocked by ${bn} (${char}) — block failed`;
    } else if (bl.outcome === "challenged") {
      blockSummary = `Blocked by ${bn} (${char}) — block challenged`;
    } else if (bl.was_challenged) {
      blockSummary = `Blocked by ${bn} (${char})`;
    } else {
      blockSummary = `Blocked by ${bn} (${char})`;
    }
  }

  return {
    id: action.id,
    actorName,
    verb,
    claim,
    targetName,
    challengeSummary,
    blockSummary,
    status: action.status,
  };
}

/** Chronological order (oldest first) for reading top-to-bottom. */
export function chronologicalActions(actions: GameAction[] | undefined): GameAction[] {
  if (!actions?.length) return [];
  return [...actions].sort((a, b) => a.id - b.id);
}
