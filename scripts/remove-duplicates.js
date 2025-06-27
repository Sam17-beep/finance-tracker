import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeDuplicateTransactions() {
  console.log('Starting duplicate transaction removal...');
  
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

    // Step 3: For each group, keep the most recent transaction and delete the rest
    let totalDeleted = 0;
    let totalGroupsProcessed = 0;

    for (const group of groups) {
      if (!group || group.length === 0) continue;
      
      console.log(`\nProcessing group with ${group.length} duplicates:`);
      console.log(`  Name: "${group[0]?.name || 'Unknown'}"`);
      console.log(`  Amount: ${group[0]?.amount || 'Unknown'}`);
      console.log(`  Date: ${group[0]?.date?.toISOString() || 'Unknown'}`);

      // Sort by updatedAt to keep the most recently updated transaction
      group.sort((a, b) => {
        if (!a?.updatedAt || !b?.updatedAt) return 0;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      
      const toKeep = group[0];
      const toDelete = group.slice(1);

      if (!toKeep) continue;

      console.log(`  Keeping transaction ID: ${toKeep.id} (updated: ${toKeep.updatedAt})`);
      console.log(`  Deleting ${toDelete.length} duplicates: ${toDelete.map(t => t?.id || 'unknown').join(', ')}`);

      // Delete the duplicate transactions
      const deleteResult = await prisma.transaction.deleteMany({
        where: {
          id: {
            in: toDelete.filter(t => t?.id).map(t => t.id)
          }
        }
      });

      totalDeleted += deleteResult.count;
      totalGroupsProcessed++;

      console.log(`  Successfully deleted ${deleteResult.count} transactions`);
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total groups processed: ${totalGroupsProcessed}`);
    console.log(`Total transactions deleted: ${totalDeleted}`);
    console.log(`Total transactions remaining: ${allTransactions.length - totalDeleted}`);

    // Step 4: Verify the cleanup
    const remainingTransactions = await prisma.transaction.count();
    console.log(`\nVerification: ${remainingTransactions} transactions remain in database`);

  } catch (error) {
    console.error('Error removing duplicate transactions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
removeDuplicateTransactions()
  .then(() => {
    console.log('\nDuplicate removal completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nDuplicate removal failed:', error);
    process.exit(1);
  }); 