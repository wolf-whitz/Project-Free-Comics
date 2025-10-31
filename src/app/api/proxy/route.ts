import { NextRequest } from "next/server";
import { spawn, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";

async function githubPathExists(pathInRepo: string) {
  const url = `https://raw.githubusercontent.com/wolf-whitz/Project-Free-Comics/main/${pathInRepo}`;
  try {
    const r = await fetch(url, { method: "HEAD" });
    return r.status === 200;
  } catch {
    return false;
  }
}

function runCommandStream(controller: any, cmd: string, args: string[], cwd?: string) {
  controller.enqueue(`data: [RUN] ${cmd} ${args.join(" ")}\n\n`);
  const proc = spawn(cmd, args, { cwd, shell: false });

  proc.stdout.on("data", chunk => controller.enqueue(`data: ${chunk.toString()}\n\n`));
  proc.stderr.on("data", chunk => controller.enqueue(`data: ${chunk.toString()}\n\n`));

  proc.on("close", code => {
    controller.enqueue(`data: [EXIT ${code}]\n\n`);
    controller.close();
  });

  proc.on("error", err => {
    controller.enqueue(`data: [ERROR] ${err}\n\n`);
    controller.close();
  });
}

async function attemptExecuteInit(controller: any, folderPath: string) {
  const isWin = process.platform === "win32";
  const scriptPath = isWin ? path.join(folderPath, "init.bat") : path.join(folderPath, "init.sh");

  if (!fs.existsSync(scriptPath)) {
    controller.enqueue(`data: No ${isWin ? "init.bat" : "init.sh"} found in ${folderPath}\n\n`);
    controller.close();
    return;
  }

  if (!isWin) fs.chmodSync(scriptPath, 0o755);
  runCommandStream(controller, isWin ? "cmd" : "sh", isWin ? ["/c", "init.bat"] : ["-c", "./init.sh"], folderPath);
}

export async function GET(req: NextRequest) {
  const proxy = req.nextUrl.searchParams.get("proxy");
  const execute = req.nextUrl.searchParams.get("execute") === "true";

  if (!proxy) return new Response("Missing 'proxy' param", { status: 400 });

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(`data: Proxy request: ${proxy}\n\n`);

      const root = process.cwd();
      const packagesLocal = path.join(root, "packages");
      let targetPath = path.join(packagesLocal, proxy);

      if (!["FlarreSolverr", "Byparr", "Default"].includes(proxy)) {
        controller.enqueue(`data: Unsupported proxy value: ${proxy}\n\n`);
        controller.close();
        return;
      }

      if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isDirectory()) {
        const remoteExists = await githubPathExists(`packages/${proxy}`);
        if (!remoteExists) {
          controller.enqueue(`data: Package not found locally or on GitHub\n\n`);
          controller.close();
          return;
        }

        const tmpBase = fs.mkdtempSync(path.join(tmpdir(), "proxy-clone-"));

        const gitCheck = spawnSync("git", ["--version"], { encoding: "utf-8" });
        if (gitCheck.error) {
          controller.enqueue(`data: Git not available\n\n`);
          controller.close();
          return;
        }

        const clone = spawnSync(
          "git",
          ["clone", "--depth", "1", "https://github.com/wolf-whitz/Project-Free-Comics.git", tmpBase],
          { encoding: "utf-8" }
        );

        if (clone.error || clone.status !== 0) {
          controller.enqueue(`data: Failed to clone repo\n\n`);
          controller.close();
          return;
        }

        targetPath = fs.existsSync(path.join(tmpBase, "packages", proxy))
          ? path.join(tmpBase, "packages", proxy)
          : null;

        if (!targetPath) {
          controller.enqueue(`data: Package not found in cloned repo\n\n`);
          controller.close();
          return;
        }
      }

      controller.enqueue(`data: Package ready at ${targetPath}\n\n`);

      if (execute || proxy === "Default") {
        return attemptExecuteInit(controller, targetPath);
      }

      // Always check if script exists and run it if execute=true
      const isWin = process.platform === "win32";
      const scriptPath = isWin ? path.join(targetPath, "init.bat") : path.join(targetPath, "init.sh");
      if (fs.existsSync(scriptPath) && execute) {
        return attemptExecuteInit(controller, targetPath);
      }

      controller.close();
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
}
