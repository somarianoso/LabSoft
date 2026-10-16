import { jwtVerify, SignJWT } from "jose";
import { HttpError } from "./http-error.js";

const issuer = "wellflix-api";
const audience = "wellflix-client";
const algorithm = "HS256";
const accessTokenLifetimeSeconds = 15 * 60;

function signingKey(secret) {
  if (typeof secret !== "string" || Buffer.byteLength(secret, "utf8") < 32) {
    throw new HttpError(
      503,
      "A autenticação exige AUTH_TOKEN_SECRET com pelo menos 32 bytes.",
      "AUTHENTICATION_NOT_CONFIGURED",
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createAccessToken(usuario, secret) {
  const token = await new SignJWT({ papel: usuario.papel })
    .setProtectedHeader({ alg: algorithm })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(usuario.id)
    .setIssuedAt()
    .setExpirationTime(`${accessTokenLifetimeSeconds}s`)
    .sign(signingKey(secret));

  return {
    access_token: token,
    token_type: "Bearer",
    expires_in: accessTokenLifetimeSeconds,
  };
}

export async function verifyAccessToken(token, secret) {
  const { payload } = await jwtVerify(token, signingKey(secret), {
    algorithms: [algorithm],
    issuer,
    audience,
  });
  return payload;
}
