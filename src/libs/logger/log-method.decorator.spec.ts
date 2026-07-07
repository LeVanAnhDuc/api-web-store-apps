// others
import { Logger } from "./index";
import { LogMethod } from "./log-method.decorator";
import { RequestContext } from "@/utils/request-context";

describe("LogMethod", () => {
  let infoSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    infoSpy = jest.spyOn(Logger, "info").mockImplementation(() => undefined);
    errorSpy = jest.spyOn(Logger, "error").mockImplementation(() => undefined);
    jest.spyOn(RequestContext, "getRequestId").mockReturnValue("req-xyz");
  });

  afterEach(() => jest.restoreAllMocks());

  class Sample {
    @LogMethod({ name: "DoWork", fields: ["email"] })
    async work(body: { email: string; password: string }): Promise<string> {
      return `ok:${body.email}`;
    }

    @LogMethod({ fields: ["body.email"] })
    async nested(req: { body: { email: string } }): Promise<number> {
      return req.body.email.length;
    }

    @LogMethod({ name: "Boom" })
    async fails(): Promise<void> {
      throw new Error("kaboom");
    }

    @LogMethod({ name: "Container", fields: ["body"] })
    async container(req: { body: { email: string } }): Promise<string> {
      return `ok:${req.body.email}`;
    }
  }

  it("logs initiated + completed with opt-in field, requestId, durationMs; passes result through", async () => {
    const out = await new Sample().work({
      email: "a@b.com",
      password: "secret"
    });
    expect(out).toBe("ok:a@b.com");

    expect(infoSpy).toHaveBeenNthCalledWith(1, "DoWork initiated", {
      email: "a@b.com",
      requestId: "req-xyz"
    });
    const [msg, meta] = infoSpy.mock.calls[1];
    expect(msg).toBe("DoWork completed");
    expect(meta).toMatchObject({ email: "a@b.com", requestId: "req-xyz" });
    expect(typeof meta.durationMs).toBe("number");
  });

  it("does NOT log fields that were not opted in (no credential leak)", async () => {
    await new Sample().work({ email: "a@b.com", password: "secret" });
    const allMeta = JSON.stringify(infoSpy.mock.calls);
    expect(allMeta).not.toContain("secret");
    expect(allMeta).not.toContain("password");
  });

  it("resolves dot-path fields from the first argument", async () => {
    await new Sample().nested({ body: { email: "deep@b.com" } });
    expect(infoSpy).toHaveBeenNthCalledWith(1, "Sample.nested initiated", {
      email: "deep@b.com",
      requestId: "req-xyz"
    });
  });

  it("logs failed + rethrows original error, does not log completed", async () => {
    await expect(new Sample().fails()).rejects.toThrow("kaboom");
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const [msg, err, meta] = errorSpy.mock.calls[0];
    expect(msg).toBe("Boom failed");
    expect(err).toBeInstanceOf(Error);
    expect(typeof meta.durationMs).toBe("number");
    expect(infoSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("completed"),
      expect.anything()
    );
  });

  it("falls back to ClassName.method label when name omitted", async () => {
    await new Sample().nested({ body: { email: "x@y.com" } });
    expect(infoSpy.mock.calls[0][0]).toBe("Sample.nested initiated");
  });

  it("skips non-primitive field values — never dumps a container object", async () => {
    const out = await new Sample().container({ body: { email: "a@b.com" } });
    expect(out).toBe("ok:a@b.com");
    // "body" resolves to an object → not logged; only requestId remains.
    expect(infoSpy).toHaveBeenNthCalledWith(1, "Container initiated", {
      requestId: "req-xyz"
    });
  });

  it("never breaks the business flow if logging itself throws", async () => {
    infoSpy.mockImplementation(() => {
      throw new Error("logger down");
    });
    const out = await new Sample().work({ email: "a@b.com", password: "x" });
    expect(out).toBe("ok:a@b.com");
  });
});
