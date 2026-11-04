'use client';
import PostDetailSkeleton from '@/components/PostDetailSkeleton';
import PostPageShell from '@/components/PostPageShell';

export default function Loading() {
  return <PostPageShell><PostDetailSkeleton /></PostPageShell>;
}
