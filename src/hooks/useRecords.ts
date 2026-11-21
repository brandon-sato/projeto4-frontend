import { useCallback, useEffect, useState } from "react";
import { api } from "../api/axios";
import { getApiErrorMessage } from "../utils/apiError";

function useRecords<RecordType>(endpoint: string, loadOnMount = true) {
  const [records, setRecords] = useState<RecordType[]>([]);
  const [isLoading, setIsLoading] = useState(loadOnMount);
  const [loadError, setLoadError] = useState("");

  const reload = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const response = await api.get<RecordType[]>(endpoint);
      setRecords(response.data);
    } catch (error: unknown) {
      setLoadError(getApiErrorMessage(error, "Não foi possível carregar os registros."));
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (!loadOnMount) {
      return;
    }

    let active = true;

    api.get<RecordType[]>(endpoint)
      .then((response) => {
        if (active) {
          setRecords(response.data);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(getApiErrorMessage(error, "Não foi possível carregar os registros."));
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [endpoint, loadOnMount]);

  return { records, setRecords, isLoading, loadError, reload };
}

export default useRecords;
