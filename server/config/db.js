import mongoose from "mongoose"

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const connectDB = async () => {
  const maxRetries = Number(process.env.MONGO_CONNECT_RETRIES || 5)
  const retryDelayMs = Number(process.env.MONGO_CONNECT_RETRY_DELAY_MS || 3000)

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 20),
        minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 5),
        serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 15000),
        socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 45000),
        autoIndex: process.env.NODE_ENV !== "production",
      })
      console.log("MongoDB Connected: " + conn.connection.host)
      return conn
    } catch (error) {
      const isLastAttempt = attempt === maxRetries
      console.error(`MongoDB Error (attempt ${attempt}/${maxRetries}): ${error.message}`)

      if (isLastAttempt) {
        process.exit(1)
      }

      await delay(retryDelayMs)
    }
  }
}

export default connectDB
