const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];

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
