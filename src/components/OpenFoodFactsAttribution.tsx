import {useTranslations} from 'next-intl';
export default function OpenFoodFactsAttribution() {
 const t=useTranslations('post');
 return <p className="text-meta text-muted">{t.rich('offAttribution',{off:chunks=><a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer" className="underline">{chunks}</a>,license:chunks=><a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer" className="underline">{chunks}</a>})}</p>;
}
