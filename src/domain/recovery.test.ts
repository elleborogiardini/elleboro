import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { describe, expect, it } from "vitest";
import { recoveryHash, recoveryHandoff, recoveryLetter, recoveryRecipient, recoveryRedirect } from "@/domain/recovery";
import { mailpitMessage, sendPlainMail } from "@/lib/mail";

describe("recupero password", () => {
  it("il link parte solo verso la mail personale salvata dal proprietario", () => {
    expect(
      recoveryRecipient({
        role: "owner",
        saved: "personale@example.com",
        requested: " Personale@example.com ",
      }),
    ).toBe("personale@example.com");
    expect(
      recoveryRecipient({
        role: "technician",
        saved: "tech@example.com",
        requested: "tech@example.com",
      }),
    ).toBeNull();
    expect(
      recoveryRecipient({
        role: "owner",
        saved: "personale@example.com",
        requested: "altro@example.com",
      }),
    ).toBeNull();
    expect(
      recoveryRecipient({ role: "owner", saved: null, requested: "personale@example.com" }),
    ).toBeNull();
  });

  it("la lettera arriva sulla mail personale e non rivela l'email di accesso", () => {
    const letter = recoveryLetter({
      to: "personale@example.com",
      link: "https://example.com/verify",
    });
    expect(letter.to).toBe("personale@example.com");
    expect(mailpitMessage(letter).To).toEqual([{ Email: "personale@example.com" }]);
    expect(letter.text).toContain("https://example.com/verify");
    expect(`${letter.subject}\n${letter.text}`).not.toContain("owner@example.com");
  });

  it("il frammento del recupero apre la pagina della nuova password", () => {
    const hash = "#access_token=a&refresh_token=b&type=recovery";
    expect(recoveryHash(hash)).toEqual({ kind: "ready", accessToken: "a", refreshToken: "b" });
    expect(recoveryHandoff("/", hash)).toBe(`/login/nuova${hash}`);
    expect(recoveryHandoff("/login/nuova", hash)).toBeNull();
    expect(recoveryHash("#error=access_denied&error_code=otp_expired").kind).toBe("expired");
    const form = readFileSync("src/app/login/nuova/form.tsx", "utf8");
    expect(form).toContain("recoveryHash");
    expect(form).toContain('flowType: "implicit"');
    expect(form).toContain("Questo link non è più valido.");
    expect(readFileSync("src/app/layout.tsx", "utf8")).toContain("RecoveryHandoff");
  });

  it("il link di ritorno resta sulla pagina della nuova password", () => {
    expect(recoveryRedirect("http://127.0.0.1:3000")).toBe("http://127.0.0.1:3000/login/nuova");
    expect(recoveryRedirect("https://giardini.example")).toBe("https://giardini.example/login/nuova");
    expect(recoveryRedirect("http://giardini.example")).toBeNull();
    expect(recoveryRedirect("javascript:alert(1)")).toBeNull();
  });

  it("la pagina pubblica non legge la mail personale", () => {
    const page = readFileSync("src/app/login/recupero/page.tsx", "utf8");
    expect(page).not.toContain("owner_recovery");
    expect(page).not.toContain("profiles");
    expect(readFileSync("src/app/login/page.tsx", "utf8")).toContain('href="/login/recupero"');
  });

  it("il messaggio smtp ha come destinatario la mail personale", async () => {
    const server = createServer((socket) => {
      let body = "";
      let closed = false;
      socket.write("220 ready\r\n");
      socket.on("data", (chunk) => {
        if (closed) return;
        body += chunk.toString();
        const line = chunk.toString();
        if (line.startsWith("DATA")) socket.write("354 go\r\n");
        else if (body.includes("\r\n.\r\n")) {
          closed = true;
          socket.end("250 ok\r\n");
          server.close();
        } else socket.write("250 ok\r\n");
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("porta");
    const received = new Promise<string>((resolve) => {
      server.on("connection", () => undefined);
      const chunks: string[] = [];
      server.prependListener("connection", (socket) => {
        socket.on("data", (chunk) => chunks.push(chunk.toString()));
        socket.on("end", () => resolve(chunks.join("")));
      });
    });
    await sendPlainMail({
      host: "127.0.0.1",
      port: address.port,
      from: "noreply@localhost",
      to: "personale@example.com",
      subject: "Nuova password",
      text: "Apri https://example.com/verify",
    });
    const transcript = await received;
    expect(transcript).toContain("RCPT TO:<personale@example.com>");
    expect(transcript).toContain("Apri https://example.com/verify");
    expect(transcript).not.toContain("owner@example.com");
  });
});
