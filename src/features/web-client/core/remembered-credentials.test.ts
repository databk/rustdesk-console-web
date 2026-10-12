/** @jest-environment node */
import { afterEach, expect, jest, test } from '@jest/globals';
import {
  RememberedCredentials,
  type CredentialPersistence,
  type CredentialBinding,
} from './remembered-credentials';
import { derivePasswordHash, challengeFromHash } from './crypto';

const originalIndexedDB = Object.getOwnPropertyDescriptor(
  globalThis,
  'indexedDB',
);
afterEach(() => {
  jest.restoreAllMocks();
  if (originalIndexedDB)
    Object.defineProperty(globalThis, 'indexedDB', originalIndexedDB);
  else Reflect.deleteProperty(globalThis, 'indexedDB');
});

class Memory implements CredentialPersistence {
  records = new Map<string, Parameters<CredentialPersistence['write']>[0]>();
  private keyValue = crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  key = () => this.keyValue;
  read = async (id: string) => this.records.get(id);
  write = async (
    value: Parameters<CredentialPersistence['write']>[0],
    valid: () => boolean,
  ) => {
    if (!valid()) return false;
    this.records.set(value.id, value);
    return true;
  };
  remove = async (id: string, valid: () => boolean = () => true) => {
    if (valid()) this.records.delete(id);
  };
}
const binding: CredentialBinding = {
  profile: {
    idServerUrl: 'wss://fixture.test/id',
    relayServerUrl: 'wss://fixture.test/relay',
    serverPublicKey: 'fixture-key',
  },
  targetId: '123456789',
  peerKey: 'fixture-peer',
  salt: 'fixture-salt',
};
function setup(memory = new Memory()) {
  const statuses = jest.fn();
  const store = new RememberedCredentials(statuses, memory);
  store.begin('fixture-account', binding.profile, binding.targetId);
  return { store, memory, statuses };
}
test('记忆H1真实AES-GCM封装，不可导出key；新实例持久回读并回答新挑战', async () => {
  const { store, memory } = setup();
  const first = await derivePasswordHash('fixture password', binding.salt);
  expect(await store.save(binding, first)).toBe(true);
  const record = [...memory.records.values()][0];
  expect(record.ciphertext.byteLength).toBe(48);
  expect(new Uint8Array(record.ciphertext)).not.toEqual(first);
  expect((await memory.key()).extractable).toBe(false);
  await expect(
    crypto.subtle.exportKey('raw', await memory.key()),
  ).rejects.toThrow();
  const next = setup(memory).store;
  const restored = await next.load(binding);
  expect(restored).toEqual(first);
  if (!restored) throw new Error('派生凭据未恢复');
  expect(await challengeFromHash(restored, 'new challenge')).not.toEqual(
    await challengeFromHash(first, 'old challenge'),
  );
  expect(await challengeFromHash(restored, 'new challenge')).toEqual(
    await challengeFromHash(first, 'new challenge'),
  );
});
test('账号、服务器公钥、ID隔离，盐或设备身份变化删除失效材料', async () => {
  const { store, memory } = setup();
  await store.save(binding, new Uint8Array(32).fill(7));
  for (const [account, profile, id] of [
    ['other-account', binding.profile, binding.targetId],
    [
      'fixture-account',
      { ...binding.profile, serverPublicKey: 'other-key' },
      binding.targetId,
    ],
    ['fixture-account', binding.profile, '987654321'],
  ] as const) {
    store.begin(account, profile, id);
    expect(
      await store.load({ ...binding, profile, targetId: id }),
    ).toBeUndefined();
  }
  store.begin('fixture-account', binding.profile, binding.targetId);
  expect(
    await store.load({ ...binding, salt: 'changed-salt' }),
  ).toBeUndefined();
  expect(memory.records.size).toBe(0);
  await store.save(binding, new Uint8Array(32).fill(8));
  expect(
    await store.load({ ...binding, peerKey: 'changed-peer' }),
  ).toBeUndefined();
  expect(memory.records.size).toBe(0);
});
test('清除期间未完成的加密不能复活，切账号后的迟到读取不能暴露H1', async () => {
  const { store, memory } = setup();
  const key = await memory.key();
  let finish!: (value: CryptoKey) => void;
  memory.key = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  const save = store.save(binding, new Uint8Array(32).fill(9));
  while (!finish) await new Promise((resolve) => setImmediate(resolve));
  await store.forget();
  finish(key);
  expect(await save).toBe(false);
  expect(memory.records.size).toBe(0);
  memory.key = async () => key;
  await store.save(binding, new Uint8Array(32).fill(10));
  let release!: (value: CryptoKey) => void;
  memory.key = () =>
    new Promise((resolve) => {
      release = resolve;
    });
  const load = store.load(binding);
  while (!release) await new Promise((resolve) => setImmediate(resolve));
  store.begin('other-account', binding.profile, binding.targetId);
  release(key);
  expect(await load).toBeUndefined();
});
test('损坏封装删除并回退，无存储或缺账号不改成明文保存', async () => {
  const { store, memory, statuses } = setup();
  await store.save(binding, new Uint8Array(32).fill(11));
  const record = [...memory.records.values()][0];
  new Uint8Array(record.ciphertext)[0] ^= 1;
  expect(await store.load(binding)).toBeUndefined();
  expect(memory.records.size).toBe(0);
  expect(statuses).toHaveBeenLastCalledWith('unavailable');
  store.begin(undefined, binding.profile, binding.targetId);
  expect(await store.save(binding, new Uint8Array(32))).toBe(false);
  expect(memory.records.size).toBe(0);
});

// 可控 IDL 事务替身：put 只排队，必须等 complete 才提交；abort 丢弃全部更改。
// 这里检查生产 IndexedCredentials 的事务控制，不冒充真实浏览器 IndexedDB。
async function indexedFixture() {
  type Stored = Parameters<CredentialPersistence['write']>[0];
  const records = new Map<string, Stored>();
  let key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  const fixture = {
    records,
    afterPut: () => {},
    opened: 0,
    closed: 0,
    puts: 0,
    aborts: 0,
  };
  const open = () => {
    fixture.opened++;
    const database = {
      close: () => fixture.closed++,
      transaction: (name: string) => {
        const staged = new Map(records);
        let currentKey = key;
        let ended = false;
        let scheduled = false;
        const complete = () => {
          if (scheduled) return;
          scheduled = true;
          setImmediate(() => {
            if (ended) return;
            ended = true;
            if (name === 'records') {
              records.clear();
              for (const [id, value] of staged) records.set(id, value);
            } else key = currentKey;
            tx.oncomplete?.();
          });
        };
        const request = (result: unknown) => {
          const value: { result: unknown; onsuccess?: () => void } = { result };
          setImmediate(() => {
            if (ended) return;
            value.onsuccess?.();
            complete();
          });
          return value;
        };
        const store = {
          get: (id: string) => request(name === 'keys' ? key : staged.get(id)),
          getAll: () => request([...staged.values()]),
          put: (value: Stored | CryptoKey) => {
            if (name === 'records') {
              const record = value as Stored;
              staged.set(record.id, record);
              fixture.puts++;
              fixture.afterPut();
            } else currentKey = value as CryptoKey;
            complete();
          },
          delete: (id: string) => {
            staged.delete(id);
            complete();
          },
        };
        const tx: {
          oncomplete?: () => void;
          onabort?: () => void;
          onerror?: () => void;
          objectStore: () => typeof store;
          abort: () => void;
        } = {
          objectStore: () => store,
          abort: () => {
            if (ended) throw new Error('Transaction finished');
            ended = true;
            fixture.aborts++;
            setImmediate(() => tx.onabort?.());
          },
        };
        return tx;
      },
    };
    const value: { result: typeof database; onsuccess?: () => void } = {
      result: database,
    };
    setImmediate(() => value.onsuccess?.());
    return value;
  };
  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    value: { open } as unknown as IDBFactory,
  });
  return fixture;
}

test.each(['cancel', 'account', 'forget'] as const)(
  '真实持久化实现put排队后、commit前%s回滚旧事务，不报当前存储故障',
  async (action) => {
    const fixture = await indexedFixture();
    const statuses = jest.fn();
    const store = new RememberedCredentials(statuses);
    store.begin('fixture-account', binding.profile, binding.targetId);
    let forgetting: Promise<void> | undefined;
    fixture.afterPut = () => {
      if (action === 'cancel') store.cancel();
      else if (action === 'account')
        store.begin('other-account', binding.profile, binding.targetId);
      else forgetting = store.forget();
    };
    expect(await store.save(binding, new Uint8Array(32).fill(12))).toBe(false);
    await forgetting;
    expect(fixture.puts).toBe(1);
    expect(fixture.aborts).toBe(1);
    expect(fixture.records.size).toBe(0);
    expect(fixture.closed).toBe(fixture.opened);
    expect(statuses).not.toHaveBeenCalledWith('unavailable');
    expect(statuses).not.toHaveBeenCalledWith('saved');
  },
);

test('正常提交后解除abort监听，之后cancel不会撤销已保存记录', async () => {
  const fixture = await indexedFixture();
  const remove = jest.spyOn(AbortSignal.prototype, 'removeEventListener');
  const statuses = jest.fn();
  const store = new RememberedCredentials(statuses);
  store.begin('fixture-account', binding.profile, binding.targetId);
  const first = new Uint8Array(32).fill(13);
  expect(await store.save(binding, first)).toBe(true);
  expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
  expect(fixture.closed).toBe(fixture.opened);
  store.cancel();
  expect(fixture.aborts).toBe(0);
  expect(fixture.records.size).toBe(1);
  expect(await store.load(binding)).toEqual(first);
  expect(fixture.closed).toBe(fixture.opened);
});
