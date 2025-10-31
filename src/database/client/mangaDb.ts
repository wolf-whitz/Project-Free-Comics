import localforage from "localforage";

const mangaDb = localforage.createInstance({
  name: "manga_collection_db",
  storeName: "manga",
});

export interface Manga {
  id: string;
  title: string;
  image: string;
  description: string;
}

export async function addManga(manga: Manga) {
  await mangaDb.setItem(manga.id, manga);
}

export async function getAllManga(): Promise<Manga[]> {
  const items: Manga[] = [];
  await mangaDb.iterate<Manga, void>((value) => {
    items.push(value);
  });
  return items;
}
