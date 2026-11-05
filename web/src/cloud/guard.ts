/**
 * The only door to remote models. Every cloud call goes through
 * `assertSendable`, which refuses anything that has not passed local
 * pseudonymization *and* verification, whatever the UI does.
 */
import type { Manifest } from "../core/verify";

export type CloudPolicy =
  | { kind: "off" }
  | { kind: "openrouter-zdr"; apiKey: string; model: string; segmentModel?: string }
  | { kind: "custom-endpoint"; url: string; apiKey: string; model: string; segmentModel?: string };

export class CloudRefused extends Error {}

export function assertSendable(manifest: Manifest | undefined, policy: CloudPolicy): void {
  if (policy.kind === "off") throw new CloudRefused("Cloud models are disabled for this installation.");
  if (!manifest) throw new CloudRefused("Document has not been pseudonymized.");
  if (!manifest.reviewedByHuman) throw new CloudRefused("Pseudonymization has not been reviewed.");
  if (!manifest.verified || manifest.leaks.length > 0) throw new CloudRefused("Verification found residual identifiers.");
}

/**
 * OpenRouter request fields that restrict routing to providers with zero
 * data retention that do not train on prompts.
 */
export function openRouterPrivacyFields() {
  // Not require_parameters: it leaves no ZDR endpoint for some models (404).
  // An empty or unreadable answer is tried once more instead (client.ts).
  return { provider: { zdr: true, data_collection: "deny" as const } };
}

/** The policy for the segmentation: its own model if one is set (often a
 *  cheaper one), else the frise's. */
export function segmentationPolicy(p: CloudPolicy): CloudPolicy {
  return p.kind !== "off" && p.segmentModel ? { ...p, model: p.segmentModel } : p;
}
