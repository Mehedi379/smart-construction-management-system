// Check employee categories
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkEmployeeCategories() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'construction_db'
    });

    console.log('\n🔍 Checking Employee Categories...\n');

    // Check all employees
    const [employees] = await conn.query(
        `SELECT 
            e.id,
            e.user_id,
            e.employee_id,
            e.name,
            e.category,
            e.designation,
            e.assigned_project_id,
            p.project_code,
            p.project_name,
            u.role
         FROM employees e
         LEFT JOIN projects p ON e.assigned_project_id = p.id
         LEFT JOIN users u ON e.user_id = u.id
         ORDER BY e.assigned_project_id, e.id`
    );

    console.log(`📊 Total Employees: ${employees.length}\n`);

    if (employees.length === 0) {
        console.log('❌ NO EMPLOYEES FOUND in database!');
    } else {
        console.log('Employee List:');
        console.log('   ' + '-'.repeat(80));
        employees.forEach(emp => {
            console.log(`   ID: ${emp.id}`);
            console.log(`   Name: ${emp.name}`);
            console.log(`   Category: ${emp.category || 'NULL'}`);
            console.log(`   Designation: ${emp.designation || 'NULL'}`);
            console.log(`   Role: ${emp.role}`);
            console.log(`   Project: ${emp.project_code} - ${emp.project_name}`);
            console.log('   ' + '-'.repeat(80));
        });

        // Count by category
        const categoryCount = {};
        employees.forEach(emp => {
            const cat = emp.category || 'NULL/EMPTY';
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });

        console.log('\n📊 Category Breakdown:');
        Object.keys(categoryCount).forEach(cat => {
            console.log(`   ${cat}: ${categoryCount[cat]}`);
        });

        // Count by project
        const projectCount = {};
        employees.forEach(emp => {
            const proj = emp.project_code || 'NO PROJECT';
            projectCount[proj] = (projectCount[proj] || 0) + 1;
        });

        console.log('\n📊 Project Breakdown:');
        Object.keys(projectCount).forEach(proj => {
            console.log(`   ${proj}: ${projectCount[proj]}`);
        });
    }

    await conn.end();
}

checkEmployeeCategories().catch(console.error);
