const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

async function importParticipants(filePath) {
  const fileToRead = filePath || '/Users/avadhootsavle/Desktop/IGNITE_8_0_Participants.xlsx';
  console.log(`Reading Excel file: ${fileToRead}`);

  const wb = xlsx.readFile(fileToRead);
  const sheetName = wb.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);

  let createdCount = 0;
  let skippedCount = 0;

  for (const row of rows) {
    // Flexible column header extraction
    const rawName = row.Name || row['Full Name'] || row['Student Name'] || row.name || '';
    const rawEmail = row.Email || row['Email Address'] || row.email || '';
    const rawPhone = String(row.Phone || row['Mobile'] || row['Phone Number'] || row.phone || '').trim();

    if (!rawEmail || !rawPhone) {
      console.log(`Skipping invalid row:`, row);
      skippedCount++;
      continue;
    }

    const cleanEmail = String(rawEmail).trim().toLowerCase();
    const cleanName = String(rawName).trim() || cleanEmail.split('@')[0];
    const cleanPhone = rawPhone.replace(/\D/g, ''); // Extract digits only

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { phone: cleanPhone }
        ]
      }
    });

    if (existingUser) {
      // Update existing user with phone if missing
      if (!existingUser.phone && cleanPhone) {
        const passwordHash = await bcrypt.hash(cleanPhone, 10);
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            phone: cleanPhone,
            passwordHash,
            isPreloaded: true
          }
        });
      }
      skippedCount++;
      continue;
    }

    const passwordHash = await bcrypt.hash(cleanPhone, 10);

    await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash,
        role: 'TRADER',
        walletBalance: 20000,
        isTestAccount: false,
        isPreloaded: true,
        hasLoggedIn: false
      }
    });

    createdCount++;
  }

  console.log('======================================================================');
  console.log(`✅ ROSTER IMPORT COMPLETE`);
  console.log(`   - Created: ${createdCount} participants`);
  console.log(`   - Skipped (Duplicates/Existing): ${skippedCount} participants`);
  console.log('======================================================================');

  await prisma.$disconnect();
}

if (require.main === module) {
  const filePath = process.argv[2];
  importParticipants(filePath).catch((err) => {
    console.error('Import error:', err);
    process.exit(1);
  });
}

module.exports = { importParticipants };
