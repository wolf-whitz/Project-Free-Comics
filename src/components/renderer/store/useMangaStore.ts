import { create } from "zustand"

type MangaDetails = {
  manga_id: string
  manga_name?: string
  manga_description?: string
  manga_image?: string
  genres?: string[]
  manga_chapters?: { title: string; url: string }[]
}

type PageImage = { page: number; image: string }

type MangaField = "manga_id" | "manga_name" | "manga_description" | "genres" | "manga_image" | "manga_chapters"

interface ReaderStore {
  mangaId: string
  connectionUrl: string
  spiderName: string
  fields: MangaField[]
  details: MangaDetails | null
  loadingDetails: boolean
  errorDetails: string | null
  currentChapter: number
  images: PageImage[]
  nextStart: number
  loadingPages: boolean
  setParams: (mangaId: string, connectionUrl: string, spiderName: string, fields?: MangaField[]) => void
  setCurrentChapter: (chapter: number) => void
  addPages: (pages: PageImage[]) => void
  setNextStart: (next: number) => void
  setLoadingPages: (loading: boolean) => void
  resetPages: () => void
  resetAll: () => void
}

export const useReaderStore = create<ReaderStore>((set, get) => ({
  mangaId: "",
  connectionUrl: "",
  spiderName: "",
  fields: ["manga_id", "manga_name", "manga_description", "genres", "manga_image", "manga_chapters"],
  details: null,
  loadingDetails: false,
  errorDetails: null,
  currentChapter: 0,
  images: [],
  nextStart: 1,
  loadingPages: false,

  setParams: (mangaId, connectionUrl, spiderName, fields) =>
    set({ mangaId, connectionUrl, spiderName, fields: fields || get().fields }),

  setCurrentChapter: (chapter) =>
    set({ currentChapter: chapter, images: [], nextStart: 1 }),

  addPages: (pages) => set((state) => ({ images: [...state.images, ...pages] })),
  setNextStart: (next) => set({ nextStart: next }),
  setLoadingPages: (loading) => set({ loadingPages: loading }),
  resetPages: () => set({ images: [], nextStart: 1, loadingPages: false }),
  resetAll: () =>
    set({
      mangaId: "",
      connectionUrl: "",
      spiderName: "",
      fields: ["manga_id", "manga_name", "manga_description", "genres", "manga_image", "manga_chapters"],
      details: null,
      loadingDetails: false,
      errorDetails: null,
      currentChapter: 0,
      images: [],
      nextStart: 1,
      loadingPages: false,
    }),
}))
