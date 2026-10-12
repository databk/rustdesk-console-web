import { useModel } from '@umijs/max';
import { useCallback, useEffect, useRef, useState } from 'react';
import createAccess from '@/access';
import {
  getWebClientConfiguration,
  type WebClientConfiguration,
  webClientHttpStatus,
} from '@/services/rustdesk-console/webClient';

interface WebClientModel {
  configuration: WebClientConfiguration | undefined;
  loading: boolean;
  unavailable: boolean;
  forbidden: boolean;
  reload: () => Promise<void>;
}

export default function useWebClient(): WebClientModel {
  const { initialState } = useModel('@@initialState');
  const user = initialState?.currentUser;
  const owner = user?.guid;
  const canConnect = createAccess(initialState).canWebClientConnect;
  const [configuration, setConfiguration] = useState<WebClientConfiguration>();
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const generation = useRef(0);
  const configurationOwner = useRef(owner);
  const reload = useCallback(async () => {
    const request = ++generation.current;
    setConfiguration(undefined);
    setUnavailable(false);
    setForbidden(false);
    if (!owner) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const value = await getWebClientConfiguration();
      if (request === generation.current) {
        configurationOwner.current = owner;
        setConfiguration(value);
      }
    } catch (error) {
      if (request === generation.current) {
        setForbidden(webClientHttpStatus(error) === 403);
        setUnavailable(webClientHttpStatus(error) !== 403);
      }
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [owner, canConnect]);
  useEffect(() => {
    void reload();
    return () => {
      ++generation.current;
    };
  }, [reload]);
  return {
    // Mask the old account during render, before passive effect cleanup runs.
    configuration:
      configurationOwner.current === owner ? configuration : undefined,
    loading,
    unavailable,
    forbidden,
    reload,
  };
}
