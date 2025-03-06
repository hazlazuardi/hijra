import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

type Props = {}

export default async function Prayer({ }: Props) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/sign-in");
    }


    const { data: prayerTracking } = await supabase
        .from('prayer_tracking')
        .select()
        .eq('user_id', user.id); // Filter by user_id


    console.log(prayerTracking)

    return (
        <div>
            <h1>Prayer Tracking</h1>
            <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
                {JSON.stringify(prayerTracking, null, 2)}
            </pre>
        </div>
    )
}
