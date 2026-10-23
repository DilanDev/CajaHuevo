"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DependencyList,
} from "react";
import { mensajeDeError } from "@/lib/services/util";

type Estado<T> = {
  datos: T | null;
  cargando: boolean;
  error: string | null;
};

/**
 * Ejecuta una consulta al montar y cuando cambian las dependencias.
 * Descarta respuestas viejas cuando se cambia de período rápidamente.
 */
export function useConsulta<T>(
  cargar: () => Promise<T>,
  dependencias: DependencyList
) {
  const [estado, setEstado] = useState<Estado<T>>({
    datos: null,
    cargando: true,
    error: null,
  });

  const cargarRef = useRef(cargar);
  cargarRef.current = cargar;
  const generacion = useRef(0);

  const recargar = useCallback(async (mostrarCarga = true) => {
    const id = ++generacion.current;

    if (mostrarCarga) {
      setEstado((anterior) => ({
        ...anterior,
        cargando: true,
        error: null,
      }));
    }

    try {
      const datos = await cargarRef.current();
      if (id !== generacion.current) return;
      setEstado({ datos, cargando: false, error: null });
    } catch (error) {
      if (id !== generacion.current) return;
      setEstado((anterior) => ({
        ...anterior,
        cargando: false,
        error: mensajeDeError(error),
      }));
    }
  }, []);

  useEffect(() => {
    void recargar();
    // Las dependencias las define quien usa el hook.
  }, dependencias); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    datos: estado.datos,
    cargando: estado.cargando,
    error: estado.error,
    recargar,
  };
}
