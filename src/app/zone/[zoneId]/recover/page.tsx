import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { RecoverForm } from './RecoverForm';

interface PageProps {
  params: Promise<{
    zoneId: string;
  }>;
}

export default async function RecoverPage({ params }: PageProps) {
  const { zoneId } = await params;
  const supabase = await createClient();

  const { data: zone } = await supabase
    .from('zones')
    .select('name, city')
    .eq('id', zoneId)
    .single();

  if (!zone) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <Link
          href={`/zone/${zoneId}/buy`}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        <Card className="border-2 border-brand-200">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 mx-auto mb-4">
              <Ticket className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl">Retrouver mon ticket</CardTitle>
            <p className="text-gray-500 text-sm mt-2">
              Entrez le numéro de téléphone utilisé pour l&apos;achat
            </p>
          </CardHeader>
          <CardContent>
            <RecoverForm zoneId={zoneId} />
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          Zone : <strong>{zone.name}</strong> ({zone.city})
        </p>
      </div>
    </div>
  );
}
