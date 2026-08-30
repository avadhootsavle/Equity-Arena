const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const file1 = '/Users/avadhootsavle/Desktop/IGNITE_8_0_Participants.xlsx';
  const file2 = '/Users/avadhootsavle/Desktop/ignite/IGNITE_8_0_Participants.xlsx';
  const filePath = fs.existsSync(file1) ? file1 : file2;

  console.log(`Loading Excel roster from: ${filePath}`);
  const wb = xlsx.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  console.log(`Total rows read from Excel: ${rows.length}`);

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rawName = String(r.Name || r['Full Name'] || r['Student Name'] || r.name || '').trim();
    const rawEmail = String(r.Email || r['Email Address'] || r.email || '').trim().toLowerCase();
    const rawPhone = String(r.Phone || r['Mobile'] || r['Phone Number'] || r.phone || '').trim().replace(/\D/g, '');

    if (!rawEmail || !rawPhone) {
      console.log(`Row ${i + 1} missing email/phone:`, r);
      skippedCount++;
      continue;
    }

    const cleanName = rawName || rawEmail.split('@')[0];

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: rawEmail }, { phone: rawPhone }]
      }
    });

    const passwordHash = await bcrypt.hash(rawPhone, 10);

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: cleanName,
          phone: rawPhone,
          passwordHash,
          isPreloaded: true
        }
      });
      updatedCount++;
    } else {
      await prisma.user.create({
        data: {
          name: cleanName,
          email: rawEmail,
          phone: rawPhone,
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
  }

  console.log('======================================================================');
  console.log(`✅ ROSTER SEEDING COMPLETE`);
  console.log(`   - Created Accounts: ${createdCount}`);
  console.log(`   - Updated Accounts: ${updatedCount}`);
  console.log(`   - Skipped Rows:     ${skippedCount}`);
  console.log(`   - Total Processed:  ${rows.length}`);
  console.log('======================================================================');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Seed initial roster error:', err);
  process.exit(1);
});
