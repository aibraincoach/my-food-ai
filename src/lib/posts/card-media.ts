import type {FeedPost} from './feed';
import type {DrinkCardData} from '@/lib/intake/hydration';

type CardPost = Pick<FeedPost, 'kind' | 'drinkSource' | 'slides'>;
type Preview = {previewUrl?: string | null} | undefined;

export function isSheetDrink(post: CardPost, drink: DrinkCardData | null | undefined): boolean {
  return (post.kind === 'drink' || Boolean(drink)) && (post.drinkSource ?? drink?.source ?? 'sheet') === 'sheet';
}

export function cardMedia(post: CardPost, drink: DrinkCardData | null | undefined, upload?: Preview): 'upload' | 'drink' | 'photo' | 'none' {
  if (upload?.previewUrl) return 'upload';
  if (drink && isSheetDrink(post, drink)) return 'drink';
  if (post.slides?.length) return 'photo';
  return 'none';
}
