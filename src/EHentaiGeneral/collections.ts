export async function addToFavorite(mangaid: string, cetegoryId: string) {
  const favcat = cetegoryId.split("favcat=")[1];
  const [gid, t] = mangaid.split("/");
  await Application.scheduleRequest({
    url: `https://e-hentai.org/gallerypopups.php?gid=${gid}&t=${t}&act=addfav`,
    method: "POST",
    body: `favcat=${favcat}&favnote=&apply=Add+to+Favorites&update=1`,
  });
}

export async function deleteFromFavorite(mangaid: string) {
  const [gid, t] = mangaid.split("/");
  await Application.scheduleRequest({
    url: `https://e-hentai.org/gallerypopups.php?gid=${gid}&t=${t}&act=addfav`,
    method: "POST",
    body: `favcat=favdel&favnote=&apply=Apply+Changes&update=1`,
  });
}
