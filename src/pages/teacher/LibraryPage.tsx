import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchLibraryItems } from '@/features/library/libraryThunks';
import { setFilters, clearFilters } from '@/features/library/librarySlice';
import { useToast } from '@/hooks/use-toast';
import { LibraryItem } from '@/features/library/librarySlice';
import { Search, Filter, BookOpen, FolderOpen, Eye, Edit, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function LibraryPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { items, loading, filters } = useAppSelector(state => state.library);
  const { toast } = useToast();

  // Fetch on mount
  useEffect(() => {
    if (user) {
      dispatch(fetchLibraryItems(user.id));
    }
  }, [user, dispatch]);

  // Filter items based on current filters
  const filteredItems = items.filter(item => {
    const matchesSearch = !filters.search || 
      item.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()));
    
    const matchesTopic = !filters.topic || filters.topic === 'all' || item.category === filters.topic;
    
    return matchesSearch && matchesTopic;
  });

  // Get icon for item type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <FileText className="h-4 w-4" />;
      case 'template':
        return <FolderOpen className="h-4 w-4" />;
      case 'resource':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get color for item type
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'bg-blue-100 text-blue-800';
      case 'template':
        return 'bg-green-100 text-green-800';
      case 'resource':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <main className="flex-1 container mx-auto px-4 py-8 md:px-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading library...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-8 md:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Library</h1>
          <p className="text-gray-600">Manage your teaching templates and resources</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search library items..."
                  value={filters.search}
                  onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
                  className="pl-10"
                />
              </div>

              {/* Topic Filter */}
              <Select value={filters.topic} onValueChange={(value) => dispatch(setFilters({ topic: value }))}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All Topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  <SelectItem value="Speaking">Speaking</SelectItem>
                  <SelectItem value="Writing">Writing</SelectItem>
                  <SelectItem value="Reading">Reading</SelectItem>
                  <SelectItem value="Listening">Listening</SelectItem>
                  <SelectItem value="Grammar">Grammar</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => dispatch(clearFilters())}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Library Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-100 text-green-800">
                      <FolderOpen className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => console.log('View item:', item.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => console.log('Edit item:', item.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3">{item.description}</p>
                </div>

                {/* Tags */}
                <div className="mb-4">
                  <div className="flex items-center gap-1 mb-2">
                    <Tag className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">Tags:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{item.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Used {item.usage_count} times</span>
                  <span>{new Date(item.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No library items found</h3>
            <p className="text-gray-600 mb-4">
              {filters.search || (filters.topic && filters.topic !== 'all')
                ? 'Try adjusting your filters or search terms.'
                : 'No templates available in your library.'
              }
            </p>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Teacher Library. All rights reserved.
      </footer>
    </div>
  );
} 