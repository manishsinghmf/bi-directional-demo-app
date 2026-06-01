import { Response } from "express";

type EventPayload = unknown;

class EventBus {
  private clients = new Set<Response>();

  addClient(res: Response): void {
    this.clients.add(res);
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    });
    res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);
    res.on("close", () => this.clients.delete(res));
  }

  emit(type: string, payload: EventPayload): void {
    const data = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const client of this.clients) {
      client.write(data);
    }
  }
}

export const eventBus = new EventBus();
