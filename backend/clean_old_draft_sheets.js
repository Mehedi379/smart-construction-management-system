const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanOldDraftSheets() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'construction_db'
    });

    console.log('\n🧹 CLEANING OLD DRAFT SHEETS\n');

    // Get all draft sheets
    const [drafts] = await conn.query(
        `SELECT ds.id, ds.sheet_no, ds.project_id, p.project_name, ds.date, ds.today_expense
         FROM daily_sheets ds
         LEFT JOIN projects p ON ds.project_id = p.id
         WHERE ds.status = 'draft'
         ORDER BY ds.project_id, ds.date DESC, ds.id DESC`
    );

    console.log(`Found ${drafts.length} draft sheets:\n`);

    // Keep only the latest draft per project per day
    const sheetsToKeep = new Map();
    const sheetsToDelete = [];

    drafts.forEach(sheet => {
        const key = `${sheet.project_id}-${sheet.date}`;
        if (sheetsToKeep.has(key)) {
            sheetsToDelete.push(sheet);
        } else {
            sheetsToKeep.set(key, sheet);
        }
    });

    console.log(`✅ Keeping ${sheetsToKeep.size} latest draft(s):\n`);
    sheetsToKeep.forEach(sheet => {
        console.log(`   Sheet ${sheet.sheet_no} - ${sheet.project_name} (${sheet.date}) - ৳${sheet.today_expense}`);
    });

    if (sheetsToDelete.length > 0) {
        console.log(`\n🗑️  Deleting ${sheetsToDelete.length} old duplicate draft(s):\n`);
        
        for (const sheet of sheetsToDelete) {
            console.log(`   Deleting Sheet ${sheet.sheet_no} - ${sheet.project_name}`);
            
            // Delete signature requests first
            await conn.query('DELETE FROM signature_requests WHERE sheet_id = ?', [sheet.id]);
            
            // Delete sheet
            await conn.query('DELETE FROM daily_sheets WHERE id = ?', [sheet.id]);
        }

        console.log(`\n✅ Successfully deleted ${sheetsToDelete.length} old draft sheets`);
    } else {
        console.log('\n✅ No duplicate drafts to delete');
    }

    // Show final count
    const [remaining] = await conn.query(
        `SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as drafts,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
         FROM daily_sheets`
    );

    console.log('\n📊 FINAL SHEET COUNT:');
    console.log(`   Total: ${remaining[0].total}`);
    console.log(`   Draft: ${remaining[0].drafts}`);
    console.log(`   Pending: ${remaining[0].pending}`);
    console.log(`   Approved: ${remaining[0].approved}`);

    await conn.end();
}

cleanOldDraftSheets().catch(console.error);
