import {useTranslations} from 'next-intl';
export const MEXT_TABLE_URL='https://www.mext.go.jp/a_menu/syokuhinseibun/mext_00001.html';
export default function MextAttribution(){
 const t=useTranslations('card');
 return <p className="text-meta text-muted">{t.rich('mextAttribution',{mext:chunks=><a href={MEXT_TABLE_URL} target="_blank" rel="noopener noreferrer" className="underline">{chunks}</a>})}</p>;
}
