import { useModel } from '@umijs/max';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getWebClientConfiguration,
  type WebClientConfiguration,
} from '@/services/rustdesk-console/webClient';

interface WebClientModel {
  configuration: WebClientConfiguration | undefined;
  loading: boolean;
  unavailable: boolean;
  reload: () => Promise<void>;
}

export default function useWebClient(): WebClientModel {
  const { initialState } = useModel('@@initialState');
  const user = initialState?.currentUser;
  const [configuration, setConfiguration] = useState<WebClientConfiguration>();
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const generation = useRef(0);
  const configurationOwner = useRef(user);
  const reload = useCallback(async () => {
    const request = ++generation.current;
    setConfiguration(undefined);
    setUnavailable(false);
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const value = await getWebClientConfiguration();
      if (request === generation.current) {
        configurationOwner.current = user;
        setConfiguration(value);
      }
    } catch {
      if (request === generation.current) setUnavailable(true);
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [user]);
  useEffect(() => {
    void reload();
    return () => {
      ++generation.current;
    };
  }, [reload]);
  return {
    // Mask the old account during render, before passive effect cleanup runs.
    configuration:
      configurationOwner.current === user ? configuration : undefined,
    loading,
    unavailable,
    reload,
  };
}
