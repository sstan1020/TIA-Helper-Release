import net from "net";

const PIPE_PATH = "\\\\.\\pipe\\tia_helper";
const CONNECT_TIMEOUT_MS = 10000;

// Mirrors TiaWpf/PipeServer.cs exactly: connect, write one line, read one line back,
// disconnect. One request per connection - there is no persistent session, matching the
// same protocol tia.ps1 and any other pipe client already uses.
export function sendCommand(command) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(PIPE_PATH);
    let response = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(new Error("Timed out waiting for TIA Helper to respond - is it running?"));
    }, CONNECT_TIMEOUT_MS);

    socket.on("connect", () => {
      socket.write(command + "\n");
    });

    socket.on("data", (chunk) => {
      response += chunk.toString("utf8");
    });

    socket.on("end", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(response.replace(/\r?\n$/, ""));
    });

    socket.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error("Could not reach TIA Helper's pipe (" + err.message + ") - is the app running?"));
    });
  });
}
