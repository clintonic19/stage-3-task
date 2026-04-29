// src/pages/Search.jsx
import  { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/commons/Navbar';
import Pagination from '../components/commons/Pagination';
import { api } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';

const Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
      performSearch();
      getSuggestions();
    } else {
      setResults([]);
    }
  }, [debouncedSearchTerm, searchType, pagination.page]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const response = await api.get('/search', {
        params: {
          q: searchTerm,
          type: searchType,
          page: pagination.page,
          limit: pagination.limit
        }
      });
      setResults(response.data.results);
      setPagination(response.data.pagination);
      
      // Save to recent searches
      if (searchTerm && !recentSearches.includes(searchTerm)) {
        const updated = [searchTerm, ...recentSearches.slice(0, 4)];
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestions = async () => {
    try {
      const response = await api.get('/search/suggestions', {
        params: { q: searchTerm }
      });
      setSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }
  };

  const loadRecentSearches = () => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const highlightMatch = (text, term) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.split(regex).map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-yellow-200">{part}</mark> : part
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search</h1>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search profiles, users, or content..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              
              {suggestions.length > 0 && searchTerm && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => setSearchTerm(suggestion)}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      {highlightMatch(suggestion, searchTerm)}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="profiles">Profiles</option>
              <option value="users">Users</option>
              <option value="content">Content</option>
            </select>
            
            <button
              onClick={performSearch}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
          
          {recentSearches.length > 0 && !searchTerm && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Recent Searches</span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchTerm(search)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {!loading && results.length > 0 && (
          <>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <p className="text-sm text-gray-600">
                  Found {pagination.total} results for "{searchTerm}"
                </p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {results.map((result) => (
                  <div key={result.id} className="p-6 hover:bg-gray-50">
                    <Link to={`/profiles/${result.id}`} className="block">
                      <div className="flex items-start space-x-4">
                        <img
                          src={result.avatar || `https://ui-avatars.com/api/?name=${result.name}`}
                          alt={result.name}
                          className="h-12 w-12 rounded-full"
                        />
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {highlightMatch(result.name, searchTerm)}
                          </h3>
                          <p className="text-sm text-gray-500">{result.email}</p>
                          {result.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {highlightMatch(result.description, searchTerm)}
                            </p>
                          )}
                          <div className="mt-2 flex items-center space-x-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              result.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {result.status}
                            </span>
                            <span className="text-xs text-gray-400">
                              {result.type || 'Profile'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
            
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={(page) => setPagination({...pagination, page})}
              pageSize={pagination.limit}
              onPageSizeChange={(size) => setPagination({...pagination, limit: size, page: 1})}
            />
          </>
        )}
        
        {!loading && searchTerm && results.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;