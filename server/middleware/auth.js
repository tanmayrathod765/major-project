import jwt from "jsonwebtoken"

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || ""
  const [scheme, token] = authHeader.split(" ")

  if (scheme !== "Bearer") {
    return res.status(401).json({ message: "No token" })
  }

  if (!token) return res.status(401).json({ message: "No token" })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ message: "Invalid token" })
  }
}

export default protect
