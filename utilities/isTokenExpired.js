// import jwtDecode from "jwt-decode";

// const isTokenExpired = (token) => {
    
//   if (!token) {
//     console.error("Token is missing");
//     return true;
//   } // If there's no token, treat it as expired

//   try {
//     const decoded = jwtDecode(token);
//     const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds
//     console.log("running");
//     return decoded.exp < currentTime;
//   } catch (error) {
//     console.error("Invalid token:", error);
//     return true; // Consider invalid tokens as expired
//   }
// };

const parseJwt = (token) => {
  try {
    const base64Url = token.split(".")[1]; // Get payload
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const decodedData = JSON.parse(atob(base64)); // Decode base64
    return decodedData;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

const isTokenExpired = (token) => {
  const decoded = parseJwt(token);
  if (!decoded) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

export default isTokenExpired;
