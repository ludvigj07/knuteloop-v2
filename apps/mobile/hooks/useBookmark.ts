import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import {
  bookmarkKnute,
  unbookmarkKnute,
  type FeedResponse,
  type KnuterResponse,
} from '../lib/api'

type Vars = { knuteId: string; next: boolean }

// Toggle a bookmark on a knute. Optimistic: every cached copy of the knute —
// feed pages and the catalog/folder/bookmark lists — flips isBookmarked at
// once, so the button never lags behind the tap. On failure the caches are
// restored and the button simply flips back (visible, calm feedback — no
// alert). The bookmark list itself is refetched afterwards so an unbookmarked
// knute drops out of it.
export function useToggleBookmark() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ knuteId, next }: Vars) =>
      next ? bookmarkKnute(knuteId) : unbookmarkKnute(knuteId),

    onMutate: async ({ knuteId, next }) => {
      // Stop in-flight refetches from overwriting the optimistic state.
      await Promise.all([
        qc.cancelQueries({ queryKey: ['feed'] }),
        qc.cancelQueries({ queryKey: ['knuter'] }),
      ])

      const prevFeed = qc.getQueryData<InfiniteData<FeedResponse>>(['feed'])
      const prevKnuter = qc.getQueriesData<KnuterResponse>({ queryKey: ['knuter'] })

      qc.setQueryData<InfiniteData<FeedResponse>>(['feed'], (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                feed: page.feed.map((item) =>
                  item.knuteId === knuteId ? { ...item, isBookmarked: next } : item,
                ),
              })),
            }
          : old,
      )
      qc.setQueriesData<KnuterResponse>({ queryKey: ['knuter'] }, (old) =>
        old
          ? {
              ...old,
              knuter: old.knuter.map((k) => (k.id === knuteId ? { ...k, isBookmarked: next } : k)),
            }
          : old,
      )

      return { prevFeed, prevKnuter }
    },

    onError: (_error, _vars, ctx) => {
      if (!ctx) return
      qc.setQueryData(['feed'], ctx.prevFeed)
      for (const [key, data] of ctx.prevKnuter) qc.setQueryData(key, data)
    },

    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['knuter', 'bookmarks'] })
    },
  })
}
