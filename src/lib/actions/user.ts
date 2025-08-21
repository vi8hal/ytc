'use server';

import { getClient } from '@/lib/db';
import { getUserIdFromSession } from '@/lib/utils/auth-helpers';

export async function getCurrentUser() {
  const userId = await getUserIdFromSession();
  if (!userId) {
    return null;
  }

  const client = await getClient();
  try {
    const result = await client.query('SELECT name, email FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0] as { name: string; email: string };
  } catch (error) {
    console.error('[GET_CURRENT_USER_ERROR]', error);
    return null;
  } finally {
    client.release();
  }
}
