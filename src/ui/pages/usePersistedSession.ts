// Persistensi sesi Latihan/Uji A1 di atas sessionRepository Agent 1.
// Satu writer per key, revision optimistis, dan kegagalan simpan terlihat.
import { useCallback, useEffect, useRef, useState } from "react";
import { loadSession, deleteSession, writeSession } from "../../lessons/sessionRepository";
import { persistWithRecovery } from "./latihanState";

export type PersistStatus = "loading" | "ready" | "saving" | "saved" | "failed";

type Options<T> = {
  key: string;
  create: () => T;
  validate: (value: unknown) => value is T;
};

function newSessionId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && "randomUUID" in cryptoApi) return cryptoApi.randomUUID();
  return `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function usePersistedSession<T>({ key, create, validate }: Options<T>) {
  const [data, setData] = useState<T>(create);
  const [status, setStatus] = useState<PersistStatus>("loading");
  const [error, setError] = useState("");
  const [dataKey, setDataKey] = useState(key);
  const [loadVersion, setLoadVersion] = useState(0);
  const dataRef = useRef(data);
  const alive = useRef(true);
  const meta = useRef({
    key,
    sessionId: newSessionId(),
    revision: 0,
    chain: Promise.resolve() as Promise<void>,
  });

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const initial = create();
    const current = {
      key,
      sessionId: newSessionId(),
      revision: 0,
      chain: Promise.resolve() as Promise<void>,
    };
    meta.current = current;
    dataRef.current = initial;
    setData(initial);
    setDataKey(key);
    setLoadVersion((version) => version + 1);
    setStatus("loading");
    setError("");

    loadSession<T>(key)
      .then((envelope) => {
        if (!active) return;
        if (envelope) {
          // Adopsi identitas/revisi walau payload lama tidak valid, supaya
          // penulisan pertama memperbaiki state rusak tanpa konflik permanen.
          current.sessionId = envelope.sessionId;
          current.revision = envelope.revision;
          if (validate(envelope.data)) {
            dataRef.current = envelope.data;
            setData(envelope.data);
          }
        }
        setLoadVersion((version) => version + 1);
        setStatus("ready");
      })
      .catch((cause) => {
        if (!active) return;
        setStatus("failed");
        setError(String(cause));
      });
    return () => {
      active = false;
    };
    // create/validate intentionally excluded: key identity owns the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const persist = useCallback((next: T) => {
    const current = meta.current;
    setStatus("saving");
    setError("");
    current.chain = current.chain.then(async () => {
      try {
        const result = await persistWithRecovery<T>(current, next, {
          write: writeSession,
          load: loadSession,
        });
        if (!alive.current || meta.current.key !== current.key) return;
        if (result.ok) {
          current.revision = result.revision;
          setStatus("saved");
        } else {
          setStatus("failed");
          setError(result.message);
        }
      } catch (cause) {
        if (!alive.current || meta.current.key !== current.key) return;
        setStatus("failed");
        setError(String(cause));
      }
    });
  }, []);

  const update = useCallback(
    (updater: (previous: T) => T) => {
      const next = updater(dataRef.current);
      dataRef.current = next;
      setData(next);
      persist(next);
    },
    [persist],
  );

  const replace = useCallback(
    (next: T) => {
      dataRef.current = next;
      setData(next);
      persist(next);
    },
    [persist],
  );

  const retry = useCallback(() => {
    persist(dataRef.current);
  }, [persist]);

  // Percobaan baru: hapus sesi lama, sessionId baru, revision 0. Writer sesi
  // lama tidak bisa menimpa attempt baru karena sessionId berbeda.
  const newAttempt = useCallback(
    (next: T) => {
      dataRef.current = next;
      setData(next);
      setStatus("saving");
      setError("");
      const current = meta.current;
      current.chain = current.chain.then(async () => {
        try {
          await deleteSession(current.key);
          const sessionId = newSessionId();
          current.sessionId = sessionId;
          current.revision = 0;
          const result = await persistWithRecovery<T>(current, next, {
            write: writeSession,
            load: loadSession,
          });
          if (!alive.current || meta.current.key !== current.key) return;
          if (result.ok) {
            current.revision = result.revision;
            setStatus("saved");
          } else {
            setStatus("failed");
            setError(result.message);
          }
        } catch (cause) {
          if (!alive.current || meta.current.key !== current.key) return;
          setStatus("failed");
          setError(String(cause));
        }
      });
    },
    [],
  );

  return { data, update, replace, retry, newAttempt, status, error, dataKey, loadVersion };
}
