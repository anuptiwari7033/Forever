import jwt from "jsonwebtoken";

// Same JWT pattern as authUser/riderAuth, scoped to the store's own login
// so a store token can never be used to hit customer or rider endpoints.
const storeAuth = async (req, res, next) => {
  const { token } = req.headers;

  if (!token) {
    return res.json({ success: false, message: "NOT AUTHORIZED, LOGIN AGAIN!" });
  }

  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);

    if (token_decode.role !== "store") {
      return res.json({ success: false, message: "NOT AUTHORIZED, LOGIN AGAIN!" });
    }

    req.body.storeId = token_decode.id;
    next();
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export default storeAuth;
