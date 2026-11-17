import { connect } from "node:net";

const fromAddress = "noreply@localhost";

export function mailpitMessage(letter: { to: string; subject: string; text: string }) {
  return {
    From: { Email: fromAddress, Name: "Elleboro" },
    To: [{ Email: letter.to }],
    Subject: letter.subject,
    Text: letter.text,
  };
}

export async function deliverRecoveryMail(letter: { to: string; subject: string; text: string }) {
  const host = process.env.RECOVERY_SMTP_HOST;
  if (host) {
    await sendPlainMail({
      host,
      port: Number(process.env.RECOVERY_SMTP_PORT || 587),
      from: fromAddress,
      to: letter.to,
      subject: letter.subject,
      text: letter.text,
    });
    return;
  }
  const response = await fetch(process.env.RECOVERY_MAILPIT_URL || "http://127.0.0.1:54324/api/v1/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(mailpitMessage(letter)),
  });
  if (!response.ok) throw new Error("mail non inviata");
}

export function sendPlainMail(input: {
  host: string;
  port: number;
  from: string;
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const commands = [
    "EHLO elleboro",
    `MAIL FROM:<${input.from}>`,
    `RCPT TO:<${input.to}>`,
    "DATA",
  ];
  const message = [
    `From: Elleboro <${input.from}>`,
    `To: ${input.to}`,
    `Subject: ${input.subject.replace(/[\r\n]/g, " ")}`,
    "",
    input.text.replace(/\n/g, "\r\n").replace(/^\./gm, ".."),
    ".",
    "",
  ].join("\r\n");

  return new Promise((resolve, reject) => {
    const socket = connect({ host: input.host, port: input.port });
    let buffer = "";
    let sentBody = false;
    let settled = false;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(error);
    };
    const succeed = () => {
      if (settled) return;
      settled = true;
      socket.end("QUIT\r\n");
      resolve();
    };
    socket.setTimeout(4000, () => fail(new Error("smtp fermo")));
    socket.on("error", (error) => fail(error));
    socket.on("data", (chunk) => {
      buffer += chunk.toString();
      if (!buffer.endsWith("\n")) return;
      const reply = buffer;
      buffer = "";
      const code = Number(reply.slice(0, 3));
      if (code >= 400) {
        fail(new Error(reply.trim()));
        return;
      }
      if (code === 354) {
        sentBody = true;
        socket.write(message);
        return;
      }
      if (sentBody) {
        succeed();
        return;
      }
      const next = commands.shift();
      if (!next) return;
      socket.write(`${next}\r\n`);
    });
  });
}
