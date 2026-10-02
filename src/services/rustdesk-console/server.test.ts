import { afterEach, expect, jest, test } from "@jest/globals";
import { request } from "@umijs/max";
import {
  controlServer,
  disconnectRelaySession,
  getServerNodes,
  saveServerBans,
  saveServerConfig,
} from "./server";

jest.mock("@umijs/max", () => ({ request: jest.fn() }));
const mockedRequest = jest.mocked(request);
afterEach(() => {
  jest.clearAllMocks();
});

test("calls only the Console proxy and encodes identifiers", async () => {
  mockedRequest.mockResolvedValue({});
  await getServerNodes();
  await disconnectRelaySession("node/name", "session/uuid");
  expect(mockedRequest).toHaveBeenNthCalledWith(1, "/api/servers");
  expect(mockedRequest).toHaveBeenNthCalledWith(
    2,
    "/api/servers/node%2Fname/sessions/session%2Fuuid",
    { method: "DELETE" },
  );
});

test("distinguishes saving settings from applying them and uses the versioned policy shape", async () => {
  mockedRequest.mockResolvedValue({});
  await saveServerConfig("local", "hbbs", { port: "21116" });
  await controlServer("local", "hbbs", "apply");
  await saveServerBans("local", { device_ids: ["123456"], ips: ["192.0.2.1"] });
  expect(mockedRequest).toHaveBeenNthCalledWith(
    1,
    "/api/servers/local/services/hbbs/config",
    { method: "PUT", data: { values: { port: "21116" } } },
  );
  expect(mockedRequest).toHaveBeenNthCalledWith(
    2,
    "/api/servers/local/services/hbbs/apply",
    { method: "POST", timeout: 240000 },
  );
  expect(mockedRequest).toHaveBeenNthCalledWith(3, "/api/servers/local/bans", {
    method: "PUT",
    data: { device_ids: ["123456"], ips: ["192.0.2.1"] },
  });
});
