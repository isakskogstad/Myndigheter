import React from 'react';
import { Building2 } from 'lucide-react';

/**
 * Skeleton loading placeholder
 */
export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-gray-700 rounded ${className}`} />
  );
}

/**
 * Full page loading state with animated spinner
 */
export function LoadingState({ message = 'Laddar data...' }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        {/* Animated icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 mx-auto rounded-full border-4 border-gray-700 border-t-blue-500 animate-spin" />
          <Building2 className="absolute inset-0 m-auto w-8 h-8 text-blue-400" />
        </div>

        {/* Loading text */}
        <h2 className="text-xl font-semibold text-white mb-2">
          Svenska myndigheter
        </h2>
        <p className="text-gray-400 animate-pulse">
          {message}
        </p>

        {/* Progress dots */}
        <div className="flex justify-center gap-1 mt-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

/**
 * Error state with retry button
 */
export function ErrorState({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        {/* Error icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <span className="text-3xl">!</span>
        </div>

        {/* Error message */}
        <h2 className="text-xl font-semibold text-white mb-2">
          Något gick fel
        </h2>
        <p className="text-gray-400 mb-6">
          {error || 'Kunde inte hämta data från servern. Kontrollera din internetanslutning och försök igen.'}
        </p>

        {/* Retry button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Försök igen
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Skeleton for chart loading
 */
export function ChartSkeleton({ height = 300 }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4" style={{ height }}>
      <Skeleton className="h-4 w-48 mb-4" />
      <div className="flex items-end gap-2 h-[calc(100%-2rem)]">
        {[...Array(12)].map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for stat cards
 */
export function StatCardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

/**
 * Skeleton for the agency list
 */
export function AgencyListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-gray-800 rounded-lg p-4 flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

export default LoadingState;
