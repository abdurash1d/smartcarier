"use client";

/**
 * Saved Searches Component
 * Manage and apply saved search filters
 */

import { useState, useEffect } from 'react';
import { Bookmark, Trash2, Star, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface SavedSearch {
  id: string;
  name: string;
  search_type: string;
  filters: Record<string, any>;
  created_at: string;
  last_used_at: string;
}

interface SavedSearchesProps {
  searchType: 'jobs' | 'universities' | 'scholarships';
  onApplySearch: (filters: Record<string, any>) => void;
}

export function SavedSearches({ searchType, onApplySearch }: SavedSearchesProps) {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSavedSearches();
  }, [searchType]);

  const fetchSavedSearches = async () => {
    try {
      const response = await api.get(`/saved-searches?search_type=${searchType}`);
      setSearches(response.data.searches);
    } catch (error) {
      console.error('Failed to fetch saved searches:', error);
    }
  };

  const saveCurrentSearch = async (name: string, filters: Record<string, any>) => {
    setLoading(true);
    try {
      await api.post('/saved-searches', {
        name,
        search_type: searchType,
        filters,
      });
      
      toast.success('Search saved!');
      fetchSavedSearches();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save search');
    } finally {
      setLoading(false);
    }
  };

  const applySearch = async (search: SavedSearch) => {
    try {
      // Mark as used
      await api.post(`/saved-searches/${search.id}/use`);
      
      // Apply filters
      onApplySearch(search.filters);
      
      toast.success(`Applied "${search.name}"`);
      
      // Refresh to update last_used_at
      fetchSavedSearches();
    } catch (error) {
      toast.error('Failed to apply search');
    }
  };

  const deleteSearch = async (id: string) => {
    if (!confirm('Delete this saved search?')) return;
    
    try {
      await api.delete(`/saved-searches/${id}`);
      toast.success('Search deleted');
      fetchSavedSearches();
    } catch (error) {
      toast.error('Failed to delete search');
    }
  };

  return (
    <div className="space-y-3">
      {searches.length === 0 ? (
        <div className="text-center py-8 text-surface-500">
          <Bookmark className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No saved searches yet</p>
          <p className="text-xs mt-1">Save your frequent searches for quick access</p>
        </div>
      ) : (
        searches.map(search => (
          <div
            key={search.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              <Star className="h-5 w-5 text-yellow-500" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{search.name}</p>
              <p className="text-xs text-surface-500 mt-1">
                <Clock className="h-3 w-3 inline mr-1" />
                Used {formatDistanceToNow(new Date(search.last_used_at), { addSuffix: true })}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applySearch(search)}
              >
                Apply
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700"
                onClick={() => deleteSearch(search.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Export function to save search from parent components
export async function saveSearch(
  name: string,
  searchType: string,
  filters: Record<string, any>
) {
  try {
    await api.post('/saved-searches', {
      name,
      search_type: searchType,
      filters,
    });
    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Failed to save search' 
    };
  }
}
