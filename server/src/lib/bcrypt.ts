import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export async function hashValue(value: string): Promise<string> {
  return bcrypt.hash(value, SALT_ROUNDS);
}

export async function compareHash(
  value: string,
  hashedValue: string
): Promise<boolean> {
  return bcrypt.compare(value, hashedValue);
}