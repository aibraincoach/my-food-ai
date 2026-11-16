select count(*) as matching_posts, count(distinct user_id) as accounts, left(min(user_id::text), 8) as uid_prefix
from public.posts where left(id::text, 8) = '4dfe4411';
