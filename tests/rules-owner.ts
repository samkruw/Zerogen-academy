import { readFileSync } from 'node:fs';
const raw = readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8');
const readRule = JSON.parse(raw).rules.users.$uid.courses['.read'];
const match = /auth\.uid === '([^']+)'/.exec(readRule);
if (!match) throw new Error('Owner-UID fehlt in den zu prüfenden Rules.');
export const ownerUid = match[1] === 'REPLACE_WITH_OWNER_UID' ? 'test-owner' : match[1];
export const rules = raw.replaceAll('REPLACE_WITH_OWNER_UID', ownerUid);
