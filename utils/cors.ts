import type { VercelRequest, VercelResponse } from '@vercel/node';

export const ALLOWED_ORIGINS = [
    'https://opd.aivanahealth.com',
    'https://opdv4.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
];

export default function setCorsHeaders(req: VercelRequest, res: VercelResponse) {
    const origin = req.headers.origin as string;

    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', 'https://opd.aivanahealth.com');
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
}
