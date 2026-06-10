import { seedLottery } from "../src/lib/seeder";
import { LOTTERY_LIST } from "../src/lib/lotteries";

/**
 * Uso:
 *   pnpm seed            -> histórico completo das duas loterias
 *   pnpm seed 800        -> apenas os 800 concursos mais recentes
 */
async function main() {
  const arg = process.argv[2];
  const maxContests = arg ? parseInt(arg, 10) : undefined;

  for (const lottery of LOTTERY_LIST) {
    process.stdout.write(`\n▶ ${lottery.name}: buscando concursos...\n`);
    let lastLog = 0;
    const result = await seedLottery(lottery.id, maxContests, (done, total) => {
      const now = Date.now();
      if (now - lastLog > 1000 || done === total) {
        lastLog = now;
        const pct = ((done / total) * 100).toFixed(0);
        process.stdout.write(`  ${done}/${total} (${pct}%)\r`);
      }
    });
    process.stdout.write(
      `\n✓ ${lottery.name}: concurso atual ${result.latestContest}, ` +
        `${result.inserted} novos, ${result.totalStored} no total\n`
    );
  }
  process.stdout.write("\nConcluído.\n");
}

main().catch((err) => {
  console.error("Falha no seed:", err);
  process.exit(1);
});
