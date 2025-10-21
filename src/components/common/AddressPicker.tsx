import React, { useEffect, useMemo, useRef, useState } from 'react';
import { kirimkuService, type KirimkuLocation, type KirimkuLocationType } from '@/services/kirimkuService';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, X } from 'lucide-react';

export interface AddressPickerValue {
  locationId: string | null;
  locationName: string | null;
  locationType: KirimkuLocationType | null;
  province?: string | null;
  postalCode?: string | null;
}

interface AddressPickerProps {
  label?: string;
  placeholder?: string;
  type?: KirimkuLocationType; // optional filter by type
  limit?: number;
  value?: AddressPickerValue;
  onChange?: (value: AddressPickerValue) => void;
  disabled?: boolean;
  className?: string;
}

const debounce = <T extends (...args: unknown[]) => void>(fn: T, delay = 300) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const AddressPicker: React.FC<AddressPickerProps> = ({
  label = 'Address',
  placeholder = 'Search city, district, area...',
  type,
  limit = 10,
  value,
  onChange,
  disabled,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<KirimkuLocation[]>([]);
  const latestQuery = useRef('');

  const triggerSearch = useMemo(
    () =>
      debounce(async (q: string) => {
        if (!q || q.trim().length < 2) {
          setResults([]);
          return;
        }
        setLoading(true);
        setError(null);
        latestQuery.current = q;
        try {
          const res = await kirimkuService.searchLocations({ query: q.trim(), type, limit });
          // Prevent race condition: only update if this result matches the latest query
          if (latestQuery.current === q) {
            setResults(res.locations);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Failed to search locations';
          setError(msg);
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 400),
    [type, limit]
  );

  useEffect(() => {
    if (query) {
      triggerSearch(query);
    } else {
      setResults([]);
    }
  }, [query, triggerSearch]);

  const handleSelect = (loc: KirimkuLocation) => {
    const selected: AddressPickerValue = {
      locationId: loc.id,
      locationName: loc.name,
      locationType: loc.type,
      province: loc.province || null,
      postalCode: loc.postal_code || null,
    };
    onChange?.(selected);
    setOpen(false);
  };

  const clearSelection = () => {
    onChange?.({ locationId: null, locationName: null, locationType: null, province: null, postalCode: null });
  };

  return (
    <div className={className}>
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between"
          >
            <span className="truncate flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {value?.locationName || 'Select location'}
            </span>
            {value?.locationName ? (
              <span className="ml-2 text-xs text-muted-foreground">{value?.postalCode || ''}</span>
            ) : (
              <span className="ml-2 text-xs text-muted-foreground">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[400px]" align="start">
          <Command>
            <div className="px-2 pt-2">
              <CommandInput
                value={query}
                onValueChange={setQuery}
                placeholder={placeholder}
              />
            </div>
            <CommandList>
              {loading && (
                <div className="p-2 text-sm text-muted-foreground">Searching...</div>
              )}
              {error && !loading && (
                <div className="p-2 text-sm text-destructive">{error}</div>
              )}
              {!loading && !error && results.length === 0 && (
                <CommandEmpty>No locations found</CommandEmpty>
              )}
              <ScrollArea className="max-h-64">
                <CommandGroup>
                  {results.map((loc) => (
                    <CommandItem key={loc.id} value={`${loc.name} ${loc.district || ''} ${loc.city || ''} ${loc.province || ''} ${loc.postal_code || ''}`.trim()} onSelect={() => handleSelect(loc)}>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{loc.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {loc.type}{loc.province ? ` • ${loc.province}` : ''}{loc.city ? ` • ${loc.city}` : ''}{loc.district ? ` • ${loc.district}` : ''}{loc.postal_code ? ` • ${loc.postal_code}` : ''}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value?.locationName && (
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Selected: {value.locationName}
            {value.postalCode ? `, ${value.postalCode}` : ''}
          </span>
          <button
            type="button"
            onClick={clearSelection}
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default AddressPicker;