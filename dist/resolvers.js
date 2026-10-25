"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const services_1 = require("./services");
const db_1 = require("./db");
const zod_1 = require("zod");
let dbInitialized = false;
async function ensureDb() {
    if (!dbInitialized) {
        await (0, db_1.initDb)();
        dbInitialized = true;
    }
}
const CreateReleaseSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required").max(255),
    date: zod_1.z.string().min(1, "Date is required"),
    additionalInfo: zod_1.z.string().optional(),
});
const UpdateReleaseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    additionalInfo: zod_1.z.string().nullable().optional(),
    stepsCompleted: zod_1.z.array(zod_1.z.number().int().min(0)).optional(),
});
exports.resolvers = {
    Query: {
        releases: async () => {
            await ensureDb();
            return (0, services_1.getReleases)();
        },
        release: async (_, { id }) => {
            await ensureDb();
            return (0, services_1.getReleaseById)(id);
        },
    },
    Mutation: {
        createRelease: async (_, args) => {
            await ensureDb();
            const input = CreateReleaseSchema.parse(args);
            return (0, services_1.createRelease)(input);
        },
        updateRelease: async (_, args) => {
            await ensureDb();
            const input = UpdateReleaseSchema.parse(args);
            const release = await (0, services_1.updateRelease)(input);
            if (!release)
                throw new Error("Release not found");
            return release;
        },
        deleteRelease: async (_, { id }) => {
            await ensureDb();
            return (0, services_1.deleteRelease)(id);
        },
    },
};
