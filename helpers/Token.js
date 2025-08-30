const jwt = require("jsonwebtoken");

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "secret";
const secret = NEXTAUTH_SECRET;
console.log(secret);

// TokenPayload {
//   tokenType: string;
//   isAdmin: boolean;
//   _id: string;
//   email: string;
// }
// SignupTokenPayload  {
//   email: string;
//   name: string;
//   exp: number;
//   iat: number;
// }

class Token {
  constructor() {}

  createToken(payload, tokenType = "login", rememberMe) {
    const expiresIn = "24h";
    return jwt.sign({ ...payload, tokenType }, secret, { expiresIn });
  }

  generateSignupToken(payload) {
    return jwt.sign({ ...payload }, secret);
  }

  verifySignupToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, (err, payload) => {
        if (err) {
          reject(err);
        } else if (!payload) {
          reject("nothing found");
        } else {
          resolve(payload);
        }
      });
    });
  }

  verify(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, (err, payload) => {
        if (err) {
          reject(err);
        } else if (!payload) {
          reject("No user");
        } else {
          resolve(payload);
        }
      });
    });
  }
}

const TokenManagement = new Token();
module.exports = TokenManagement;
