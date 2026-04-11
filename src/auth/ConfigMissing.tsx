export default function ConfigMissing() {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">Configuration needed</h1>
        <p className="auth-subtitle">
          Add your Supabase project URL and anon key to a{" "}
          <code className="auth-code">.env</code> file in the project root:
        </p>
        <pre className="auth-pre">
          {`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
        </pre>
        <p className="auth-subtitle" style={{ marginTop: "1rem" }}>
          Then run <code className="auth-code">npm run dev</code> again. See{" "}
          <code className="auth-code">SUPABASE_SETUP.md</code> for the database
          schema and Auth settings.
        </p>
      </div>
    </div>
  );
}
