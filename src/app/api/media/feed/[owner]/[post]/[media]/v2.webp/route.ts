import {serveFeedPhoto} from '@/lib/posts/feed-photo-response';
export const GET = (request: Request, context: {params: Promise<{owner:string;post:string;media:string}>}) => serveFeedPhoto(request,context,2);
