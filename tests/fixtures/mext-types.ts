// Compile-time source boundary: these calls must remain type errors.
import type {SupabaseClient} from '@supabase/supabase-js';
import {resolveFoodReference} from '../../src/lib/mext/resolve';
import {scaleMextNutrition} from '../../src/lib/mext/nutrients';
import type {MextRecord} from '../../src/lib/mext/record';
import type {FdcFood} from '../../src/lib/fdc/client';
import type {NutritionReference} from '../../src/lib/mext/match';
export function sourceBoundary(admin:SupabaseClient,raw:MextRecord,usda:FdcFood){
 // @ts-expect-error the source context has no default
 void resolveFoodReference(admin,'Rice');
 // @ts-expect-error an ungated reference cannot reach the MEXT scaler
 void scaleMextNutrition(raw,100);
 // @ts-expect-error a MEXT reference cannot be made from a USDA food or fake FDC id
 const mixed:NutritionReference={source:'mext',food:usda};
 return mixed;
}
