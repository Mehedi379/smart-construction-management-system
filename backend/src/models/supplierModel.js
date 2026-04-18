const pool = require('../config/database');

// Supplier Model
exports.createSupplier = async (supplierData) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const supplierCode = supplierData.supplier_code || `SUP${Date.now()}`;
        // Map frontend field names to database column names
        const supplierName = supplierData.shop_name || supplierData.name;
        const contactPerson = supplierData.owner_name || supplierData.contact_person;
        
        const [result] = await conn.query(
            `INSERT INTO suppliers (
                supplier_code, name, contact_person, phone, email, 
                address, notes, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
            [
                supplierCode,
                supplierName,
                contactPerson || null,
                supplierData.phone || null,
                supplierData.email || null,
                supplierData.address || null,
                supplierData.notes || null
            ]
        );

        await conn.commit();
        return { id: result.insertId, supplier_code: supplierCode };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

exports.getSuppliers = async (filters = {}) => {
    let query = 'SELECT * FROM suppliers WHERE 1=1';
    const params = [];

    if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
    }

    if (filters.category) {
        query += ' AND category = ?';
        params.push(filters.category);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
};

exports.getSupplierById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [id]);
    return rows[0];
};

exports.updateSupplier = async (id, supplierData) => {
    // Map frontend field names to database column names
    const supplierName = supplierData.shop_name || supplierData.name;
    const contactPerson = supplierData.owner_name || supplierData.contact_person;
    
    await pool.query(
        `UPDATE suppliers SET 
            name = ?, contact_person = ?, phone = ?, email = ?,
            address = ?, notes = ?, status = ?
         WHERE id = ?`,
        [
            supplierName,
            contactPerson,
            supplierData.phone,
            supplierData.email,
            supplierData.address,
            supplierData.notes,
            supplierData.status,
            id
        ]
    );
    return { id };
};

exports.getSupplierStats = async (supplierId) => {
    const [stats] = await pool.query(
        `SELECT 
            COALESCE(SUM(total_amount), 0) as total_purchase,
            COALESCE(SUM(paid_amount), 0) as total_paid,
            COALESCE(SUM(due_amount), 0) as due_amount
         FROM purchases 
         WHERE supplier_id = ?`,
        [supplierId]
    );
    return stats[0];
};

// Purchase Model
exports.createPurchase = async (purchaseData) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const purchaseNo = purchaseData.purchase_no || `PUR${Date.now()}`;
        const totalAmount = parseFloat(purchaseData.total_amount);
        const paidAmount = parseFloat(purchaseData.paid_amount || 0);
        const dueAmount = totalAmount - paidAmount;
        
        let paymentStatus = 'paid';
        if (dueAmount > 0 && paidAmount > 0) {
            paymentStatus = 'partial';
        } else if (dueAmount > 0 && paidAmount === 0) {
            paymentStatus = 'due';
        }

        // Create purchase
        const [result] = await conn.query(
            `INSERT INTO purchases (
                purchase_no, purchase_date, supplier_id, project_id, category,
                subtotal, discount, total_amount, paid_amount, due_amount,
                payment_method, payment_status, slip_image, notes, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                purchaseNo,
                purchaseData.purchase_date,
                purchaseData.supplier_id || null,
                purchaseData.project_id || null,
                purchaseData.category,
                purchaseData.subtotal || totalAmount,
                purchaseData.discount || 0,
                totalAmount,
                paidAmount,
                dueAmount,
                purchaseData.payment_method || 'cash',
                paymentStatus,
                purchaseData.slip_image || null,
                purchaseData.notes || null,
                purchaseData.created_by
            ]
        );

        // Create purchase items
        if (purchaseData.items && purchaseData.items.length > 0) {
            for (const item of purchaseData.items) {
                await conn.query(
                    `INSERT INTO purchase_items (
                        purchase_id, item_name, description, quantity, unit, 
                        unit_price, total_price
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        result.insertId,
                        item.item_name,
                        item.description || null,
                        item.quantity || 1,
                        item.unit || 'piece',
                        item.unit_price,
                        item.total_price
                    ]
                );
            }
        }

        // Update supplier stats
        if (purchaseData.supplier_id) {
            await conn.query(
                `UPDATE suppliers SET 
                    total_purchase = total_purchase + ?,
                    total_paid = total_paid + ?,
                    due_amount = due_amount + ?
                 WHERE id = ?`,
                [totalAmount, paidAmount, dueAmount, purchaseData.supplier_id]
            );
        }

        await conn.commit();
        return { id: result.insertId, purchase_no: purchaseNo, due_amount: dueAmount };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

exports.getPurchases = async (filters = {}) => {
    let query = `SELECT p.*, s.name as supplier_name 
                 FROM purchases p 
                 LEFT JOIN suppliers s ON p.supplier_id = s.id 
                 WHERE 1=1`;
    const params = [];

    if (filters.category) {
        query += ' AND p.category = ?';
        params.push(filters.category);
    }

    if (filters.project_id) {
        query += ' AND p.project_id = ?';
        params.push(filters.project_id);
    }

    if (filters.supplier_id) {
        query += ' AND p.supplier_id = ?';
        params.push(filters.supplier_id);
    }

    if (filters.payment_status) {
        query += ' AND p.payment_status = ?';
        params.push(filters.payment_status);
    }

    if (filters.from_date) {
        query += ' AND p.purchase_date >= ?';
        params.push(filters.from_date);
    }

    if (filters.to_date) {
        query += ' AND p.purchase_date <= ?';
        params.push(filters.to_date);
    }

    query += ' ORDER BY p.purchase_date DESC';

    const [rows] = await pool.query(query, params);
    return rows;
};

exports.getPurchaseById = async (id) => {
    const [purchases] = await pool.query(
        `SELECT p.*, s.name as supplier_name 
         FROM purchases p 
         LEFT JOIN suppliers s ON p.supplier_id = s.id 
         WHERE p.id = ?`,
        [id]
    );

    if (purchases.length === 0) return null;

    const [items] = await pool.query(
        'SELECT * FROM purchase_items WHERE purchase_id = ? ORDER BY id',
        [id]
    );

    return { ...purchases[0], items };
};

exports.addPayment = async (paymentData) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Add payment record
        await conn.query(
            `INSERT INTO supplier_payments (
                supplier_id, purchase_id, payment_date, amount, 
                payment_method, reference_no, notes, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                paymentData.supplier_id,
                paymentData.purchase_id || null,
                paymentData.payment_date,
                paymentData.amount,
                paymentData.payment_method || 'cash',
                paymentData.reference_no || null,
                paymentData.notes || null,
                paymentData.created_by
            ]
        );

        // Update purchase due amount
        if (paymentData.purchase_id) {
            const [purchase] = await conn.query(
                'SELECT * FROM purchases WHERE id = ?',
                [paymentData.purchase_id]
            );

            if (purchase.length > 0) {
                const newPaid = parseFloat(purchase[0].paid_amount) + parseFloat(paymentData.amount);
                const newDue = parseFloat(purchase[0].total_amount) - newPaid;
                
                let newStatus = 'paid';
                if (newDue > 0 && newPaid > 0) {
                    newStatus = 'partial';
                }

                await conn.query(
                    `UPDATE purchases SET 
                        paid_amount = ?, due_amount = ?, payment_status = ?
                     WHERE id = ?`,
                    [newPaid, newDue, newStatus, paymentData.purchase_id]
                );
            }
        }

        // Update supplier stats
        await conn.query(
            `UPDATE suppliers SET 
                total_paid = total_paid + ?,
                due_amount = due_amount - ?
             WHERE id = ?`,
            [paymentData.amount, paymentData.amount, paymentData.supplier_id]
        );

        await conn.commit();
        return { success: true };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

exports.getPurchaseSummary = async (filters = {}) => {
    let query = `SELECT 
                    category,
                    COUNT(*) as count,
                    SUM(total_amount) as total_amount,
                    SUM(paid_amount) as total_paid,
                    SUM(due_amount) as total_due
                 FROM purchases 
                 WHERE 1=1`;
    const params = [];

    if (filters.from_date) {
        query += ' AND purchase_date >= ?';
        params.push(filters.from_date);
    }

    if (filters.to_date) {
        query += ' AND purchase_date <= ?';
        params.push(filters.to_date);
    }

    query += ' GROUP BY category ORDER BY total_amount DESC';

    const [rows] = await pool.query(query, params);
    return rows;
};
