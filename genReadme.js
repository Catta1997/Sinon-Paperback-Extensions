const sources = [
  ["E-Hentai", ["🔞", "Multi-Language"], "manga"],
  ["GTOTheGreatSite", ["🇮🇹"], "manga"],
  ["HastaTeam", ["🇮🇹"], "manga"],
  ["HastaTeamDDT", ["🇮🇹"], "manga"],
  ["HentaiHand", ["🔞", "Multi-Language"], "manga"],
  ["LupiTeam", ["🇮🇹"], "manga"],
  ["PhoenixScans", ["🇮🇹"], "manga"],
  ["RokuHentai", ["🔞", "Multi-Language"], "manga"],
  ["TuttoAnimeManga", ["🇮🇹"], "manga"],
  ["BlueSolo", ["🇫🇷"], "manga"],
  ["FMTeam", ["🇫🇷"], "manga"],
  ["HNIScanTrad", ["Multi-Language"], "manga"],

  ["NovelBuddy", ["ENG"], "novel"],
  ["NovelsOnline", ["ENG"], "novel"],
  ["LNori", ["ENG"], "novel"],
];
let md = ""

for (const source of sources) {
  md += `- ${source[0]}\n`
}

fs.writeFileSync("README.md", md)
