const required = ["https://cahnulqfdxpubqnvnqim.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhaG51bHFmZHhwdWJxbnZucWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MDMwNzcsImV4cCI6MjA4ODM3OTA3N30.KrRMwJpcyh2AqkKrHdxh4nlQPO1iNkzIo0D1rwLA978"];

const missing = required.filter((name) => {
  const value = process.env[name];
  return !value || !String(value).trim();
});

if (missing.length > 0) {
  console.error("Missing required deploy environment variables:");
  for (const name of missing) {
    console.error(`- ${name}`);
  }
  console.error("Configure these variables in your deploy provider before building.");
  process.exit(1);
}

console.log("Supabase deploy environment variables detected.");
