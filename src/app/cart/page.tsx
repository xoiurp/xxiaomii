export const dynamic = 'force-static';

export default function CartStubPage() {
  // Headless app: we don't use a /cart page.
  // This stub exists to avoid 404s from framework prefetches to /cart.
  return null;
}

