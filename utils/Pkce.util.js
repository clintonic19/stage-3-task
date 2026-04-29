const crypto = require("crypto");

exports.generateCodeVerifier = () => {
  try {
    return crypto.randomBytes(32).toString("base64url");
  } catch (error) {
    throw new Error("Error generating code verifier: " + error.message);  
  }
}

exports.generateCodeChallenge = (verifier) => {
  try {
      // Create a SHA256 hash of the verifier and encode it in base64url
      return crypto.createHash("sha256").update(verifier).digest("base64url");
  } catch (error) {
    throw new Error("Error generating code challenge: " + error.message);
  }
}


// export function generateCodeVerifier() {
//   return crypto.randomBytes(32).toString("base64url");
// }

// export function generateCodeChallenge(verifier) {
//   return crypto
//     .createHash("sha256")
//     .update(verifier)
//     .digest("base64url");
// }