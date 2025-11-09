import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export type GameType =
  | "phishing"
  | "loophole"
  | "judge"
  | "architect"
  | "veo"
  | "laws";

export interface IUser extends Document {
  email: string;
  password: string;
  role: "user" | "admin";
  level: number;
  badges: string[];
  createdAt: Date;
  lastLogin: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  level: {
    type: Number,
    default: 1,
  },
  badges: [
    {
      type: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);
