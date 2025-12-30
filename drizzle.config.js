/** @type{ import("drizzle-kit").Config} */
export default {
    schema:"./utils/schema.js",
    dialect:"postgresql",
    dbCredentials:{
        url:'postgresql://neondb_owner:npg_ey8aW5INfsKC@ep-lucky-boat-ad1vbj7z-pooler.c-2.us-east-1.aws.neon.tech/ai-interview-prep?sslmode=require&channel_binding=require',
    }
};