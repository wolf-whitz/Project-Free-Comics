import { NextRequest } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";

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

async function fetchAndRunScript(controller: any, proxy: string) {
  const isWin = process.platform === "win32";
  const fileName = isWin ? "init.bat" : "install.sh";
  const rawUrl = `https://raw.githubusercontent.com/wolf-whitz/Project-Free-Comics/main/packages/${proxy}/${fileName}`;

  const tmpDir = fs.mkdtempSync(path.join(tmpdir(), "proxy-script-"));
  const filePath = path.join(tmpDir, fileName);

  try {
    const res = await fetch(rawUrl);
    if (!res.ok) {
      controller.enqueue(`data: Script not found on GitHub: ${fileName}\n\n`);
      controller.close();
      return;
    }

    const content = await res.text();
    fs.writeFileSync(filePath, content, { mode: 0o755 });
  } catch (err) {
    controller.enqueue(`data: Failed to fetch script: ${err}\n\n`);
    controller.close();
    return;
  }

  runCommandStream(controller, isWin ? "cmd" : "sh", isWin ? ["/c", fileName] : ["-c", `./${fileName}`], tmpDir);
}

export async function GET(req: NextRequest) {
  const proxy = req.nextUrl.searchParams.get("proxy");
  const execute = req.nextUrl.searchParams.get("execute") === "true";

  if (!proxy) return new Response("Missing 'proxy' param", { status: 400 });
  if (!["FlarreSolverr", "Byparr", "Default"].includes(proxy)) {
    return new Response("Unsupported proxy value", { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(`data: Proxy request: ${proxy}\n\n`);

      if (execute || proxy === "Default") {
        await fetchAndRunScript(controller, proxy);
      } else {
        controller.enqueue(`data: Script ready but not executed\n\n`);
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
}
