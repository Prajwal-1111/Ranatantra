import React from 'react';

// ── Base shimmer block ──
interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
    <div
        className={`relative overflow-hidden rounded bg-white/[0.06] ${className}`}
    >
        <div
            className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite]"
            style={{
                background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
            }}
        />
    </div>
);

// ── Dashboard card skeleton (matches registered event cards) ──
export const DashboardCardSkeleton: React.FC = () => (
    <div className="bg-black/40 border border-white/5 rounded-xl p-6 space-y-4">
        {/* Category badge */}
        <Skeleton className="h-5 w-24 rounded-full" />
        {/* Title */}
        <Skeleton className="h-6 w-3/4" />
        {/* Details */}
        <div className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-1/3" />
        </div>
        {/* Footer: status + ID */}
        <div className="pt-4 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24 rounded" />
                <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-2/3" />
        </div>
    </div>
);

// ── Dashboard loading grid ──
export const DashboardSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
            <DashboardCardSkeleton key={i} />
        ))}
    </div>
);

// ── Admin stat card skeleton ──
export const StatCardSkeleton: React.FC = () => (
    <div className="bg-card/50 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-3">
        <Skeleton className="w-11 h-11 rounded-xl" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-24" />
    </div>
);

// ── Admin table row skeleton ──
const AdminRowSkeleton: React.FC = () => (
    <tr className="border-t border-white/[0.03]">
        {Array.from({ length: 12 }).map((_, i) => (
            <td key={i} className="px-4 py-3">
                <Skeleton className={`h-4 ${i === 1 ? 'w-28' : i === 2 ? 'w-36' : 'w-20'}`} />
            </td>
        ))}
    </tr>
);

// ── Admin mobile card skeleton ──
const AdminMobileCardSkeleton: React.FC = () => (
    <div className="rounded-xl border border-white/5 bg-black/30 p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
            </div>
            <div className="flex flex-col items-end gap-1.5">
                <Skeleton className="h-5 w-20 rounded-lg" />
                <Skeleton className="h-4 w-12 rounded-lg" />
            </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-white/5 pt-3">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                    <Skeleton className="h-2.5 w-12 mb-1" />
                    <Skeleton className="h-3.5 w-20" />
                </div>
            ))}
        </div>
    </div>
);

// ── Full admin loading state ──
export const AdminSkeleton: React.FC = () => (
    <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
            ))}
        </div>

        {/* Data section */}
        <div className="bg-card/30 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            {/* Mobile cards */}
            <div className="space-y-3 p-4 md:hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                    <AdminMobileCardSkeleton key={i} />
                ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-black/60 border-b border-white/10">
                            {['Timestamp', 'Name', 'Email', 'Phone', 'College', 'Dept', 'Year', 'Event', 'Date', 'Reg ID', 'Payment', 'Status'].map((h) => (
                                <th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <AdminRowSkeleton key={i} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);
