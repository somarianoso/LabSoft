import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const keyLength = 64;
const saltLength = 16;
const cost = 32768;
const blockSize = 8;
const parallelization = 1;
const maxMemory = 64 * 1024 * 1024;

export async function hashPassword(password) {
  const salt = randomBytes(saltLength);
  const key = await scrypt(password, salt, keyLength, {
    N: cost,
    r: blockSize,
    p: parallelization,
    maxmem: maxMemory,
  });

  return [
    "scrypt",
    cost,
    blockSize,
    parallelization,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password, encodedHash) {
  if (typeof encodedHash !== "string") {
    return false;
  }

  const [
    algorithm,
    encodedCost,
    encodedBlockSize,
    encodedParallelization,
    salt,
    key,
  ] = encodedHash.split("$");
  if (
    algorithm !== "scrypt" ||
    Number(encodedCost) !== cost ||
    Number(encodedBlockSize) !== blockSize ||
    Number(encodedParallelization) !== parallelization ||
    !salt ||
    !key
  ) {
    return false;
  }

  let expectedKey;
  let saltBytes;
  try {
    saltBytes = Buffer.from(salt, "base64url");
    expectedKey = Buffer.from(key, "base64url");
  } catch {
    return false;
  }

  if (saltBytes.length !== saltLength || expectedKey.length !== keyLength) {
    return false;
  }

  const actualKey = await scrypt(password, saltBytes, keyLength, {
    N: cost,
    r: blockSize,
    p: parallelization,
    maxmem: maxMemory,
  });
  return timingSafeEqual(actualKey, expectedKey);
}
