import mongoose from "mongoose";

export const DATABASE_URL =
  process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb+srv://Avverma:Avverma95766@avverma.2g4orpk.mongodb.net/the-portal?retryWrites=true&w=majority";

export const connectDatabase = async (mongoUri = DATABASE_URL) => {
  if (!mongoUri) {
    throw new Error("MongoDB connection string is required");
  }

  mongoose.set("strictQuery", true);

  const connection = await mongoose.connect(mongoUri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`MongoDB connected: ${connection.connection.host}`);
  return connection;
};

export const disconnectDatabase = async () => {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
};

export { mongoose };

export default connectDatabase;
