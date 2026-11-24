import {useTranslations} from 'next-intl';
import {Shimmer} from '@/components/ui/Shimmer';
export default function PostDetailSkeleton() {
  const t=useTranslations('post');
  return <div role="status" aria-label={t('loadingMeal')} className="flex flex-col gap-3 pb-6">
    <div className="aspect-square w-full bg-card"/>
    <div className="flex flex-col gap-3 px-inset"><Shimmer width="70%"/><Shimmer width="45%"/><Shimmer width="60%"/></div>
  </div>;
}
