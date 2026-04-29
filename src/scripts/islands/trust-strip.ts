import { mountOnce, queryIslandRoots } from './runtime';

function mountTrustStrip(_: HTMLElement): void {
  // Reserved island for future trust-strip interactions.
}

export function mount(): void {
  queryIslandRoots('trust-strip').forEach((root) => mountOnce(root, mountTrustStrip));
}
