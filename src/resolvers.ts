import {
  getReleases,
  getReleaseById,
  createRelease,
  updateRelease,
  deleteRelease,
} from "./services";
import { initDb } from "./db";
import { z } from "zod";

let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
  }
}

const CreateReleaseSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  date: z.string().min(1, "Date is required"),
  additionalInfo: z.string().optional(),
});

const UpdateReleaseSchema = z.object({
  id: z.string().uuid(),
  additionalInfo: z.string().nullable().optional(),
  stepsCompleted: z.array(z.number().int().min(0)).optional(),
});

export const resolvers = {
  Query: {
    releases: async () => {
      await ensureDb();
      return getReleases();
    },
    release: async (_: unknown, { id }: { id: string }) => {
      await ensureDb();
      return getReleaseById(id);
    },
  },
  Mutation: {
    createRelease: async (
      _: unknown,
      args: { name: string; date: string; additionalInfo?: string }
    ) => {
      await ensureDb();
      const input = CreateReleaseSchema.parse(args);
      return createRelease(input);
    },
    updateRelease: async (
      _: unknown,
      args: { id: string; additionalInfo?: string; stepsCompleted?: number[] }
    ) => {
      await ensureDb();
      const input = UpdateReleaseSchema.parse(args);
      const release = await updateRelease(input);
      if (!release) throw new Error("Release not found");
      return release;
    },
    deleteRelease: async (_: unknown, { id }: { id: string }) => {
      await ensureDb();
      return deleteRelease(id);
    },
  },
};
