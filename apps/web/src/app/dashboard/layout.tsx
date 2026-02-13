import React from 'react';


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-gray-50 flex-col">
            <main className="flex-1 overflow-hidden">
                {children}
            </main>
        </div>
    );
}
