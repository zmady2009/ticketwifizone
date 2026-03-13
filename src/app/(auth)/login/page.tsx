import { Suspense } from 'react';
import { LoginForm } from './LoginForm';
import { Wifi } from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginPageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#123B8B] p-12 items-end">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#81B545] flex items-center justify-center">
            <Wifi className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">TicketWiFiZone</span>
        </div>
      </div>

      {/* Right side - Form skeleton */}
      <div className="flex-1 flex items-center justify-center p-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-10">
            <div className="mb-8">
              <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded w-64 animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
