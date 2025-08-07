const express = require('express');
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const app = express();
const path = require('path');
const bodyParser = require('body-parser');

const port = 3000;

const dbConfig = {
    host: '103.76.181.219',
    user: 'irite',
    password: 'F5S27Euh',
    database: 'irite'
};

app.use(express.static(path.join(__dirname, 'assets')));

// Parse form data

app.get('/sumary_checkin', async (req, res) => {
    const uid = req.query.uid;
    console.log(uid)
    try {
        const connection = await mysql.createConnection(dbConfig);

        const [incident] = await connection.execute(`
            SELECT i.report_number, i.report_from_where, i.report_officer, i.create_date
            FROM eventreport i     
            WHERE i.uid = ?
        `, [uid]);

        const [incident] = await connection.execute(`
            SELECT i.report_number, i.report_from_where, i.report_officer, i.create_date
            FROM eventreport i     
            WHERE i.uid = ?
        `, [uid]);


        await connection.end();



        if (incident.length === 0) {
            return res.status(404).send('Incident not found');
        }

        const data = incident[0];

        let header = await fs.readFile('./views/header.html', 'utf8');
        let table = await fs.readFile('./views/body.html', 'utf8');
        let footer = await fs.readFile('./views/footer.html', 'utf8');

        Object.keys(data).forEach(key => {
            table = table.replace(`{{${key}}}`, data[key] ?? '');
        });

        res.send(header + table + footer);

    } catch (error) {
        console.error(error);
        res.status(500).send('Database error');
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});