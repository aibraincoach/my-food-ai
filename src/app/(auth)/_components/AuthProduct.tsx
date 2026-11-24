import {useLocale,useTranslations} from 'next-intl';
import {BrandMark} from '@/components/BrandMark';
import {ResultsCard} from '@/components/ResultsCard';
import './AuthShell.css';

export function AuthProduct({welcome=false}:{welcome?:boolean}){
 const t=useTranslations('auth'),locale=useLocale();
  const Heading=welcome?'h1':'p';
  return <div className="mfaAuth-intro">
    <div className="mfaAuth-brand"><span className="mfaAuth-mark"><BrandMark size={32}/></span><span>My Food AI</span></div>
    <div className="mfaAuth-content">
      <figure className="mfaAuth-sample">
        <div className="mfaAuth-sampleFrame">
          {/* PM sample: salmon120g≈250kcal/27P/0C/15F plus cooked rice150g≈180kcal/4P/42C/0F.
              Keep foods plausible and 4P+4C+9F within rounding of the sample energy (427≈430). */}
          <ResultsCard locale={locale} size={300} calories={430} protein={31} carbs={42} fat={15}
            items={[{name: t('salmon'), grams: 120}, {name: t('rice'), grams: 150}]}/>
        </div>
        <figcaption className="mfaAuth-sampleLabel">{t('sample')}</figcaption>
      </figure>
      <div className="mfaAuth-copy">
        <Heading className="mfaAuth-headline">{t('heroTitle')}</Heading>
        <p className="mfaAuth-support">{t('heroSupport')}</p>
      </div>
    </div>
  </div>;
}
