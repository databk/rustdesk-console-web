import { afterEach, expect, jest, test } from "@jest/globals";
import { request } from "@umijs/max";
import { deleteDevice, updateDevice } from "./device";
import { disconnectConnection } from "./audit";

jest.mock("@umijs/max", () => ({ request: jest.fn() }));
const mockedRequest = jest.mocked(request);

afterEach(() => {
  jest.clearAllMocks();
});

test("encodes device identifiers used as path segments", async () => {
  mockedRequest.mockResolvedValue({});
  const guid = "abc/def+g==";

  await updateDevice(guid, { note: "updated" });
  await deleteDevice(guid);
  await disconnectConnection(guid, [3]);

  expect(mockedRequest).toHaveBeenNthCalledWith(
    1,
    "/api/devices/abc%2Fdef%2Bg%3D%3D",
    { method: "PATCH", data: { note: "updated" } },
  );
  expect(mockedRequest).toHaveBeenNthCalledWith(
    2,
    "/api/devices/abc%2Fdef%2Bg%3D%3D",
    { method: "DELETE" },
  );
  expect(mockedRequest).toHaveBeenNthCalledWith(
    3,
    "/api/devices/abc%2Fdef%2Bg%3D%3D/disconnect",
    { method: "POST", data: { connIds: [3] } },
  );
});
