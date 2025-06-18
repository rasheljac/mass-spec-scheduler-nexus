
import { useState, useCallback, useRef } from "react";
import { Instrument } from "../types";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";

export const useOptimizedInstruments = () => {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const cacheRef = useRef<{ data: Instrument[], timestamp: number } | null>(null);
  const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache for relatively static data

  const loadInstruments = useCallback(async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh && cacheRef.current) {
      const { data, timestamp } = cacheRef.current;
      if (Date.now() - timestamp < CACHE_TTL) {
        setInstruments(data);
        return;
      }
    }

    setIsLoading(true);
    try {
      console.log("Loading instruments with optimization");
      
      // Load instruments and maintenance history in parallel
      const [instrumentsResult, maintenanceResult] = await Promise.all([
        supabase.from('instruments').select('*'),
        supabase.from('maintenance_history').select('*')
      ]);

      if (instrumentsResult.error) throw instrumentsResult.error;

      if (instrumentsResult.data) {
        // Group maintenance by instrument
        const maintenanceByInstrument = new Map<string, Array<{ date: string; description: string }>>();
        
        if (maintenanceResult.data) {
          maintenanceResult.data.forEach(item => {
            const maintenance = maintenanceByInstrument.get(item.instrument_id) || [];
            maintenance.push({
              date: new Date(item.date).toISOString().split('T')[0],
              description: item.description
            });
            maintenanceByInstrument.set(item.instrument_id, maintenance);
          });
        }

        const formattedInstruments: Instrument[] = instrumentsResult.data.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type || "",
          model: item.model || "",
          location: item.location,
          status: (item.status as "available" | "in_use" | "maintenance" | "offline"),
          image: item.image || "",
          description: item.description,
          specifications: item.specifications,
          calibrationDue: item.calibration_due ? new Date(item.calibration_due).toISOString() : undefined,
          maintenanceHistory: maintenanceByInstrument.get(item.id) || []
        }));
        
        // Update cache
        cacheRef.current = {
          data: formattedInstruments,
          timestamp: Date.now()
        };
        
        setInstruments(formattedInstruments);
        console.log(`Loaded ${formattedInstruments.length} instruments efficiently`);
      }
    } catch (error) {
      console.error("Error loading instruments:", error);
      toast.error("Failed to load instruments");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addInstrument = useCallback(async (instrumentData: Omit<Instrument, "id">) => {
    try {
      const { data, error } = await supabase
        .from('instruments')
        .insert({
          name: instrumentData.name,
          type: instrumentData.type,
          model: instrumentData.model,
          location: instrumentData.location,
          status: instrumentData.status,
          image: instrumentData.image,
          description: instrumentData.description,
          specifications: instrumentData.specifications,
          calibration_due: instrumentData.calibrationDue
        })
        .select();

      if (error) throw error;
      
      if (data && data[0]) {
        if (instrumentData.maintenanceHistory && instrumentData.maintenanceHistory.length > 0) {
          for (const maintenance of instrumentData.maintenanceHistory) {
            await supabase
              .from('maintenance_history')
              .insert({
                instrument_id: data[0].id,
                date: maintenance.date,
                description: maintenance.description
              });
          }
        }

        // Invalidate cache and reload
        cacheRef.current = null;
        await loadInstruments(true);
        toast.success("Instrument added successfully");
      }
    } catch (error) {
      console.error("Error adding instrument:", error);
      toast.error("Failed to add instrument");
    }
  }, [loadInstruments]);

  const updateInstrument = useCallback(async (instrumentData: Instrument) => {
    try {
      const { error } = await supabase
        .from('instruments')
        .update({
          name: instrumentData.name,
          type: instrumentData.type,
          model: instrumentData.model,
          location: instrumentData.location,
          status: instrumentData.status,
          image: instrumentData.image,
          description: instrumentData.description,
          specifications: instrumentData.specifications,
          calibration_due: instrumentData.calibrationDue
        })
        .eq('id', instrumentData.id);

      if (error) throw error;
      
      if (instrumentData.maintenanceHistory) {
        await supabase
          .from('maintenance_history')
          .delete()
          .eq('instrument_id', instrumentData.id);
          
        for (const maintenance of instrumentData.maintenanceHistory) {
          await supabase
            .from('maintenance_history')
            .insert({
              instrument_id: instrumentData.id,
              date: maintenance.date,
              description: maintenance.description
            });
        }
      }

      // Invalidate cache and reload
      cacheRef.current = null;
      await loadInstruments(true);
      toast.success("Instrument updated successfully");
    } catch (error) {
      console.error("Error updating instrument:", error);
      toast.error("Failed to update instrument");
    }
  }, [loadInstruments]);

  const deleteInstrument = useCallback(async (instrumentId: string) => {
    try {
      const { error } = await supabase
        .from('instruments')
        .delete()
        .eq('id', instrumentId);

      if (error) throw error;

      // Invalidate cache and reload
      cacheRef.current = null;
      await loadInstruments(true);
      toast.success("Instrument deleted successfully");
    } catch (error) {
      console.error("Error deleting instrument:", error);
      toast.error("Failed to delete instrument");
    }
  }, [loadInstruments]);

  return {
    instruments,
    loadInstruments,
    addInstrument,
    updateInstrument,
    deleteInstrument,
    isLoading
  };
};
