import { headers } from 'next/headers';

// The Worker strips incoming identity headers and sets these only after verifying
// the Cloudflare Access JWT. Route handlers never accept raw Access email headers.
export async function getCurrentUser() {
  const values = await headers();
  const userId = values.get('x-daykeeper-user-id');
  const email = values.get('x-daykeeper-user-email');
  return userId && email ? { userId, email } : null;
}
