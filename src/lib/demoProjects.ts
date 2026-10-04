import { FileEntry } from './types';

export interface DemoProject {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  files: FileEntry[];
}

export const DEMO_PROJECTS: DemoProject[] = [
  {
    id: 'vibe-coded-saas',
    name: 'Vibe-Coded Next.js + Supabase SaaS',
    badge: 'High Risk (Failing)',
    badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',
    description: 'Typical application scaffolded with AI prompt tools (Cursor, Bolt, v0). Looks polished in browser, but contains leaked service keys, unauthenticated server actions, and disabled database RLS.',
    files: [
      {
        path: 'src/app/dashboard/page.tsx',
        content: `'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// VIBE CODED: Hardcoded leaked service_role key on the client!
const supabase = createClient(
  'https://xyzcompany.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5eiIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2MDAwMDAwMDB9.EXAMPLE_LEAKED_SUPABASE_SERVICE_ROLE_KEY'
);

export default function DashboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Missing cleanup on interval
    const timer = setInterval(() => {
      console.log('Polling dashboard analytics...');
    }, 5000);

    async function loadData() {
      const { data } = await supabase.from('users').select('*');
      setUsers(data || []);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Admin User Directory</h1>
      {loading ? <p>Loading...</p> : (
        <ul className="mt-4 space-y-2">
          {users.map(u => (
            <li key={u.id} className="p-2 border rounded">
              <span className="font-semibold">{u.name}</span> - {u.email}
              <img src={u.avatarUrl || '/placeholder.png'} className="w-8 h-8 rounded-full ml-2 inline" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
`
      },
      {
        path: 'src/app/actions/deleteCustomer.ts',
        content: `'use server';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// CRITICAL SECURITY FLAW:
// Server Action mutates/deletes records without verifying active user session or tenant ownership!
export async function deleteCustomerRecord(customerId: string) {
  // Missing: const session = await auth(); if (!session) throw new Error("Unauthorized");
  await db.query(\`DELETE FROM customers WHERE id = '\${customerId}'\`);
  revalidatePath('/dashboard');
  return { success: true };
}
`
      },
      {
        path: 'supabase/migrations/20260101_init.sql',
        content: `-- Schema created by AI prompt generator
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  billing_address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Missing: ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- This leaves the table completely vulnerable to unauthenticated public API dumping!
`
      },
      {
        path: 'src/lib/services/billing.ts',
        content: `// Billing integration
import Stripe from 'stripe';

// Leaked Stripe secret key in repository
const stripeKey = 'sk_live_51M000000000000000000000000000000000000000000000000000000000000000000000000000000';
export const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

export async function processUserOrders(users: any[]) {
  // N+1 Query bottleneck inside loop
  const orders = await Promise.all(
    users.map(async (u) => {
      return await db.orders.findUnique({ where: { userId: u.id } });
    })
  );
  return orders;
}
`
      },
      {
        path: 'package.json',
        content: `{
  "name": "vibe-saas",
  "version": "1.0.0",
  "dependencies": {
    "next": "14.1.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "@supabase/supabase-js": "^2.39.0",
    "jsonwebtoken": "8.5.1",
    "axios": "1.7.2",
    "lodash": "4.17.20",
    "stripe": "*"
  }
}
`
      }
    ]
  },
  {
    id: 'agency-ecommerce',
    name: 'Agency Client E-Commerce Portal',
    badge: 'Conditional Review (Grade C)',
    badgeColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    description: 'Agency client project ready for delivery. Free of leaked secrets, but contains unhandled API errors, missing App Router error boundaries, and unoptimized database queries.',
    files: [
      {
        path: 'src/app/api/checkout/route.ts',
        content: `import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Missing try/catch error handling in async route
export async function POST(req: Request) {
  const body = await req.json();
  const order = await db.orders.create({ data: body });
  
  // Overly permissive CORS header
  const response = NextResponse.json({ orderId: order.id });
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
}
`
      },
      {
        path: 'src/app/products/page.tsx',
        content: `import React from 'react';
import { db } from '@/lib/db';

export default async function ProductsPage() {
  // Unbounded query without LIMIT or pagination
  const products = await db.products.findMany({
    where: { published: true }
  });

  return (
    <div className="grid grid-cols-3 gap-6 p-8">
      {products.map((p: any) => (
        <div key={p.id} className="border p-4 rounded shadow">
          {/* Unoptimized raw img tag */}
          <img src={p.imageUrl} alt={p.title} className="w-full h-48 object-cover" />
          <h2 className="text-lg font-bold mt-2">{p.title}</h2>
          <p className="text-gray-600">\${p.price}</p>
        </div>
      ))}
    </div>
  );
}
`
      },
      {
        path: 'package.json',
        content: `{
  "name": "client-store",
  "version": "0.5.0",
  "dependencies": {
    "next": "^14.2.15",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "stripe": "^16.2.0"
  }
}
`
      }
    ]
  },
  {
    id: 'clean-architecture-saas',
    name: 'Production-Hardened Next.js & Supabase SaaS',
    badge: 'Production Ready (Grade A+)',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    description: 'Gold-standard implementation. Session-checked server actions, strict RLS policies, batched queries, error boundaries, and zero client secret exposure.',
    files: [
      {
        path: 'src/app/error.tsx',
        content: `'use client';
import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Captured client runtime exception:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">An unexpected error occurred</h2>
      <p className="mt-2 text-gray-500">Our engineering team has been notified.</p>
      <button onClick={() => reset()} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
        Try Again
      </button>
    </div>
  );
}
`
      },
      {
        path: 'src/app/actions/orders.ts',
        content: `'use server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function cancelOrder(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  // Tenant-scoped mutation: validates user ownership
  const order = await db.orders.findFirst({
    where: { id: orderId, userId: session.user.id }
  });

  if (!order) {
    throw new Error('Order not found or permission denied');
  }

  await db.orders.update({
    where: { id: orderId, userId: session.user.id },
    data: { status: 'CANCELLED' }
  });

  revalidatePath('/dashboard/orders');
  return { success: true };
}
`
      },
      {
        path: 'supabase/migrations/20260201_hardened.sql',
        content: `CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Strict Isolation Policy
CREATE POLICY "Users can only read own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can only update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);
`
      },
      {
        path: 'src/app/dashboard/page.tsx',
        content: `import React from 'react';
import Image from 'next/image';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // Batched query with pagination limits
  const orders = await db.orders.findMany({
    where: { userId: session.user.id },
    take: 25,
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center space-x-4">
        <Image src="/logo.png" width={40} height={40} alt="Company Logo" priority />
        <h1 className="text-2xl font-bold">Secure Dashboard</h1>
      </div>
      <div className="mt-6">
        <p className="text-gray-600">Showing {orders.length} recent orders</p>
      </div>
    </div>
  );
}
`
      },
      {
        path: 'package.json',
        content: `{
  "name": "hardened-saas",
  "version": "1.0.0",
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "stripe": "^17.2.0",
    "zod": "^3.23.8"
  }
}
`
      }
    ]
  }
];
