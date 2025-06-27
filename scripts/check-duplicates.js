import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicateTransactions() {
  console.log('Checking for duplicate transactions (DRY RUN - no deletions)...');
  
  try {
    // Step 1: Find all transactions grouped by name, amount, and date (within 1 minute tolerance)
    console.log('Finding duplicate transactions...');
    
    const allTransactions = await prisma.transaction.findMany({
      orderBy: [
        { name: 'asc' },
        { amount: 'asc' },
        { date: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        amount: true,
        date: true,
        categoryId: true,
        subcategoryId: true,
        isDiscarded: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log(`Found ${allTransactions.length} total transactions`);

    // Step 2: Group transactions by similarity
    const groups = [];
    const processedIds = new Set();

    for (let i = 0; i < allTransactions.length; i++) {
      const currentTransaction = allTransactions[i];
      if (!currentTransaction || processedIds.has(currentTransaction.id)) continue;

      const current = currentTransaction;
      const group = [current];
      processedIds.add(current.id);

      // Find similar transactions
      for (let j = i + 1; j < allTransactions.length; j++) {
        const candidateTransaction = allTransactions[j];
        if (!candidateTransaction || processedIds.has(candidateTransaction.id)) continue;

        const candidate = candidateTransaction;

        // Check if transactions are similar (same name, similar amount, similar date)
        const nameMatch = current.name === candidate.name;
        const amountMatch = Math.abs(Number(current.amount) - Number(candidate.amount)) < 0.01;
        const dateMatch = Math.abs(current.date.getTime() - candidate.date.getTime()) < 60000; // 1 minute tolerance

        if (nameMatch && amountMatch && dateMatch) {
          group.push(candidate);
          processedIds.add(candidate.id);
        }
      }

      if (group.length > 1) {
        groups.push(group);
      }
    }

    console.log(`Found ${groups.length} groups of duplicate transactions`);

    // Step 3: Show what would be deleted (dry run)
    let totalWouldDelete = 0;
    let totalGroupsFound = 0;

    for (const group of groups) {
      if (!group || group.length === 0) continue;
      
      console.log(`\nGroup with ${group.length} duplicates:`);
      console.log(`  Name: "${group[0]?.name || 'Unknown'}"`);
      console.log(`  Amount: ${group[0]?.amount || 'Unknown'}`);
      console.log(`  Date: ${group[0]?.date?.toISOString() || 'Unknown'}`);

      // Sort by updatedAt to show which would be kept
      group.sort((a, b) => {
        if (!a?.updatedAt || !b?.updatedAt) return 0;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      
      const wouldKeep = group[0];
      const wouldDelete = group.slice(1);

      if (!wouldKeep) continue;

      console.log(`  Would KEEP: ID ${wouldKeep.id} (updated: ${wouldKeep.updatedAt})`);
      console.log(`  Would DELETE: ${wouldDelete.length} transactions: ${wouldDelete.map(t => t?.id || 'unknown').join(', ')}`);

      totalWouldDelete += wouldDelete.length;
      totalGroupsFound++;
    }

    console.log(`\n=== DRY RUN SUMMARY ===`);
    console.log(`Total groups found: ${totalGroupsFound}`);
    console.log(`Total transactions that would be deleted: ${totalWouldDelete}`);
    console.log(`Total transactions that would remain: ${allTransactions.length - totalWouldDelete}`);

    if (totalWouldDelete > 0) {
      console.log(`\nTo actually remove duplicates, run: npm run db:remove-duplicates`);
    } else {
      console.log(`\nNo duplicates found!`);
    }

  } catch (error) {
    console.error('Error checking duplicate transactions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkDuplicateTransactions()
  .then(() => {
    console.log('\nDuplicate check completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nDuplicate check failed:', error);
    process.exit(1);
  }); 