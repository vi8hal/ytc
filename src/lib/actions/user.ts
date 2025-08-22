
'use server';

import { getClient } from '@/lib/db';
import { getSessionPayload, getUserIdFromSession } from '@/lib/utils/auth-helpers';
import { revalidatePath } from 'next/cache';

export async function getCurrentUser() {
  const userId = await getUserIdFromSession();
  if (!userId) {
    return null;
  }

  const client = await getClient();
  try {
    const result = await client.query('SELECT name, email, "isAdmin" FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0] as { name: string; email: string, isAdmin: boolean };
  } catch (error) {
    console.error('[GET_CURRENT_USER_ERROR]', error);
    return null;
  } finally {
    client.release();
  }
}

export async function getUsersAction() {
    const session = await getSessionPayload();
    if (!session?.isAdmin) {
        throw new Error('You are not authorized to perform this action.');
    }

    const client = await getClient();
    try {
        const result = await client.query('SELECT id, name, email, verified, "isAdmin" FROM users ORDER BY id ASC');
        return result.rows;
    } catch (error) {
        console.error('[GET_USERS_ERROR]', error);
        throw new Error('Failed to fetch user data.');
    } finally {
        client.release();
    }
}
