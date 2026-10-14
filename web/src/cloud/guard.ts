/**
 * The only door to remote models. Every cloud call goes through
 * `assertSendable`, which refuses anything that has not passed local
 * pseudonymization *and* verification, whatever the UI does.
 */
import type { Manifest } from "../core/verify";

export type CloudPolicy =
  | { kind: "off" }
  | { kind: "openrouter-zdr"; apiKey: string; model: string }
  | { kind: "custom-endpoint"; url: string; apiKey: string; model: string };

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
  return { provider: { zdr: true, data_collection: "deny" as const } };
}
