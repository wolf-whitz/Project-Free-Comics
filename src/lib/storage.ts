import localforage from "localforage";

localforage.config({
  name: "user_data_db",
  storeName: "settings",
});

export async function saveReaderUrl(url: string) {
  await localforage.setItem("readerUrl", url);
}

export async function getReaderUrl(): Promise<string | null> {
  const url = await localforage.getItem<string>("readerUrl");
  return url || null;
}

export async function saveManifest(manifest: any) {
  await localforage.setItem("manifest", manifest);
}

export async function getManifest(): Promise<any | null> {
  const manifest = await localforage.getItem<any>("manifest");
  return manifest || null;
}
