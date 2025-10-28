import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "delete"
  | "patch"
  | "options"
  | "head";

interface DiscoveredRoute {
  method: HttpMethod;
  path: string;
  file: string;
}

export class RouteDiscovery {
  constructor(private rootDir: string) {}

  async registerWithOpenAPI(registry: any, apiPrefix: string): Promise<void> {
    const routes = await this.discoverRoutes();

    for (const r of routes) {
      const apiBase = apiPrefix.endsWith("/")
        ? apiPrefix.slice(0, -1)
        : apiPrefix;
      const routePath = r.path.startsWith("/") ? r.path : `/${r.path}`;
      const fullPath = `${apiBase}${routePath}`;
      const tag = this.deriveTagFromFile(r.file);

      try {
        registry.registerPath({
          method: r.method,
          path: fullPath,
          tags: tag ? [tag] : undefined,
          responses: {
            200: {
              description: "Success",
            },
          },
        });
      } catch (_) {}
    }
  }

  private async discoverRoutes(): Promise<DiscoveredRoute[]> {
    const routesDir = join(this.rootDir, "routes");
    const entries = await readdir(routesDir, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && /\.ts$/.test(e.name))
      .map((e) => join(routesDir, e.name));

    const discovered: DiscoveredRoute[] = [];

    for (const file of files) {
      try {
        const content = await readFile(file, "utf8");
        const regex =
          /router\.(get|post|put|delete|patch|options|head)\(\s*(["'])([^"']+)\2/g;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(content))) {
          const method = match[1] as HttpMethod;
          const path = match[3];
          discovered.push({ method, path, file: relative(this.rootDir, file) });
        }
      } catch (_) {
        // ignore
      }
    }

    return discovered;
  }

  private deriveTagFromFile(fileRelToSrc: string): string | undefined {
    const base = fileRelToSrc.split("/").pop() || "";
    const name = base.replace(/\.routes\.ts$/, "").replace(/\.ts$/, "");
    if (!name) return undefined;
    return name
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  }
}
