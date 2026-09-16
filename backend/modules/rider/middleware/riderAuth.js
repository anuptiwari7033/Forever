import jwt from "jsonwebtoken";

// Mirrors the existing backend/middleware/auth.js pattern exactly
// (token in headers, JWT_SECRET, same {success,message} error shape),
// just scoped to the rider collection so rider tokens can't be reused as
// customer tokens and vice versa.
const riderAuth = async (req, res, next) => {
  const { token } = req.headers;

  if (!token) {
    return res.json({
      success: false,
      message: "NOT AUTHORIZED, LOGIN AGAIN!",
    });
  }

  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);

    if (token_decode.role !== "rider") {
      return res.json({ success: false, message: "NOT AUTHORIZED, LOGIN AGAIN!" });
    }

    req.body.riderId = token_decode.id;
    next();
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export default riderAuth;
