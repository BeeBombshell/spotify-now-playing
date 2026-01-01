import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

interface UserData {
  uid: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify({}));
}

export const saveUser = (uid: string, data: Omit<UserData, 'uid'>) => {
  const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  users[uid] = data;
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

export const getUser = (uid: string): UserData | null => {
  const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  if (users[uid]) {
    return { uid, ...users[uid] };
  }
  return null;
};
