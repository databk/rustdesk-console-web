import type { ServerProfile } from './profile';
import { normalizeTargetId } from './profile';

export type CredentialStatus = 'none' | 'saved' | 'forgotten' | 'unavailable';
export type CredentialBinding = {
  profile: ServerProfile;
  targetId: string;
  peerKey: string;
  salt: string;
};
type RecordValue = {
  id: string;
  peerKey: string;
  salt: string;
  iv: Uint8Array;
  ciphertext: ArrayBuffer;
  updated: number;
};
export interface CredentialPersistence {
  key(): Promise<CryptoKey>;
  read(id: string): Promise<RecordValue | undefined>;
  write(
    value: RecordValue,
    valid: () => boolean,
    signal?: AbortSignal,
  ): Promise<boolean>;
  remove(id: string, valid?: () => boolean): Promise<void>;
}

class IndexedCredentials implements CredentialPersistence {
  private async database() {
    return new Promise<IDBDatabase>((resolve, reject) => {
      if (!globalThis.indexedDB) {
        reject(new Error('Storage unavailable'));
        return;
      }
      const request = indexedDB.open('rustdesk-web-credentials', 1);
      let ended = false;
      const timer = setTimeout(() => {
        ended = true;
        reject(new Error('Storage timeout'));
      }, 3000);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('records', { keyPath: 'id' });
        request.result.createObjectStore('keys');
      };
      request.onsuccess = () => {
        clearTimeout(timer);
        if (ended) request.result.close();
        else {
          ended = true;
          resolve(request.result);
        }
      };
      request.onerror = request.onblocked = () => {
        clearTimeout(timer);
        ended = true;
        reject(new Error('Storage unavailable'));
      };
    });
  }
  private async transaction<T>(
    store: string,
    mode: IDBTransactionMode,
    work: (value: IDBObjectStore, result: (value: T) => void) => void,
    signal?: AbortSignal,
  ) {
    const db = await this.database();
    try {
      return await new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        let value: T;
        const abort = () => {
          try {
            tx.abort();
          } catch {
            /* 已提交的事务无需再次中止。 */
          }
        };
        const cleanup = () => signal?.removeEventListener('abort', abort);
        tx.oncomplete = () => {
          cleanup();
          resolve(value);
        };
        tx.onabort = tx.onerror = () => {
          cleanup();
          reject(new Error('Storage transaction failed'));
        };
        signal?.addEventListener('abort', abort, { once: true });
        if (signal?.aborted) {
          abort();
          return;
        }
        try {
          work(tx.objectStore(store), (next) => {
            value = next;
          });
        } catch {
          cleanup();
          abort();
          reject(new Error('Storage transaction failed'));
        }
      });
    } finally {
      db.close();
    }
  }
  async key() {
    const candidate = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
    return this.transaction<CryptoKey>('keys', 'readwrite', (store, result) => {
      const request = store.get('local');
      request.onsuccess = () => {
        const key = request.result as CryptoKey | undefined;
        if (!key) store.put(candidate, 'local');
        result(key || candidate);
      };
    });
  }
  read(id: string) {
    return this.transaction<RecordValue | undefined>(
      'records',
      'readonly',
      (store, result) => {
        const request = store.get(id);
        request.onsuccess = () =>
          result(request.result as RecordValue | undefined);
      },
    );
  }
  write(value: RecordValue, valid: () => boolean, signal?: AbortSignal) {
    return this.transaction<boolean>(
      'records',
      'readwrite',
      (store, result) => {
        if (!valid()) {
          result(false);
          return;
        }
        const request = store.getAll();
        request.onsuccess = () => {
          if (!valid()) {
            result(false);
            return;
          }
          const entries = (request.result as RecordValue[])
            .filter((item) => item.id !== value.id)
            .sort((a, b) => a.updated - b.updated);
          for (const entry of entries.slice(
            0,
            Math.max(0, entries.length - 99),
          ))
            store.delete(entry.id);
          store.put(value);
          result(true);
        };
      },
      signal,
    );
  }
  remove(id: string, valid: () => boolean = () => true) {
    return this.transaction<void>('records', 'readwrite', (store, result) => {
      if (valid()) store.delete(id);
      result(undefined);
    });
  }
}

// H1是密码等价材料；本地加密封装不抵御同源恶意脚本。
export class RememberedCredentials {
  private epoch = 0;
  private scope?: string;
  private target?: string;
  private saves = new Set<AbortController>();
  constructor(
    private readonly status: (value: CredentialStatus) => void,
    private readonly persistence: CredentialPersistence = new IndexedCredentials(),
  ) {}
  begin(account: string | undefined, profile: ServerProfile, targetId: string) {
    this.cancel();
    this.scope =
      account && account.length <= 256
        ? JSON.stringify([
            account,
            profile.idServerUrl,
            profile.relayServerUrl,
            profile.serverPublicKey,
            normalizeTargetId(targetId),
          ])
        : undefined;
    this.target = JSON.stringify([
      profile.idServerUrl,
      profile.relayServerUrl,
      profile.serverPublicKey,
      normalizeTargetId(targetId),
    ]);
    this.status('none');
  }
  cancel() {
    ++this.epoch;
    for (const save of this.saves) save.abort();
    this.saves.clear();
  }
  private async index() {
    if (!this.scope) throw new Error('No account');
    const digest = new Uint8Array(
      await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(this.scope),
      ),
    );
    return Array.from(digest, (value) =>
      value.toString(16).padStart(2, '0'),
    ).join('');
  }
  private aad(
    id: string,
    binding: Pick<CredentialBinding, 'peerKey' | 'salt'>,
  ) {
    return new TextEncoder().encode(
      JSON.stringify([id, binding.peerKey, binding.salt]),
    );
  }
  private validBinding(binding: CredentialBinding) {
    return (
      binding.peerKey.length > 0 &&
      binding.peerKey.length <= 256 &&
      binding.salt.length > 0 &&
      binding.salt.length <= 4096 &&
      this.target ===
        JSON.stringify([
          binding.profile.idServerUrl,
          binding.profile.relayServerUrl,
          binding.profile.serverPublicKey,
          binding.targetId,
        ])
    );
  }
  async load(binding: CredentialBinding) {
    if (!this.scope || !this.validBinding(binding)) return undefined;
    const epoch = this.epoch;
    let recordId: string | undefined;
    try {
      const id = await this.index();
      recordId = id;
      const record = await this.persistence.read(id);
      if (epoch !== this.epoch || !record) return undefined;
      if (record.peerKey !== binding.peerKey || record.salt !== binding.salt) {
        await this.persistence.remove(id, () => epoch === this.epoch);
        if (epoch === this.epoch) this.status('forgotten');
        return undefined;
      }
      const key = await this.persistence.key();
      if (record.iv.length !== 12 || record.ciphertext.byteLength !== 48)
        throw new Error('Invalid stored credential');
      const first = new Uint8Array(
        await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: new Uint8Array(record.iv),
            additionalData: this.aad(id, binding),
          },
          key,
          record.ciphertext,
        ),
      );
      if (epoch !== this.epoch || first.length !== 32) {
        first.fill(0);
        return undefined;
      }
      this.status('saved');
      return first;
    } catch {
      if (recordId && epoch === this.epoch) {
        try {
          await this.persistence.remove(recordId, () => epoch === this.epoch);
        } catch {
          /* 存储不可用时仍回到手动认证。 */
        }
      }
      if (epoch === this.epoch) this.status('unavailable');
      return undefined;
    }
  }
  async save(binding: CredentialBinding, passwordH1: Uint8Array) {
    const epoch = this.epoch;
    const controller = new AbortController();
    this.saves.add(controller);
    const first = passwordH1.slice();
    try {
      if (first.length !== 32 || !this.validBinding(binding)) return false;
      const id = await this.index();
      const key = await this.persistence.key();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, additionalData: this.aad(id, binding) },
        key,
        first,
      );
      if (epoch !== this.epoch) return false;
      const saved = await this.persistence.write(
        {
          id,
          peerKey: binding.peerKey,
          salt: binding.salt,
          iv,
          ciphertext,
          updated: Date.now(),
        },
        () => epoch === this.epoch,
        controller.signal,
      );
      if (saved && epoch === this.epoch) this.status('saved');
      return saved && epoch === this.epoch;
    } catch {
      if (epoch === this.epoch) this.status('unavailable');
      return false;
    } finally {
      this.saves.delete(controller);
      first.fill(0);
    }
  }
  async forget() {
    this.cancel();
    const epoch = this.epoch;
    if (!this.scope) {
      this.status('none');
      return;
    }
    try {
      const id = await this.index();
      await this.persistence.remove(id);
      if (epoch === this.epoch) this.status('forgotten');
    } catch {
      if (epoch === this.epoch) this.status('unavailable');
    }
  }
}
