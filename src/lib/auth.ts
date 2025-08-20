
'use server';

import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in the environment variables.');
}
const secretKey = new TextEncoder().encode(JWT_SECRET);

// --- JWT Token Management ---
export async function createSessionToken(payload: object, expiresIn: string = '24h') {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

export async function createVerificationToken(payload: object) {
    return new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('10m') // Shorter expiry for verification
      .sign(secretKey);
}

export async function verifySessionToken(token: string) {
    try {
        const { payload } = await jose.jwtVerify(token, secretKey, { algorithms: ['HS256'] });
        return payload;
    } catch (error) {
        return null; // Return null if token is invalid or expired
    }
}

export async function verifyVerificationToken(token: string) {
    try {
        const { payload } = await jose.jwtVerify(token, secretKey, { algorithms: ['HS256'] });
        return payload;
    } catch (error) {
        return null;
    }
}

    
