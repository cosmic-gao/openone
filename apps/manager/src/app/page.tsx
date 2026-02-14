import { cookies } from "next/headers";

import { createSigner } from "@openone/authentication";

function getCookie() {
  return process.env.SESSION_COOKIE || "openone_session";
}

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is required.");
  }
  return secret;
}

function getPermission() {
  return process.env.PERMISSION_URL || "http://localhost:3002";
}

function getCenter() {
  return process.env.DATABASE_CENTER_URL || "http://localhost:3003";
}

function getLink(key: string) {
  if (key === "manager") {
    return "http://localhost:3001";
  }
  if (key === "permission") {
    return getPermission();
  }
  if (key === "database-center") {
    return getCenter();
  }
  return null;
}

async function getUser() {
  const store = await cookies();
  const token = store.get(getCookie())?.value;
  if (!token) {
    return null;
  }

  const signer = createSigner({ secret: getSecret(), cookieName: getCookie() });
  const session = signer.verify(token);
  return session.isSuccess ? session.value : null;
}

async function getApps() {
  const store = await cookies();
  const token = store.get(getCookie())?.value;
  if (!token) {
    return [];
  }

  const response = await fetch(`${getPermission()}/api/permission-set?applicationKey=manager`, {
    headers: { cookie: `${getCookie()}=${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const result = (await response.json()) as { codes?: Array<string> };
  const codes = result.codes || [];

  const keys = new Set<string>();
  for (const code of codes) {
    const [key, resource, action] = code.split(":");
    if (resource === "app" && action === "use" && key) {
      keys.add(key);
    }
  }

  return [...keys];
}

export default async function Page() {
  const user = await getUser();
  const apps = await getApps();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Manager</h1>
        <p className="text-sm text-muted-foreground">User: {user?.userId || "unknown"}</p>
      </header>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium">My applications</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {apps.map((key) => {
            const link = getLink(key);
            if (!link) {
              return null;
            }
            return (
              <a
                key={key}
                href={link}
                className="rounded-md border border-border bg-background p-4 text-sm hover:bg-accent"
              >
                {key}
              </a>
            );
          })}
        </div>
      </section>
    </main>
  );
}
