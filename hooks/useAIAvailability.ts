'use client';
import { useEffect, useState } from 'react';

export function useAIAvailability(apiType: 'summarizer' | 'proofreader') {
  const [available, setAvailable] = useState<'granted' | 'denied' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAvailability = async () => {
      if (apiType === 'summarizer' && 'Summarizer' in window) {
        try {
          const status = await (window as any).Summarizer.availability({ length: 'short' });
          setAvailable(status);
        } catch {
          setAvailable('denied');
        }
      } else if (apiType === 'proofreader' && 'Proofreader' in window) {
        try {
          const status = await (window as any).Proofreader.availability({ expectedInputLanguages: ['en'] });
          setAvailable(status === 'available' ? 'granted' : status === 'downloadable' ? 'granted' : 'denied');
        } catch {
          setAvailable('denied');
        }
      } else {
        setAvailable('denied');
      }
      setLoading(false);
    };

    checkAvailability();
  }, [apiType]);

  return { available, loading };
}